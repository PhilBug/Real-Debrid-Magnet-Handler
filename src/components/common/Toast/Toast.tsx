/**
 * Toast Component - Industrial Terminal Design System
 *
 * A toast notification component for displaying brief messages.
 * Supports auto-dismiss, dismiss button, and stacked display.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Icon, IconName } from '../Icon'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  /** Unique identifier for the toast */
  id: string
  /** Visual style variant */
  variant: ToastVariant
  /** Message to display */
  message: string
  /** Duration in milliseconds before auto-dismiss (0 for no auto-dismiss) */
  duration?: number
  /** Callback when toast is dismissed */
  onDismiss: (id: string) => void
  /** Additional CSS class names */
  className?: string
}

const variantConfig: Record<ToastVariant, { icon: IconName; className: string }> = {
  success: { icon: 'check-circle', className: 'toast--success' },
  error: { icon: 'x-circle', className: 'toast--error' },
  warning: { icon: 'clock', className: 'toast--warning' },
  info: { icon: 'file', className: 'toast--info' },
}

/**
 * Toast component for displaying brief notifications.
 *
 * @example
 * ```tsx
 * <Toast
 *   id="toast-1"
 *   variant="success"
 *   message="Settings saved successfully"
 *   duration={5000}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  variant,
  message,
  duration = 5000,
  onDismiss,
  className = '',
}) => {
  const [isExiting, setIsExiting] = useState(false)
  const config = variantConfig[variant]

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    // Wait for exit animation before calling onDismiss
    setTimeout(() => {
      onDismiss(id)
    }, 150)
  }, [id, onDismiss])

  // Auto-dismiss timer
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, handleDismiss])

  const classes = ['toast', config.className, isExiting ? 'toast--exiting' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} role="alert" aria-live="polite" aria-atomic="true">
      <div className="toast__icon">
        <Icon name={config.icon} size="md" />
      </div>
      <div className="toast__message">{message}</div>
      <button
        type="button"
        className="toast__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <Icon name="x" size="sm" />
      </button>
    </div>
  )
}

/**
 * ToastContainer component for stacking multiple toasts.
 */
export interface ToastContainerProps {
  /** Toast items to display */
  toasts: Array<Omit<ToastProps, 'onDismiss'>>
  /** Callback when a toast is dismissed */
  onDismiss: (id: string) => void
  /** Position of the container */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  /** Additional CSS class names */
  className?: string
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'top-right',
  className = '',
}) => {
  const containerClasses = ['toast-container', `toast-container--${position}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClasses}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export default Toast
