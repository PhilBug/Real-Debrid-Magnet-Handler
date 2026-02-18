/**
 * Badge Component - Industrial Terminal Design System
 *
 * A status indicator component for displaying torrent states.
 * Supports multiple variants for different status types.
 */

import React from 'react'

export type BadgeVariant = 'default' | 'processing' | 'ready' | 'error' | 'timeout' | 'selecting'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  /** Visual style variant based on status */
  variant?: BadgeVariant
  /** Size of the badge */
  size?: BadgeSize
  /** Badge content */
  children: React.ReactNode
  /** Optional icon to display before the text */
  icon?: React.ReactNode
  /** Additional CSS class names */
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'badge--default',
  processing: 'badge--processing',
  ready: 'badge--ready',
  error: 'badge--error',
  timeout: 'badge--timeout',
  selecting: 'badge--selecting',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'badge--sm',
  md: 'badge--md',
}

/**
 * Badge component for displaying status indicators.
 *
 * @example
 * ```tsx
 * <Badge variant="ready">Ready</Badge>
 * <Badge variant="processing" icon={<Icon name="spinner" />}>Processing</Badge>
 * <Badge variant="error">Error</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  icon,
  className = '',
}) => {
  const classes = [
    'badge',
    variantClasses[variant],
    sizeClasses[size],
    icon ? 'badge--has-icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} role="status">
      {icon && <span className="badge__icon">{icon}</span>}
      <span className="badge__text">{children}</span>
    </span>
  )
}

export default Badge
