/**
 * Modal Component - Industrial Terminal Design System
 *
 * A modal dialog component with overlay, close button, focus trap,
 * and escape key handling.
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { Icon } from '../Icon'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title displayed in header */
  title?: string
  /** Size of the modal */
  size?: ModalSize
  /** Modal content */
  children: React.ReactNode
  /** Optional footer content (typically action buttons) */
  footer?: React.ReactNode
  /** Whether clicking the overlay should close the modal */
  closeOnOverlayClick?: boolean
  /** Whether to show the close button */
  showCloseButton?: boolean
  /** Additional CSS class names */
  className?: string
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'modal--sm',
  md: 'modal--md',
  lg: 'modal--lg',
}

/**
 * Modal component for displaying focused content.
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   footer={
 *     <>
 *       <Button variant="secondary" onClick={onClose}>Cancel</Button>
 *       <Button variant="primary" onClick={onConfirm}>Confirm</Button>
 *     </>
 *   }
 * >
 *   Are you sure you want to proceed?
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown)

      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus()
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''

        // Restore focus to the previous element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus()
        }
      }
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) {
    return null
  }

  const modalClasses = ['modal', sizeClasses[size], className].filter(Boolean).join(' ')

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="presentation">
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="modal__header">
            {title && (
              <h2 id="modal-title" className="modal__title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="modal__close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <Icon name="x" size="md" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal__body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
