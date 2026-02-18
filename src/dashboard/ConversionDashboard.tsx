import React, { useSyncExternalStore, useCallback, useMemo, useState } from 'react'
import browser from 'webextension-polyfill'
import { storage } from '../utils/storage'
import type { ExtendedTorrentItem, TorrentItem } from '../utils/types'
import { Icon, Modal, Button } from '../components/common'
import { TorrentCard } from './TorrentCard'
import { BatchControls } from './BatchControls'
import { DarkModeToggle } from './DarkModeToggle'
import { DashboardFileSelector } from './DashboardFileSelector'
import { VersionBadge } from './VersionBadge'

// Custom hook for storage synchronization using useSyncExternalStore
function useStorage<T>(key: string, defaultValue: T): T {
  const snapshot = useSyncExternalStore(
    // Subscribe - listen to both storage changes and cache initialization
    callback => {
      const listener = (changes: { [key: string]: { newValue?: unknown } }, areaName: string) => {
        if (areaName === 'local' && changes[key]) {
          callback()
        }
      }
      browser.storage.onChanged.addListener(listener)
      // Also subscribe to cache initialization notifications
      const unsubscribeCache = storage.subscribe(callback)
      return () => {
        browser.storage.onChanged.removeListener(listener)
        unsubscribeCache()
      }
    },
    // Get snapshot - return cached value
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

  // State for file selector modal
  const [selectingFilesTorrentId, setSelectingFilesTorrentId] = useState<string | null>(null)

  // State for remove confirmation modal
  const [removeConfirmTorrent, setRemoveConfirmTorrent] = useState<ExtendedTorrentItem | null>(null)

  // Convert TorrentItem to ExtendedTorrentItem
  const extendedTorrents: ExtendedTorrentItem[] = useMemo(() => {
    return torrents.map(torrent => ({
      ...torrent,
      lastUpdated: torrent.addedAt,
    }))
  }, [torrents])

  // Calculate counts for batch controls and stats
  const { total, processing, ready, failedCount, completedCount, selectingFilesCount } =
    useMemo(() => {
      const total = extendedTorrents.length
      const processing = extendedTorrents.filter(t => t.status === 'processing').length
      const ready = extendedTorrents.filter(t => t.status === 'ready').length
      const selectingFilesCount = extendedTorrents.filter(
        t => t.status === 'selecting_files'
      ).length
      const failedTorrents = extendedTorrents.filter(
        t => t.status === 'error' || t.status === 'timeout'
      )
      const failedCount = failedTorrents.length
      const completedCount = ready

      return { total, processing, ready, failedCount, completedCount, selectingFilesCount }
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

  const handleRemoveTorrent = useCallback((torrent: ExtendedTorrentItem) => {
    setRemoveConfirmTorrent(torrent)
  }, [])

  const confirmRemoveTorrent = useCallback(async () => {
    if (!removeConfirmTorrent) return
    try {
      await storage.removeTorrent(removeConfirmTorrent.id)
      setRemoveConfirmTorrent(null)
    } catch (error) {
      console.error('Failed to remove torrent:', error)
    }
  }, [removeConfirmTorrent])

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

  // Handle file selection
  const handleSelectFiles = useCallback((torrentId: string) => {
    setSelectingFilesTorrentId(torrentId)
  }, [])

  const handleFileSelectionConfirm = useCallback(
    async (torrentId: string, selectedFiles: string) => {
      try {
        await browser.runtime.sendMessage({
          type: 'SELECT_FILES',
          torrentId,
          selectedFiles,
        })
      } catch (error) {
        console.error('Failed to select files:', error)
      } finally {
        setSelectingFilesTorrentId(null)
      }
    },
    []
  )

  const handleFileSelectionCancel = useCallback(() => {
    setSelectingFilesTorrentId(null)
  }, [])

  // Get the torrent being selected
  const selectingTorrent = selectingFilesTorrentId
    ? extendedTorrents.find(t => t.id === selectingFilesTorrentId)
    : null

  return (
    <div className="conversion-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">REAL-DEBRID HANDLER</h1>
          <div className="dashboard-stats">
            <span className="dashboard-stat">
              <span className="dashboard-stat-value">{total}</span>
              <span className="dashboard-stat-label">Total</span>
            </span>
            <span className="dashboard-stat dashboard-stat--processing">
              <span className="dashboard-stat-value">{processing}</span>
              <span className="dashboard-stat-label">Processing</span>
            </span>
            <span className="dashboard-stat dashboard-stat--selecting">
              <span className="dashboard-stat-value">{selectingFilesCount}</span>
              <span className="dashboard-stat-label">Waiting</span>
            </span>
            <span className="dashboard-stat dashboard-stat--ready">
              <span className="dashboard-stat-value">{ready}</span>
              <span className="dashboard-stat-label">Ready</span>
            </span>
            <span className="dashboard-stat dashboard-stat--failed">
              <span className="dashboard-stat-value">{failedCount}</span>
              <span className="dashboard-stat-label">Failed</span>
            </span>
          </div>
        </div>
        <div className="dashboard-header-actions">
          <VersionBadge className="dashboard-version-badge" />
          <DarkModeToggle className="dashboard-dark-mode-toggle" />
        </div>
      </header>

      {/* Batch Controls */}
      <BatchControls
        failedCount={failedCount}
        completedCount={completedCount}
        onRetryFailed={handleRetryFailed}
        onClearCompleted={handleClearCompleted}
      />

      {/* Main Content */}
      <main className="dashboard-main">
        {extendedTorrents.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="empty-state-icon">
              <Icon name="download" size="xl" />
            </div>
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
                onSelectFiles={handleSelectFiles}
              />
            ))}
          </div>
        )}
      </main>

      {/* File Selector Modal */}
      {selectingFilesTorrentId && selectingTorrent && (
        <div className="dashboard-file-selector-overlay">
          <DashboardFileSelector
            torrentId={selectingFilesTorrentId}
            torrentFilename={selectingTorrent.filename}
            onConfirm={handleFileSelectionConfirm}
            onCancel={handleFileSelectionCancel}
          />
        </div>
      )}

      {/* Remove Torrent Confirmation Modal */}
      {removeConfirmTorrent && (
        <Modal
          isOpen={!!removeConfirmTorrent}
          onClose={() => setRemoveConfirmTorrent(null)}
          title="Remove Torrent"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRemoveConfirmTorrent(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmRemoveTorrent}>
                Remove
              </Button>
            </>
          }
        >
          <p>
            Are you sure you want to remove <strong>{removeConfirmTorrent.filename}</strong>?
          </p>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              marginTop: 'var(--space-2)',
            }}
          >
            This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}

export default ConversionDashboard
