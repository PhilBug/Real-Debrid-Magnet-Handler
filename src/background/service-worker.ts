import browser from 'webextension-polyfill'
import { storage } from '../utils/storage'
import { rdAPI } from '../utils/realdebrid-api'
import type { TorrentItem } from '../utils/types'

const POLL_ALARM = 'poll-torrents'
const POLL_INTERVAL_MS = 5000 // 5 seconds

// Constants
const DEFAULT_MAX_RETRY_DURATION = 300 // 5 minutes in seconds

// Helper: Schedule next alarm
function scheduleNextAlarm() {
  browser.alarms.create(POLL_ALARM, { when: Date.now() + POLL_INTERVAL_MS })
}

// Helper: Extract hash from magnet link
function extractHashFromMagnet(magnetLink: string): string | null {
  const match = magnetLink.match(/xt=urn:btih:([a-fA-F0-9]{40})/i)
  return match ? match[1].toLowerCase() : null
}

// Setup alarm on install
browser.runtime.onInstalled.addListener(() => {
  scheduleNextAlarm()
})

// Handle alarm for polling
browser.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === POLL_ALARM) {
    await checkPendingTorrents()
    scheduleNextAlarm()
  }
})

// Handle messages from popup
browser.runtime.onMessage.addListener(async (message: unknown) => {
  const msg = message as { type?: string; magnetLink?: string; torrentId?: string }

  if (msg.type === 'ADD_MAGNET') {
    return await handleAddMagnet(msg.magnetLink || '')
  } else if (msg.type === 'RETRY_TORRENT') {
    return await handleRetry(msg.torrentId || '')
  }
})

// Add magnet link
async function handleAddMagnet(magnetLink: string) {
  const settings = await storage.getSettings()
  if (!settings.apiToken) {
    return { error: 'API token not configured' }
  }

  // Extract hash to check for duplicates
  const hash = extractHashFromMagnet(magnetLink)
  if (!hash) {
    return { error: 'Invalid magnet link' }
  }

  // Check local storage first
  const existingTorrents = await storage.getTorrents()
  const localDuplicate = existingTorrents.find(t => t.hash === hash)
  if (localDuplicate) {
    return { error: 'Torrent already exists', duplicate: localDuplicate }
  }

  // Check Real-Debrid for already-converted torrents
  try {
    const rdTorrents = await rdAPI.getTorrents()
    const rdTorrent = rdTorrents.find(t => t.hash === hash)

    if (rdTorrent) {
      if (rdTorrent.status === 'downloaded' && rdTorrent.links?.[0]) {
        // Reuse existing torrent - fetch unrestricted link
        const unrestricted = await rdAPI.unrestrictLink(rdTorrent.links[0])

        const torrent: TorrentItem = {
          id: rdTorrent.id,
          magnetLink,
          hash,
          filename: rdTorrent.filename,
          downloadUrl: unrestricted.download,
          status: 'ready',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        }

        await storage.addTorrent(torrent)
        return { success: true, torrent, reused: true }
      } else if (rdTorrent.status === 'error' || rdTorrent.status === 'dead') {
        // Re-add if previous attempt failed
        // Fall through to addMagnet below
      } else {
        // Still processing - just track it
        const torrent: TorrentItem = {
          id: rdTorrent.id,
          magnetLink,
          hash,
          filename: rdTorrent.filename || 'Processing...',
          downloadUrl: null,
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        }

        await storage.addTorrent(torrent)
        return { success: true, torrent, reused: true }
      }
    }
  } catch (error) {
    console.error('Failed to check RD torrents:', error)
    // Continue to addMagnet on error
  }

  // Add new magnet if not found on RD
  try {
    const response = await rdAPI.addMagnet(magnetLink)

    const torrent: TorrentItem = {
      id: response.id,
      magnetLink,
      hash,
      filename: 'Processing...',
      downloadUrl: null,
      status: 'processing',
      addedAt: Date.now(),
      lastRetry: Date.now(),
      retryCount: 0,
    }

    await storage.addTorrent(torrent)
    return { success: true, torrent }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { error: errorMessage }
  }
}

// Retry torrent
async function handleRetry(torrentId: string) {
  const torrents = await storage.getTorrents()
  const torrent = torrents.find(t => t.id === torrentId)

  if (torrent) {
    torrent.status = 'processing'
    torrent.lastRetry = Date.now()
    torrent.retryCount += 1
    await storage.saveTorrents(torrents)
  }

  return { success: true }
}

// Check pending torrents
async function checkPendingTorrents() {
  const settings = await storage.getSettings()
  if (!settings.apiToken) return

  const torrents = await storage.getTorrents()
  const processingTorrents = torrents.filter(t => t.status === 'processing')

  if (processingTorrents.length === 0) return

  const maxRetryDuration = settings.maxRetryDuration || DEFAULT_MAX_RETRY_DURATION
  let hasChanges = false

  for (const torrent of processingTorrents) {
    const elapsed = (Date.now() - torrent.addedAt) / 1000

    // Check for timeout
    if (elapsed > maxRetryDuration) {
      torrent.status = 'timeout'
      hasChanges = true
      continue
    }

    try {
      const info = await rdAPI.getTorrentInfo(torrent.id)

      // Update hash from API (for torrents added before hash field)
      if (info.hash && !torrent.hash) {
        torrent.hash = info.hash
        hasChanges = true
      }

      // Handle different statuses
      if (info.status === 'waiting_files_selection') {
        await rdAPI.selectFiles(torrent.id, 'all')
        hasChanges = true
      } else if (info.status === 'downloaded') {
        torrent.status = 'ready'
        torrent.filename = info.filename
        if (info.links?.[0]) {
          try {
            const unrestricted = await rdAPI.unrestrictLink(info.links[0])
            torrent.downloadUrl = unrestricted.download
          } catch (error) {
            console.error('Failed to unrestrict link:', error)
            torrent.downloadUrl = null
          }
        } else {
          torrent.downloadUrl = null
        }
        hasChanges = true
      } else if (info.status === 'error' || info.status === 'dead') {
        torrent.status = 'error'
        hasChanges = true
      } else if (info.filename && torrent.filename === 'Processing...') {
        // Update filename when available
        torrent.filename = info.filename
        hasChanges = true
      }
    } catch (error) {
      console.error('Polling error for torrent', torrent.id, error)
      // Don't set error status on polling errors - keep trying
    }
  }

  if (hasChanges) {
    await storage.saveTorrents(torrents)
  }
}

// Re-create alarm on startup (in case it was cleared)
browser.alarms.get(POLL_ALARM).then(alarm => {
  if (!alarm) {
    scheduleNextAlarm()
  }
})

console.log('Real-Debrid Magnet Handler service worker loaded')
