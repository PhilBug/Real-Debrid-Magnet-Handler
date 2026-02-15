/**
 * Common UI Components - Industrial Terminal Design System
 *
 * This module exports all common UI components for easy importing.
 * Each component uses CSS custom properties from tokens.css and
 * follows the Industrial Terminal aesthetic.
 *
 * @example
 * ```tsx
 * import { Button, Input, Badge, ProgressBar, Modal, Toast, Icon } from '@/components/common';
 * ```
 */

// Icon component
export { Icon, type IconName, type IconSize, type IconProps } from './Icon'

// Button component
export { Button, type ButtonVariant, type ButtonSize, type ButtonProps } from './Button'

// Input component
export { Input, type InputSize, type InputProps } from './Input'

// Badge component
export { Badge, type BadgeVariant, type BadgeSize, type BadgeProps } from './Badge'

// ProgressBar component
export {
  ProgressBar,
  type ProgressBarVariant,
  type ProgressBarSize,
  type ProgressBarProps,
} from './ProgressBar'

// Modal component
export { Modal, type ModalSize, type ModalProps } from './Modal'

// Toast component
export {
  Toast,
  ToastContainer,
  type ToastVariant,
  type ToastProps,
  type ToastContainerProps,
} from './Toast'
