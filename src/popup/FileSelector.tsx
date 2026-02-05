import { useState } from 'react'
import type { RdTorrentInfo } from '../utils/types'

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
    <div className="bg-white border border-gray-300 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-900">Select Files to Download</h3>
        <span className="text-sm text-gray-600">
          {formatBytes(selectedSize)} / {formatBytes(totalSize)}
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          {selectedIds.size === files.length ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-sm text-gray-600 py-1">
          {selectedIds.size} of {files.length} files selected
        </span>
      </div>

      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded mb-3">
        {files.map(file => (
          <label
            key={file.id}
            className="flex items-start gap-2 p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(file.id)}
              onChange={() => toggleFile(file.id)}
              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 truncate">{file.path}</div>
              <div className="text-xs text-gray-500">{formatBytes(file.bytes)}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700 transition-colors"
        >
          Confirm Selection
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 p-2 rounded font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
