import React from 'react'
import { Button } from '../components/common/Button'
import { Icon } from '../components/common/Icon'

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
        <Button
          variant="secondary"
          size="md"
          onClick={onRetryFailed}
          disabled={!hasFailed || disabled}
          aria-label={`Retry all failed torrents (${failedCount})`}
          title={
            !hasFailed ? 'No failed torrents to retry' : `Retry ${failedCount} failed torrents`
          }
          leftIcon={<Icon name="refresh" size="sm" />}
        >
          Retry Failed
          {failedCount > 0 && <span className="batch-control-count">{failedCount}</span>}
        </Button>
      )}

      {onClearCompleted && (
        <Button
          variant="secondary"
          size="lg"
          onClick={onClearCompleted}
          disabled={!hasCompleted || disabled}
          aria-label={`Clear completed torrents (${completedCount})`}
          title={
            !hasCompleted
              ? 'No completed torrents to clear'
              : `Clear ${completedCount} completed torrents`
          }
          leftIcon={<Icon name="trash" size="sm" />}
        >
          Clear Completed
          {completedCount > 0 && <span className="batch-control-count">{completedCount}</span>}
        </Button>
      )}
    </div>
  )
}

export default BatchControls
