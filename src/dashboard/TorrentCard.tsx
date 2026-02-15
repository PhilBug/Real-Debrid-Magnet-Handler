import React, { useState, useCallback } from 'react'
import type { ExtendedTorrentItem } from '../utils/types'
import { Badge, BadgeVariant } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Icon } from '../components/common/Icon'
import { ProgressIndicator } from './ProgressIndicator'
import { DownloadLinks } from './DownloadLinks'

interface TorrentCardProps {
  torrent: ExtendedTorrentItem
  onRetry?: (torrentId: string) => void
  onRemove?: (torrentId: string) => void
  onCopyLinks?: (torrentId: string) => void
  onSelectFiles?: (torrentId: string) => void
}

/**
 * Map torrent status to Badge variant
 */
function getStatusBadgeVariant(status: ExtendedTorrentItem['status']): BadgeVariant {
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
      return 'default'
  }
}

/**
 * Get icon for torrent status
 */
function getStatusIcon(status: ExtendedTorrentItem['status']): React.ReactNode {
  switch (status) {
    case 'processing':
      return <Icon name="spinner" size="sm" />
    case 'ready':
      return <Icon name="check-circle" size="sm" />
    case 'error':
      return <Icon name="x-circle" size="sm" />
    case 'timeout':
      return <Icon name="clock" size="sm" />
    case 'selecting_files':
      return <Icon name="file" size="sm" />
    default:
      return <Icon name="file" size="sm" />
  }
}

/**
 * Get display text for torrent status
 */
function getStatusText(status: ExtendedTorrentItem['status']): string {
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

/**
 * Format bytes per second to human readable speed
 */
function formatSpeed(bytesPerSecond?: number): string {
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

/**
 * Format timestamp to relative time
 */
function formatDate(timestamp: number): string {
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

export const TorrentCard: React.FC<TorrentCardProps> = ({
  torrent,
  onRetry,
  onRemove,
  onCopyLinks,
  onSelectFiles,
}) => {
  const canRetry = torrent.status === 'error' || torrent.status === 'timeout'
  const canSelectFiles = torrent.status === 'selecting_files'
  const hasProgress = torrent.progress && torrent.progress.progress > 0
  const hasLinks = torrent.links && torrent.links.length > 0
  const hasDownloadUrl = torrent.status === 'ready' && torrent.downloadUrl

  // Tooltip state for copy and download buttons
  const [copyTooltip, setCopyTooltip] = useState(false)
  const [downloadTooltip, setDownloadTooltip] = useState(false)

  // Handle copy with tooltip feedback
  const handleCopyDownloadUrl = useCallback(() => {
    if (torrent.downloadUrl) {
      navigator.clipboard.writeText(torrent.downloadUrl)
      setCopyTooltip(true)
      setTimeout(() => setCopyTooltip(false), 2000)
    }
  }, [torrent.downloadUrl])

  // Handle download with tooltip feedback
  const handleDownload = useCallback(() => {
    if (torrent.downloadUrl) {
      setDownloadTooltip(true)
      // Create a temporary anchor to trigger download
      const link = document.createElement('a')
      link.href = torrent.downloadUrl
      link.download = torrent.filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => setDownloadTooltip(false), 2000)
    }
  }, [torrent.downloadUrl, torrent.filename])

  return (
    <div className="torrent-card">
      {/* Card Header */}
      <div className="torrent-card-header">
        <div className="torrent-card-title">
          <span className="torrent-filename" title={torrent.filename}>
            {torrent.filename}
          </span>
        </div>
        <Badge
          variant={getStatusBadgeVariant(torrent.status)}
          icon={getStatusIcon(torrent.status)}
          size="sm"
        >
          {getStatusText(torrent.status)}
        </Badge>
      </div>

      {/* Card Meta */}
      <div className="torrent-card-meta">
        <span className="torrent-added-time">Added {formatDate(torrent.addedAt)}</span>
        {torrent.retryCount > 0 && (
          <span className="torrent-retry-count">Retries: {torrent.retryCount}</span>
        )}
      </div>

      {/* Progress Section */}
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

      {/* Converted URL Section */}
      {hasDownloadUrl && (
        <div className="torrent-converted-url-section">
          <div className="torrent-converted-url-label">Converted URL</div>
          <div className="torrent-converted-url-container">
            <span className="torrent-converted-url" title={torrent.downloadUrl ?? undefined}>
              {torrent.downloadUrl}
            </span>
            <div className="torrent-converted-url-actions">
              <div className="torrent-action-button-wrapper">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyDownloadUrl}
                  aria-label="Copy download URL"
                  leftIcon={<Icon name="copy" size="sm" />}
                >
                  Copy
                </Button>
                {copyTooltip && <span className="torrent-action-tooltip">Copied!</span>}
              </div>
              <div className="torrent-action-button-wrapper">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  aria-label="Download file"
                  leftIcon={<Icon name="download" size="sm" />}
                >
                  Download
                </Button>
                {downloadTooltip && <span className="torrent-action-tooltip">Downloading...</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links Section */}
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

      {/* Card Actions */}
      <div className="torrent-card-actions">
        {canSelectFiles && onSelectFiles && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelectFiles(torrent.id)}
            aria-label={`Select files for ${torrent.filename}`}
            leftIcon={<Icon name="file" size="sm" />}
          >
            Choose Files
          </Button>
        )}
        {canRetry && onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRetry(torrent.id)}
            aria-label={`Retry ${torrent.filename}`}
            leftIcon={<Icon name="refresh" size="sm" />}
          >
            Retry
          </Button>
        )}
        {hasLinks && onCopyLinks && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onCopyLinks(torrent.id)}
            aria-label={`Copy links for ${torrent.filename}`}
            leftIcon={<Icon name="copy" size="sm" />}
          >
            Copy Links
          </Button>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(torrent.id)}
            aria-label={`Remove ${torrent.filename}`}
            leftIcon={<Icon name="trash" size="sm" />}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

export default TorrentCard
