import React from 'react'
import { ProgressBar, ProgressBarVariant } from '../components/common/ProgressBar'
import type { TorrentProgress } from '../utils/types'

interface ProgressIndicatorProps {
  progress: number
  status: TorrentProgress['status']
  showPercentage?: boolean
}

/**
 * Map torrent progress status to ProgressBar variant
 */
function getProgressVariant(status: TorrentProgress['status']): ProgressBarVariant {
  switch (status) {
    case 'downloading':
      return 'downloading'
    case 'uploading':
      return 'uploading'
    case 'converting':
      return 'converting'
    case 'completed':
      return 'completed'
    case 'error':
      return 'error'
    case 'paused':
      return 'paused'
    default:
      return 'default'
  }
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  status,
  showPercentage = true,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const variant = getProgressVariant(status)

  return (
    <ProgressBar
      value={clampedProgress}
      variant={variant}
      showPercentage={showPercentage}
      size="md"
    />
  )
}

export default ProgressIndicator
