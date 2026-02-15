/**
 * Button Component - Industrial Terminal Design System
 *
 * A versatile button component with multiple variants, sizes, and states.
 * Supports icons, loading state, and full-width option.
 */

import React from 'react'
import { Icon } from '../Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Size of the button */
  size?: ButtonSize
  /** Shows loading spinner and disables interaction */
  loading?: boolean
  /** Makes button full width of container */
  fullWidth?: boolean
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode
  /** Button content */
  children: React.ReactNode
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'button--sm',
  md: 'button--md',
  lg: 'button--lg',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'button--primary',
  secondary: 'button--secondary',
  danger: 'button--danger',
  ghost: 'button--ghost',
}

/**
 * Button component for user interactions.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Submit
 * </Button>
 *
 * <Button variant="secondary" leftIcon={<Icon name="download" />}>
 *   Download
 * </Button>
 *
 * <Button loading>Processing...</Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...rest
}) => {
  const classes = [
    'button',
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? 'button--full-width' : '',
    loading ? 'button--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const isDisabled = disabled || loading

  return (
    <button className={classes} disabled={isDisabled} aria-busy={loading} {...rest}>
      {loading && (
        <span className="button__spinner">
          <Icon name="spinner" size={size === 'sm' ? 'sm' : 'md'} />
        </span>
      )}
      {!loading && leftIcon && <span className="button__icon button__icon--left">{leftIcon}</span>}
      <span className="button__content">{children}</span>
      {!loading && rightIcon && (
        <span className="button__icon button__icon--right">{rightIcon}</span>
      )}
    </button>
  )
}

export default Button
