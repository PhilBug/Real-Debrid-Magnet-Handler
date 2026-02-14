import React, { useState } from 'react'
import type { DownloadLink } from '../utils/types'

interface DownloadLinksProps {
  links: DownloadLink[]
  onLinkClick?: (link: DownloadLink) => void
  onCopyLink?: (link: DownloadLink) => void
}

export const DownloadLinks: React.FC<DownloadLinksProps> = ({ links, onLinkClick, onCopyLink }) => {
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null)

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const truncateFilename = (filename: string, maxLength = 40): string => {
    if (filename.length <= maxLength) return filename
    const ext = filename.split('.').pop() || ''
    const nameWithoutExt = filename.slice(0, -(ext.length + 1))
    const truncated = nameWithoutExt.slice(0, maxLength - ext.length - 4)
    return `${truncated}...${ext}`
  }

  const handleLinkClick = (link: DownloadLink, index: number) => {
    setSelectedLinkIndex(index)
    if (onLinkClick) {
      onLinkClick(link)
    } else {
      // Default behavior: open in new tab
      window.open(link.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyLink = (e: React.MouseEvent, link: DownloadLink) => {
    e.stopPropagation()
    navigator.clipboard.writeText(link.url)
    if (onCopyLink) {
      onCopyLink(link)
    }
  }

  if (!links || links.length === 0) {
    return null
  }

  return (
    <div className="download-links-container">
      <div className="download-links-header">
        <span className="download-links-title">Download Links</span>
        <span className="download-links-count">{links.length}</span>
      </div>
      <div className="download-links-list">
        {links.map((link, index) => (
          <button
            key={`${link.filename}-${index}`}
            className={`download-link-button ${
              selectedLinkIndex === index ? 'download-link-button-selected' : ''
            }`}
            onClick={() => handleLinkClick(link, index)}
            title={link.filename}
          >
            <div className="download-link-content">
              <span className="download-link-filename">{truncateFilename(link.filename)}</span>
              {link.size && <span className="download-link-size">{formatFileSize(link.size)}</span>}
            </div>
            {onCopyLink && (
              <button
                className="download-link-copy"
                onClick={e => handleCopyLink(e, link)}
                aria-label={`Copy ${link.filename}`}
              >
                📋
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
