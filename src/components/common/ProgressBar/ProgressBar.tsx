/**
 * ProgressBar Component - Industrial Terminal Design System
 *
 * A progress indicator component with multiple variants for different
 * operation states. Supports animated fill, percentage display, and
 * indeterminate state.
 */

import React from 'react'

export type ProgressBarVariant =
  | 'default'
  | 'downloading'
  | 'uploading'
  | 'converting'
  | 'completed'
  | 'error'
  | 'paused'

export type ProgressBarSize = 'sm' | 'md' | 'lg'

export interface ProgressBarProps {
  /** Current progress value (0-100) */
  value: number
  /** Visual style variant based on operation type */
  variant?: ProgressBarVariant
  /** Size of the progress bar */
  size?: ProgressBarSize
  /** Whether to show percentage text */
  showPercentage?: boolean
  /** Indeterminate state for unknown progress */
  indeterminate?: boolean
  /** Optional label displayed above the bar */
  label?: string
  /** Additional CSS class names */
  className?: string
}

const variantClasses: Record<ProgressBarVariant, string> = {
  default: 'progress-bar--default',
  downloading: 'progress-bar--downloading',
  uploading: 'progress-bar--uploading',
  converting: 'progress-bar--converting',
  completed: 'progress-bar--completed',
  error: 'progress-bar--error',
  paused: 'progress-bar--paused',
}

const sizeClasses: Record<ProgressBarSize, string> = {
  sm: 'progress--sm',
  md: 'progress--md',
  lg: 'progress--lg',
}

/**
 * ProgressBar component for displaying operation progress.
 *
 * @example
 * ```tsx
 * <ProgressBar value={45} variant="downloading" showPercentage />
 * <ProgressBar value={0} indeterminate variant="converting" />
 * <ProgressBar value={100} variant="completed" label="Complete" />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'default',
  size = 'md',
  showPercentage = false,
  indeterminate = false,
  label,
  className = '',
}) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value))

  const containerClasses = ['progress-container', sizeClasses[size], className]
    .filter(Boolean)
    .join(' ')

  const barClasses = [
    'progress-bar',
    variantClasses[variant],
    indeterminate ? 'progress-bar--indeterminate' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClasses}>
      {(label || showPercentage) && (
        <div className="progress__header">
          {label && <span className="progress__label">{label}</span>}
          {showPercentage && !indeterminate && (
            <span className="progress__percentage">{clampedValue}%</span>
          )}
        </div>
      )}
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div
          className={barClasses}
          style={indeterminate ? undefined : { width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
