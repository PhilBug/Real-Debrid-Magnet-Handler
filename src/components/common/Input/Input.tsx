/**
 * Input Component - Industrial Terminal Design System
 *
 * A versatile input component with label, error state, helper text,
 * and prefix/suffix support. Includes a special terminal-style variant
 * with `rd://` prompt prefix for magnet input.
 */

import React, { forwardRef } from 'react'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix'
> {
  /** Label text displayed above the input */
  label?: string
  /** Error message to display */
  error?: string
  /** Helper text displayed below the input */
  helperText?: string
  /** Element to display before the input (e.g., icon) */
  prefix?: React.ReactNode
  /** Element to display after the input (e.g., icon, button) */
  suffix?: React.ReactNode
  /** Size of the input */
  size?: InputSize
  /** Terminal-style input with rd:// prompt prefix */
  terminal?: boolean
  /** ID for the input element */
  id?: string
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'input--sm',
  md: 'input--md',
  lg: 'input--lg',
}

/**
 * Input component for text entry.
 *
 * @example
 * ```tsx
 * <Input
 *   label="API Token"
 *   placeholder="Enter your token"
 *   helperText="Get your token at real-debrid.com/apitoken"
 * />
 *
 * <Input
 *   terminal
 *   placeholder="paste_magnet_link_here..."
 * />
 *
 * <Input
 *   label="Filename"
 *   error="Filename is required"
 *   prefix={<Icon name="file" />}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      prefix,
      suffix,
      size = 'md',
      terminal = false,
      id,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const hasError = Boolean(error)

    const containerClasses = [
      'input-container',
      terminal ? 'input-container--terminal' : '',
      hasError ? 'input-container--error' : '',
      disabled ? 'input-container--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const inputClasses = [
      'input',
      sizeClasses[size],
      terminal ? 'input--terminal' : '',
      hasError ? 'input--error' : '',
      prefix ? 'input--has-prefix' : '',
      suffix ? 'input--has-suffix' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className="input__label">
            {label}
          </label>
        )}
        <div className="input__wrapper">
          {terminal && (
            <span className="input__prompt" aria-hidden="true">
              rd://
            </span>
          )}
          {!terminal && prefix && <span className="input__prefix">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...rest}
          />
          {suffix && <span className="input__suffix">{suffix}</span>}
        </div>
        {hasError && (
          <p id={`${inputId}-error`} className="input__error" role="alert">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={`${inputId}-helper`} className="input__helper">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
