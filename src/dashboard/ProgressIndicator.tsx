import React from 'react'
import type { TorrentProgress } from '../utils/types'

interface ProgressIndicatorProps {
  progress: number
  status: TorrentProgress['status']
  showPercentage?: boolean
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  status,
  showPercentage = true,
}) => {
  // Determine color based on status
  const getStatusColor = (): string => {
    switch (status) {
      case 'downloading':
        return 'var(--progress-downloading, #3b82f6)'
      case 'uploading':
        return 'var(--progress-uploading, #8b5cf6)'
      case 'converting':
        return 'var(--progress-converting, #f59e0b)'
      case 'completed':
        return 'var(--progress-completed, #10b981)'
      case 'error':
        return 'var(--progress-error, #ef4444)'
      case 'paused':
        return 'var(--progress-paused, #6b7280)'
      default:
        return 'var(--progress-default, #3b82f6)'
    }
  }

  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const progressColor = getStatusColor()

  return (
    <div className="progress-indicator-container">
      <div
        className="progress-bar-bg"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${clampedProgress}%`}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: progressColor,
          }}
        >
          {showPercentage && clampedProgress >= 5 && (
            <span className="progress-percentage">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      </div>
      {showPercentage && clampedProgress < 5 && (
        <span className="progress-percentage-outside">{Math.round(clampedProgress)}%</span>
      )}
    </div>
  )
}
