import React from 'react'
import type { ExtendedTorrentItem } from '../utils/types'
import { ProgressIndicator } from './ProgressIndicator'
import { DownloadLinks } from './DownloadLinks'

interface TorrentCardProps {
  torrent: ExtendedTorrentItem
  onRetry?: (torrentId: string) => void
  onRemove?: (torrentId: string) => void
  onCopyLinks?: (torrentId: string) => void
}

export const TorrentCard: React.FC<TorrentCardProps> = ({
  torrent,
  onRetry,
  onRemove,
  onCopyLinks,
}) => {
  const getStatusIcon = (status: ExtendedTorrentItem['status']): string => {
    switch (status) {
      case 'processing':
        return '⏳'
      case 'ready':
        return '✅'
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

  const getStatusText = (status: ExtendedTorrentItem['status']): string => {
    switch (status) {
      case 'processing':
        return 'Processing'
      case 'ready':
        return 'Ready'
      case 'error':
        return 'Error'
      case 'timeout':
        return 'Timeout'
      case 'selecting_files':
        return 'Selecting Files'
      default:
        return 'Unknown'
    }
  }

  const formatSpeed = (bytesPerSecond?: number): string => {
    if (!bytesPerSecond) return ''
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    let speed = bytesPerSecond
    let unitIndex = 0
    while (speed >= 1024 && unitIndex < units.length - 1) {
      speed /= 1024
      unitIndex++
    }
    return `${speed.toFixed(1)} ${units[unitIndex]}`
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const canRetry = torrent.status === 'error' || torrent.status === 'timeout'
  const hasProgress = torrent.progress && torrent.progress.progress > 0
  const hasLinks = torrent.links && torrent.links.length > 0

  return (
    <div className="torrent-card">
      <div className="torrent-card-header">
        <div className="torrent-card-title">
          <span className="torrent-status-icon">{getStatusIcon(torrent.status)}</span>
          <span className="torrent-filename" title={torrent.filename}>
            {torrent.filename}
          </span>
        </div>
        <span className="torrent-status-badge">{getStatusText(torrent.status)}</span>
      </div>

      <div className="torrent-card-meta">
        <span className="torrent-added-time">Added {formatDate(torrent.addedAt)}</span>
        {torrent.retryCount > 0 && (
          <span className="torrent-retry-count">Retries: {torrent.retryCount}</span>
        )}
      </div>

      {hasProgress && (
        <div className="torrent-progress-section">
          <ProgressIndicator
            progress={torrent.progress!.progress}
            status={torrent.progress!.status}
            showPercentage={true}
          />
          <div className="torrent-speed-info">
            {torrent.progress!.downloadSpeed && (
              <span className="torrent-download-speed">
                ↓ {formatSpeed(torrent.progress!.downloadSpeed)}
              </span>
            )}
            {torrent.progress!.uploadSpeed && (
              <span className="torrent-upload-speed">
                ↑ {formatSpeed(torrent.progress!.uploadSpeed)}
              </span>
            )}
            {torrent.progress!.eta && (
              <span className="torrent-eta">ETA: {Math.ceil(torrent.progress!.eta / 60)}m</span>
            )}
          </div>
        </div>
      )}

      {hasLinks && (
        <div className="torrent-links-section">
          <DownloadLinks
            links={torrent.links!}
            onLinkClick={link => {
              window.open(link.url, '_blank', 'noopener,noreferrer')
            }}
          />
        </div>
      )}

      <div className="torrent-card-actions">
        {canRetry && onRetry && (
          <button
            className="torrent-action-button torrent-action-retry"
            onClick={() => onRetry(torrent.id)}
            aria-label={`Retry ${torrent.filename}`}
          >
            🔄 Retry
          </button>
        )}
        {hasLinks && onCopyLinks && (
          <button
            className="torrent-action-button torrent-action-copy"
            onClick={() => onCopyLinks(torrent.id)}
            aria-label={`Copy links for ${torrent.filename}`}
          >
            📋 Copy Links
          </button>
        )}
        {onRemove && (
          <button
            className="torrent-action-button torrent-action-remove"
            onClick={() => onRemove(torrent.id)}
            aria-label={`Remove ${torrent.filename}`}
          >
            🗑️ Remove
          </button>
        )}
      </div>
    </div>
  )
}
