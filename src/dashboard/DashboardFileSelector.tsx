/**
 * DashboardFileSelector Component - Industrial Terminal Design System
 *
 * A modal component for selecting which files to download from a torrent
 * in the full dashboard view.
 */

import { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'
import type { RdTorrentInfo } from '../utils/types'
import { Button, Icon } from '../components/common'

interface DashboardFileSelectorProps {
  torrentId: string
  torrentFilename: string
  onConfirm: (torrentId: string, selectedFiles: string) => void
  onCancel: () => void
}

export function DashboardFileSelector({
  torrentId,
  torrentFilename,
  onConfirm,
  onCancel,
}: DashboardFileSelectorProps) {
  const [torrentInfo, setTorrentInfo] = useState<RdTorrentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchTorrentInfo = async () => {
      try {
        setLoading(true)
        const response = (await browser.runtime.sendMessage({
          type: 'GET_TORRENT_INFO',
          torrentId,
        })) as { success?: boolean; info?: RdTorrentInfo; error?: string }

        if (response?.success && response?.info) {
          setTorrentInfo(response.info)
        } else {
          setError(response?.error || 'Failed to fetch torrent info')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch torrent info')
      } finally {
        setLoading(false)
      }
    }

    fetchTorrentInfo()
  }, [torrentId])

  const files = torrentInfo?.files || []
  const totalSize = files.reduce((sum, file) => sum + file.bytes, 0)

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const toggleFile = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(files.map(f => f.id)))
    }
  }

  const handleConfirm = () => {
    // If no files are explicitly selected, treat this as "all files" (empty selection = all)
    if (selectedIds.size === 0) {
      onConfirm(torrentId, 'all')
    } else {
      onConfirm(
        torrentId,
        Array.from(selectedIds)
          .sort((a, b) => a - b)
          .join(',')
      )
    }
  }

  const selectedSize = files.filter(f => selectedIds.has(f.id)).reduce((sum, f) => sum + f.bytes, 0)

  if (loading) {
    return (
      <div className="dashboard-file-selector">
        <div className="dashboard-file-selector__loading">
          <Icon name="spinner" size="lg" />
          <span>Loading files...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-file-selector">
        <div className="dashboard-file-selector__error">
          <Icon name="x-circle" size="lg" />
          <span>{error}</span>
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-file-selector">
      {/* Header */}
      <div className="dashboard-file-selector__header">
        <div className="dashboard-file-selector__title-section">
          <h3 className="dashboard-file-selector__title">Select Files to Download</h3>
          <span className="dashboard-file-selector__filename">{torrentFilename}</span>
        </div>
        <button
          type="button"
          className="dashboard-file-selector__close"
          onClick={onCancel}
          aria-label="Close"
        >
          <Icon name="x" size="md" />
        </button>
      </div>

      {/* Size Info */}
      <div className="dashboard-file-selector__size-info">
        <span className="dashboard-file-selector__size-label">Selected:</span>
        <span className="dashboard-file-selector__size-value">
          {formatBytes(selectedSize)} / {formatBytes(totalSize)}
        </span>
      </div>

      {/* Controls */}
      <div className="dashboard-file-selector__controls">
        <Button variant="secondary" size="sm" onClick={toggleAll}>
          {selectedIds.size === files.length ? 'Deselect All' : 'Select All'}
        </Button>
        <span className="dashboard-file-selector__select-text">
          {selectedIds.size} of {files.length} files selected
        </span>
      </div>

      {/* File List */}
      <div className="dashboard-file-selector__list">
        {files.map(file => (
          <label key={file.id} className="dashboard-file-selector__item">
            <input
              type="checkbox"
              checked={selectedIds.has(file.id)}
              onChange={() => toggleFile(file.id)}
              className="dashboard-file-selector__checkbox"
            />
            <div className="dashboard-file-selector__file-info">
              <div className="dashboard-file-selector__file-path" title={file.path}>
                {file.path}
              </div>
              <div className="dashboard-file-selector__file-size">{formatBytes(file.bytes)}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Footer */}
      <div className="dashboard-file-selector__footer">
        <Button variant="primary" onClick={handleConfirm}>
          Confirm Selection
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default DashboardFileSelector
