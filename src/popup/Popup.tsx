import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import browser from 'webextension-polyfill'
import { storage } from '../utils/storage'
import { FileSelector } from './FileSelector'
import type { TorrentItem, RdTorrentInfo } from '../utils/types'
import { Button, Input, Badge, Icon, ProgressBar } from '../components/common'

/**
 * Get the badge variant based on torrent status
 */
const getStatusBadgeVariant = (
  status: TorrentItem['status']
): 'processing' | 'ready' | 'error' | 'timeout' | 'selecting' => {
  switch (status) {
    case 'processing':
      return 'processing'
    case 'ready':
      return 'ready'
    case 'error':
      return 'error'
    case 'timeout':
      return 'timeout'
    case 'selecting_files':
      return 'selecting'
    default:
      return 'processing'
  }
}

function Popup() {
  const [magnetLink, setMagnetLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasToken, setHasToken] = useState(true)
  const [torrents, setTorrents] = useState<TorrentItem[]>([])
  const [selectingFilesTorrentId, setSelectingFilesTorrentId] = useState<string | null>(null)
  const [torrentInfoCache, setTorrentInfoCache] = useState<Map<string, RdTorrentInfo>>(new Map())
  // Initialize dark mode from storage
  useEffect(() => {
    const initDarkMode = async () => {
      // Check system preference for dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    initDarkMode()
  }, [])

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

  // Open dashboard in new tab
  const openDashboard = async () => {
    try {
      const dashboardUrl = browser.runtime.getURL('src/dashboard/dashboard.html')
      await browser.tabs.create({ url: dashboardUrl })
    } catch (error) {
      console.error('Failed to open dashboard:', error)
    }
  }

  // Open settings page
  const openSettings = async () => {
    try {
      await browser.runtime.openOptionsPage()
    } catch (error) {
      console.error('Failed to open settings:', error)
    }
  }

  // Calculate conversion counts for status bar
  const conversionCounts = {
    processing: torrents.filter(t => t.status === 'processing').length,
    ready: torrents.filter(t => t.status === 'ready').length,
    failed: torrents.filter(t => t.status === 'error' || t.status === 'timeout').length,
  }

  return (
    <div className="popup">
      {/* Header */}
      <header className="popup__header">
        <h1 className="popup__title">
          <span className="popup__title-prefix">rd://</span>
          <span>Real-Debrid Handler</span>
        </h1>
        <div className="popup__header-actions">
          <Button variant="ghost" size="sm" onClick={openSettings} aria-label="Open settings">
            <Icon name="sun" size="md" aria-label="Settings" />
          </Button>
        </div>
      </header>

      {/* Magnet Input Section */}
      <section className="popup__input-section">
        <form onSubmit={handleSubmit}>
          <Input
            terminal
            placeholder="paste_magnet_link_here..."
            value={magnetLink}
            onChange={e => setMagnetLink(e.target.value)}
            disabled={loading}
            aria-label="Magnet link input"
          />
          <div className="popup__input-row">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!hasToken}
            >
              {loading ? 'Converting...' : 'Convert'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={openSettings}
              aria-label="Open settings"
            >
              <Icon name="sun" size="md" />
            </Button>
          </div>
        </form>
      </section>

      {/* Status Bar */}
      {torrents.length > 0 && (
        <div className="popup__status-bar">
          <div className="popup__status-item">
            <Badge variant="processing" size="sm">
              {conversionCounts.processing} processing
            </Badge>
          </div>
          <div className="popup__status-item">
            <Badge variant="ready" size="sm">
              {conversionCounts.ready} ready
            </Badge>
          </div>
          {conversionCounts.failed > 0 && (
            <div className="popup__status-item">
              <Badge variant="error" size="sm">
                {conversionCounts.failed} error
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="popup__error" role="alert">
          {error}
        </div>
      )}

      {/* Torrent List */}
      <div className="popup__torrent-list">
        {torrents.length === 0 ? (
          <div className="popup__empty-state">
            <div className="popup__empty-icon">
              <Icon name="download" size="xl" />
            </div>
            <p className="popup__empty-text">No torrents yet. Paste a magnet link above!</p>
          </div>
        ) : (
          torrents.map(torrent => (
            <div key={torrent.id} className="popup__torrent-card">
              <div className="popup__torrent-header">
                <div className="popup__torrent-info">
                  <div className="popup__torrent-filename" title={torrent.filename}>
                    {torrent.filename}
                  </div>
                  <div className="popup__torrent-status">
                    <Badge
                      variant={getStatusBadgeVariant(torrent.status)}
                      size="sm"
                      icon={
                        torrent.status === 'processing' ? <Icon name="spinner" size="sm" /> : null
                      }
                    >
                      {torrent.status === 'processing' && 'Processing'}
                      {torrent.status === 'ready' && 'Ready'}
                      {torrent.status === 'error' && 'Error'}
                      {torrent.status === 'timeout' && 'Timeout'}
                      {torrent.status === 'selecting_files' && 'Select Files'}
                    </Badge>
                  </div>

                  {/* Progress bar for processing torrents - shown when status is processing */}
                  {torrent.status === 'processing' && (
                    <div className="popup__torrent-progress">
                      <ProgressBar value={0} variant="downloading" size="sm" indeterminate />
                    </div>
                  )}

                  {/* Download link for ready torrents */}
                  {torrent.status === 'ready' && torrent.downloadUrl && (
                    <a
                      href={torrent.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="popup__torrent-download-link"
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--accent-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      {torrent.downloadUrl}
                    </a>
                  )}

                  {/* Action buttons */}
                  <div className="popup__torrent-actions">
                    {(torrent.status === 'error' || torrent.status === 'timeout') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetry(torrent.id)}
                        leftIcon={<Icon name="refresh" size="sm" />}
                      >
                        Retry
                      </Button>
                    )}
                    {torrent.status === 'ready' && torrent.downloadUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(torrent.downloadUrl!)
                        }}
                        leftIcon={<Icon name="copy" size="sm" />}
                      >
                        Copy Link
                      </Button>
                    )}
                    {torrent.status === 'selecting_files' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openFileSelector(torrent.id)}
                      >
                        Choose Files
                      </Button>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  className="popup__torrent-remove"
                  onClick={() => handleRemove(torrent.id)}
                  aria-label="Remove torrent"
                >
                  <Icon name="x" size="md" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Footer link to dashboard */}
        {torrents.length > 0 && (
          <div className="popup__footer">
            <button type="button" onClick={openDashboard} className="popup__footer-link">
              Open Full Dashboard
              <Icon name="external-link" size="sm" />
            </button>
          </div>
        )}
      </div>

      {/* File Selector Modal */}
      {selectingFilesTorrentId && torrentInfoCache.get(selectingFilesTorrentId) && (
        <div className="popup__file-selector-overlay">
          <div className="popup__file-selector-content">
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
