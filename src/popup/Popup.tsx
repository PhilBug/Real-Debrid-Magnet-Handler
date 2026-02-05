import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import browser from 'webextension-polyfill'
import { storage } from '../utils/storage'
import { FileSelector } from './FileSelector'
import type { TorrentItem, RdTorrentInfo } from '../utils/types'
import '../styles/main.css'

function Popup() {
  const [magnetLink, setMagnetLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasToken, setHasToken] = useState(true)
  const [torrents, setTorrents] = useState<TorrentItem[]>([])
  const [selectingFilesTorrentId, setSelectingFilesTorrentId] = useState<string | null>(null)
  const [torrentInfoCache, setTorrentInfoCache] = useState<Map<string, RdTorrentInfo>>(new Map())

  useEffect(() => {
    checkToken()
    loadTorrents()
    loadPendingMagnet()

    // Subscribe to torrent list changes
    const listener = (changes: { [key: string]: { newValue?: unknown } }, areaName: string) => {
      if (areaName === 'local' && changes.torrents) {
        setTorrents((changes.torrents.newValue as TorrentItem[]) || [])
      }
    }
    browser.storage.onChanged.addListener(listener)
    return () => {
      browser.storage.onChanged.removeListener(listener)
    }
  }, [])

  const loadTorrents = async () => {
    try {
      const data = await browser.storage.local.get('torrents')
      setTorrents((data.torrents as TorrentItem[]) || [])
    } catch (e) {
      console.error('Failed to load torrents', e)
    }
  }

  const checkToken = async () => {
    const settings = await storage.getSettings()
    setHasToken(!!settings.apiToken)
  }

  const loadPendingMagnet = async () => {
    try {
      const data = await browser.storage.local.get('pendingMagnet')
      if (data.pendingMagnet && typeof data.pendingMagnet === 'string') {
        setMagnetLink(data.pendingMagnet)
        // Clear the pending magnet after loading
        await browser.storage.local.remove('pendingMagnet')
      }
    } catch (e) {
      console.error('Failed to load pending magnet', e)
    }
  }

  const isValidMagnet = (link: string): boolean => {
    return link.startsWith('magnet:?') && link.includes('xt=urn:btih:')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidMagnet(magnetLink)) {
      setError('Invalid magnet link format. Must start with "magnet:?" and contain "xt=urn:btih:"')
      return
    }

    if (!hasToken) {
      setError('API token not configured. Please visit Settings to add your token.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = (await browser.runtime.sendMessage({
        type: 'ADD_MAGNET',
        magnetLink,
      })) as { error?: string }

      if (response?.error) {
        setError(response.error)
      } else {
        setMagnetLink('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add magnet link')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (torrentId: string) => {
    await browser.runtime.sendMessage({
      type: 'RETRY_TORRENT',
      torrentId,
    })
  }

  const handleRemove = async (torrentId: string) => {
    await storage.removeTorrent(torrentId)
  }

  const handleSelectFiles = async (torrentId: string, selectedFiles: string) => {
    await browser.runtime.sendMessage({
      type: 'SELECT_FILES',
      torrentId,
      selectedFiles,
    })
    setSelectingFilesTorrentId(null)
  }

  const openFileSelector = async (torrentId: string) => {
    setSelectingFilesTorrentId(torrentId)
    // Fetch torrent info for file selection
    try {
      const response = (await browser.runtime.sendMessage({
        type: 'GET_TORRENT_INFO',
        torrentId,
      })) as { success?: boolean; info?: RdTorrentInfo }

      if (response?.success && response?.info) {
        setTorrentInfoCache(new Map(torrentInfoCache).set(torrentId, response.info))
      }
    } catch (error) {
      console.error('Failed to fetch torrent info:', error)
    }
  }

  const closeFileSelector = () => {
    setSelectingFilesTorrentId(null)
  }

  const getStatusIcon = (status: TorrentItem['status']): string => {
    switch (status) {
      case 'processing':
        return '⏳'
      case 'ready':
        return '📄'
      case 'error':
        return '❌'
      case 'timeout':
        return '⏱️'
      case 'selecting_files':
        return '📋'
      default:
        return '❓'
    }
  }

  const getStatusText = (torrent: TorrentItem): React.ReactNode => {
    if (torrent.status === 'ready' && torrent.downloadUrl) {
      return (
        <a
          href={torrent.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-xs hover:underline break-all"
        >
          {torrent.downloadUrl}
        </a>
      )
    }
    if (torrent.status === 'processing') {
      return '⏳ Converting...'
    }
    if (torrent.status === 'timeout') {
      return (
        <span className="text-orange-600 text-xs">
          ⏱️ Timeout -{' '}
          <button
            onClick={() => handleRetry(torrent.id)}
            className="ml-1 underline hover:no-underline"
          >
            Retry
          </button>
        </span>
      )
    }
    if (torrent.status === 'error') {
      return (
        <span className="text-red-600 text-xs">
          ❌ Error -{' '}
          <button
            onClick={() => handleRetry(torrent.id)}
            className="ml-1 underline hover:no-underline"
          >
            Retry
          </button>
        </span>
      )
    }
    if (torrent.status === 'selecting_files') {
      return (
        <span className="text-blue-600 text-xs">
          📋 Select files -{' '}
          <button
            onClick={() => openFileSelector(torrent.id)}
            className="ml-1 underline hover:no-underline"
          >
            Choose
          </button>
        </span>
      )
    }
    return 'Unknown status'
  }

  return (
    <div className="w-[400px] p-4 bg-gray-50 min-h-[300px]">
      <h1 className="text-xl font-bold mb-4 text-gray-900">Real-Debrid Magnet Handler</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={magnetLink}
          onChange={e => setMagnetLink(e.target.value)}
          placeholder="Paste magnet link here..."
          className="w-full p-2 border border-gray-300 rounded mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
          <button
            type="button"
            onClick={() => browser.runtime.openOptionsPage()}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {torrents.map(torrent => (
          <div key={torrent.id} className="bg-white p-3 rounded shadow border border-gray-200">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {getStatusIcon(torrent.status)} {torrent.filename}
                </div>
                <div className="mt-1 text-xs text-gray-600">{getStatusText(torrent)}</div>
              </div>
              <button
                onClick={() => handleRemove(torrent.id)}
                className="text-red-500 hover:text-red-700 text-lg leading-none"
                aria-label="Remove torrent"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {torrents.length === 0 && (
          <div className="text-gray-500 text-center py-8 text-sm">
            No torrents yet. Paste a magnet link above!
          </div>
        )}
      </div>

      {/* File Selector Modal */}
      {selectingFilesTorrentId && torrentInfoCache.get(selectingFilesTorrentId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-[500px] max-h-[80vh] overflow-y-auto">
            <FileSelector
              torrentInfo={torrentInfoCache.get(selectingFilesTorrentId)!}
              onConfirm={selectedFiles =>
                handleSelectFiles(selectingFilesTorrentId!, selectedFiles)
              }
              onCancel={closeFileSelector}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
}

export default Popup
