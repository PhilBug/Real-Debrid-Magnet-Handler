import React, { useSyncExternalStore, useCallback, useMemo } from 'react'
import browser from 'webextension-polyfill'
import { storage } from '../utils/storage'
import type { ExtendedTorrentItem, TorrentItem } from '../utils/types'
import { TorrentCard } from './TorrentCard'
import { BatchControls } from './BatchControls'
import { DarkModeToggle } from './DarkModeToggle'

// Custom hook for storage synchronization using useSyncExternalStore
function useStorage<T>(key: string, defaultValue: T): T {
  const snapshot = useSyncExternalStore(
    // Subscribe
    callback => {
      const listener = (changes: { [key: string]: { newValue?: unknown } }, areaName: string) => {
        if (areaName === 'local' && changes[key]) {
          callback()
        }
      }
      browser.storage.onChanged.addListener(listener)
      return () => browser.storage.onChanged.removeListener(listener)
    },
    // Get snapshot
    () => {
      const cache = storage.getCache()
      return (cache[key] as T) ?? defaultValue
    }
  )
  return snapshot
}

export const ConversionDashboard: React.FC = () => {
  // Subscribe to torrent list changes
  const torrents = useStorage<TorrentItem[]>('torrents', [])

  // Convert TorrentItem to ExtendedTorrentItem
  const extendedTorrents: ExtendedTorrentItem[] = useMemo(() => {
    return torrents.map(torrent => ({
      ...torrent,
      lastUpdated: torrent.addedAt,
    }))
  }, [torrents])

  // Calculate counts for batch controls
  const { failedCount, completedCount } = useMemo(() => {
    return {
      failedCount: extendedTorrents.filter(t => t.status === 'error' || t.status === 'timeout')
        .length,
      completedCount: extendedTorrents.filter(t => t.status === 'ready').length,
    }
  }, [extendedTorrents])

  // Handle retry all failed
  const handleRetryFailed = useCallback(async () => {
    const failedTorrents = extendedTorrents.filter(
      t => t.status === 'error' || t.status === 'timeout'
    )

    if (failedTorrents.length === 0) return

    try {
      await browser.runtime.sendMessage({
        type: 'RETRY_ALL_FAILED',
        torrentIds: failedTorrents.map(t => t.id),
      })
    } catch (error) {
      console.error('Failed to retry torrents:', error)
    }
  }, [extendedTorrents])

  // Handle clear completed
  const handleClearCompleted = useCallback(async () => {
    const completedTorrents = extendedTorrents.filter(t => t.status === 'ready')

    if (completedTorrents.length === 0) return

    if (
      !confirm(
        `Clear ${completedTorrents.length} completed torrent${completedTorrents.length > 1 ? 's' : ''}?`
      )
    ) {
      return
    }

    try {
      await browser.runtime.sendMessage({
        type: 'CLEAR_COMPLETED',
      })
    } catch (error) {
      console.error('Failed to clear completed torrents:', error)
    }
  }, [extendedTorrents])

  // Handle individual torrent actions
  const handleRetryTorrent = useCallback(async (torrentId: string) => {
    try {
      await browser.runtime.sendMessage({
        type: 'RETRY_TORRENT',
        torrentId,
      })
    } catch (error) {
      console.error('Failed to retry torrent:', error)
    }
  }, [])

  const handleRemoveTorrent = useCallback(async (torrentId: string) => {
    try {
      await storage.removeTorrent(torrentId)
    } catch (error) {
      console.error('Failed to remove torrent:', error)
    }
  }, [])

  const handleCopyLinks = useCallback(
    async (torrentId: string) => {
      const torrent = extendedTorrents.find(t => t.id === torrentId)
      if (!torrent?.links || torrent.links.length === 0) return

      const linksText = torrent.links.map(link => `${link.filename}: ${link.url}`).join('\n')
      try {
        await navigator.clipboard.writeText(linksText)
        // Could show a toast notification here
      } catch (error) {
        console.error('Failed to copy links:', error)
      }
    },
    [extendedTorrents]
  )

  return (
    <div className="conversion-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Conversion Dashboard</h1>
          <div className="dashboard-stats">
            <span className="dashboard-stat">
              <span className="dashboard-stat-value">{extendedTorrents.length}</span>
              <span className="dashboard-stat-label">Total</span>
            </span>
            <span className="dashboard-stat">
              <span className="dashboard-stat-value">
                {extendedTorrents.filter(t => t.status === 'processing').length}
              </span>
              <span className="dashboard-stat-label">Processing</span>
            </span>
            <span className="dashboard-stat">
              <span className="dashboard-stat-value">{completedCount}</span>
              <span className="dashboard-stat-label">Ready</span>
            </span>
            <span className="dashboard-stat">
              <span className="dashboard-stat-value">{failedCount}</span>
              <span className="dashboard-stat-label">Failed</span>
            </span>
          </div>
        </div>
        <DarkModeToggle className="dashboard-dark-mode-toggle" />
      </header>

      <BatchControls
        failedCount={failedCount}
        completedCount={completedCount}
        onRetryFailed={handleRetryFailed}
        onClearCompleted={handleClearCompleted}
      />

      <main className="dashboard-main">
        {extendedTorrents.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="empty-state-icon">📦</div>
            <h2 className="empty-state-title">No torrents yet</h2>
            <p className="empty-state-description">
              Paste a magnet link in the popup to start converting torrents.
            </p>
          </div>
        ) : (
          <div className="torrent-list">
            {extendedTorrents.map(torrent => (
              <TorrentCard
                key={torrent.id}
                torrent={torrent}
                onRetry={handleRetryTorrent}
                onRemove={handleRemoveTorrent}
                onCopyLinks={handleCopyLinks}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ConversionDashboard
