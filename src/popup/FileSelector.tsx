/**
 * FileSelector Component - Industrial Terminal Design System
 *
 * A modal component for selecting which files to download from a torrent.
 * Uses the common Modal and Button components.
 */

import { useState } from 'react'
import type { RdTorrentInfo } from '../utils/types'
import { Button } from '../components/common'

interface FileSelectorProps {
  torrentInfo: RdTorrentInfo
  onConfirm: (selectedFiles: string) => void
  onCancel: () => void
}

export function FileSelector({ torrentInfo, onConfirm, onCancel }: FileSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const files = torrentInfo.files || []
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
    if (selectedIds.size === 0) {
      // If nothing selected, select all
      onConfirm('all')
    } else {
      // Convert selected IDs to comma-separated string
      onConfirm(
        Array.from(selectedIds)
          .sort((a, b) => a - b)
          .join(',')
      )
    }
  }

  const selectedSize = files.filter(f => selectedIds.has(f.id)).reduce((sum, f) => sum + f.bytes, 0)

  return (
    <div className="file-selector">
      {/* Header */}
      <div className="file-selector__header">
        <h3 className="file-selector__title">Select Files to Download</h3>
        <span className="file-selector__size-info">
          {formatBytes(selectedSize)} / {formatBytes(totalSize)}
        </span>
      </div>

      {/* Controls */}
      <div className="file-selector__controls">
        <Button variant="secondary" size="sm" onClick={toggleAll}>
          {selectedIds.size === files.length ? 'Deselect All' : 'Select All'}
        </Button>
        <span className="file-selector__select-text">
          {selectedIds.size} of {files.length} files selected
        </span>
      </div>

      {/* File List */}
      <div className="file-selector__list">
        {files.map(file => (
          <label key={file.id} className="file-selector__item">
            <input
              type="checkbox"
              checked={selectedIds.has(file.id)}
              onChange={() => toggleFile(file.id)}
              className="file-selector__checkbox"
            />
            <div className="file-selector__file-info">
              <div className="file-selector__file-path" title={file.path}>
                {file.path}
              </div>
              <div className="file-selector__file-size">{formatBytes(file.bytes)}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Footer */}
      <div className="file-selector__footer">
        <Button variant="primary" fullWidth onClick={handleConfirm} className="file-selector__btn">
          Confirm Selection
        </Button>
        <Button variant="secondary" fullWidth onClick={onCancel} className="file-selector__btn">
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default FileSelector
