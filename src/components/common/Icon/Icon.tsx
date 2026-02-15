/**
 * Icon Component - Industrial Terminal Design System
 *
 * SVG icon component with consistent sizing and styling.
 * Replaces emoji icons with custom SVG icons that match the
 * Industrial Terminal aesthetic.
 */

import React from 'react'

export type IconName =
  | 'spinner'
  | 'check-circle'
  | 'x-circle'
  | 'clock'
  | 'file'
  | 'download'
  | 'copy'
  | 'trash'
  | 'refresh'
  | 'sun'
  | 'moon'
  | 'laptop'
  | 'x'
  | 'chevron-down'
  | 'external-link'

export type IconSize = 'sm' | 'md' | 'lg' | 'xl'

export interface IconProps {
  /** Name of the icon to display */
  name: IconName
  /** Size of the icon */
  size?: IconSize
  /** Additional CSS class names */
  className?: string
  /** Accessible label for screen readers */
  'aria-label'?: string
}

const sizeMap: Record<IconSize, string> = {
  sm: 'icon--sm',
  md: 'icon--md',
  lg: 'icon--lg',
  xl: 'icon--xl',
}

/**
 * SVG path definitions for each icon
 */
const iconPaths: Record<IconName, React.ReactNode> = {
  spinner: (
    <>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
      />
    </>
  ),

  'check-circle': (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  'x-circle': (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  clock: (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),

  file: (
    <>
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 13h8M8 17h5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),

  download: (
    <>
      <path
        d="M12 3v12M12 15l-4-4M12 15l4-4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 17v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),

  copy: (
    <>
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),

  trash: (
    <>
      <path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),

  refresh: (
    <>
      <path
        d="M21 12a9 9 0 11-2.636-6.364"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M21 3v5h-5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  sun: (
    <>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),

  moon: (
    <>
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  laptop: (
    <>
      <rect
        x="2"
        y="4"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M2 16h20l-2 4H4l-2-4z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  x: (
    <>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),

  'chevron-down': (
    <>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  'external-link': (
    <>
      <path
        d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M15 3h6v6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14L21 3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
}

/**
 * Icon component for displaying SVG icons.
 *
 * @example
 * ```tsx
 * <Icon name="download" size="md" />
 * <Icon name="spinner" size="lg" className="icon--spinning" />
 * ```
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
}) => {
  const isSpinner = name === 'spinner'
  const classes = ['icon', sizeMap[size], isSpinner ? 'icon--spinning' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      className={classes}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {iconPaths[name]}
    </svg>
  )
}

export default Icon
