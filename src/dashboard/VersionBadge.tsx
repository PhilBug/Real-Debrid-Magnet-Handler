/**
 * VersionBadge Component - Industrial Terminal Design System
 *
 * A terminal-inspired version badge that displays the app version
 * with click-to-copy functionality. Features a tech aesthetic with
 * monospace typography and cyan accent glow.
 */

import React, { useState, useCallback } from 'react'
import { VERSION } from '../utils/version'

interface VersionBadgeProps {
  /** Additional CSS class name */
  className?: string
}

/**
 * VersionBadge component displays the application version in a terminal-style format.
 * Clicking the badge copies the version string to the clipboard.
 *
 * @example
 * ```tsx
 * <VersionBadge className="dashboard-version-badge" />
 * ```
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({ className = '' }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(VERSION)
      setCopied(true)
      // Reset the "Copied!" state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy version:', error)
    }
  }, [])

  return (
    <div className={`version-badge ${className}`.trim()}>
      <button
        className="version-badge__button"
        onClick={handleCopy}
        aria-label={`Copy version ${VERSION}`}
        title={`Click to copy version: ${VERSION}`}
      >
        <span className="version-badge__bracket">[</span>
        <span className="version-badge__version">v{VERSION}</span>
        <span className="version-badge__bracket">]</span>
        {copied && <span className="version-badge__tooltip">Copied!</span>}
      </button>
    </div>
  )
}

export default VersionBadge
