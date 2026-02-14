import React from 'react'

interface BatchControlsProps {
  failedCount: number
  completedCount: number
  onRetryFailed?: () => void
  onClearCompleted?: () => void
  disabled?: boolean
}

export const BatchControls: React.FC<BatchControlsProps> = ({
  failedCount,
  completedCount,
  onRetryFailed,
  onClearCompleted,
  disabled = false,
}) => {
  const hasFailed = failedCount > 0
  const hasCompleted = completedCount > 0

  return (
    <div className="batch-controls">
      {onRetryFailed && (
        <button
          className="batch-control-button batch-control-retry"
          onClick={onRetryFailed}
          disabled={!hasFailed || disabled}
          aria-label={`Retry all failed torrents (${failedCount})`}
          title={
            !hasFailed ? 'No failed torrents to retry' : `Retry ${failedCount} failed torrents`
          }
        >
          <span className="batch-control-icon">🔄</span>
          <span className="batch-control-text">Retry Failed</span>
          {failedCount > 0 && <span className="batch-control-count">{failedCount}</span>}
        </button>
      )}

      {onClearCompleted && (
        <button
          className="batch-control-button batch-control-clear"
          onClick={onClearCompleted}
          disabled={!hasCompleted || disabled}
          aria-label={`Clear completed torrents (${completedCount})`}
          title={
            !hasCompleted
              ? 'No completed torrents to clear'
              : `Clear ${completedCount} completed torrents`
          }
        >
          <span className="batch-control-icon">🗑️</span>
          <span className="batch-control-text">Clear Completed</span>
          {completedCount > 0 && <span className="batch-control-count">{completedCount}</span>}
        </button>
      )}
    </div>
  )
}
