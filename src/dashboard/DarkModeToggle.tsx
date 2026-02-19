import React, { useEffect, useState, useCallback } from 'react'
import { storage } from '../utils/storage'
import type { DarkMode } from '../utils/types'
import { Button } from '../components/common/Button'
import { Icon } from '../components/common/Icon'

interface DarkModeToggleProps {
  className?: string
}

/**
 * Resolve the actual theme based on user preference and system preference
 */
function resolveTheme(userPreference: DarkMode): 'light' | 'dark' {
  if (userPreference === 'light') return 'light'
  if (userPreference === 'dark') return 'dark'
  // auto mode: respect system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Apply theme class to document element
 */
function applyThemeClass(theme: DarkMode): void {
  const root = document.documentElement
  // Remove all theme classes
  root.classList.remove('light', 'dark', 'auto')
  // Add the new theme class
  root.classList.add(theme)

  // For light/dark, also set explicit class for CSS variables
  const resolved = resolveTheme(theme)
  if (resolved === 'dark') {
    root.classList.add('dark')
  }
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className = '' }) => {
  const [darkMode, setDarkModeState] = useState<DarkMode>('auto')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Load initial dark mode preference
  useEffect(() => {
    const loadDarkMode = async () => {
      const savedMode = await storage.getDarkMode()
      setDarkModeState(savedMode)
      setResolvedTheme(resolveTheme(savedMode))
      applyThemeClass(savedMode)
    }
    loadDarkMode()
  }, [])

  // Listen for system preference changes when in auto mode
  useEffect(() => {
    if (darkMode !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setResolvedTheme(resolveTheme(darkMode))
      applyThemeClass(darkMode)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [darkMode])

  // Apply theme to document
  useEffect(() => {
    applyThemeClass(darkMode)
  }, [darkMode])

  const handleToggle = useCallback(async () => {
    // Cycle through modes: auto -> light -> dark -> auto
    const modes: DarkMode[] = ['auto', 'light', 'dark']
    const currentIndex = modes.indexOf(darkMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]

    setDarkModeState(nextMode)
    setResolvedTheme(resolveTheme(nextMode))
    applyThemeClass(nextMode)
    await storage.setDarkMode(nextMode)
  }, [darkMode])

  const getModeIcon = (): React.ReactNode => {
    switch (darkMode) {
      case 'light':
        return <Icon name="sun" size="md" aria-label="Light mode" />
      case 'dark':
        return <Icon name="moon" size="md" aria-label="Dark mode" />
      case 'auto':
      default:
        return <Icon name="laptop" size="md" aria-label="Auto mode" />
    }
  }

  const getModeLabel = (): string => {
    switch (darkMode) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'auto':
        return `Auto (${resolvedTheme})`
      default:
        return 'Auto'
    }
  }

  return (
    <Button
      variant="ghost"
      size="md"
      className={`dark-mode-toggle ${className}`}
      onClick={handleToggle}
      aria-label={`Toggle theme (current: ${getModeLabel()})`}
      title={getModeLabel()}
      leftIcon={getModeIcon()}
    >
      <span className="dark-mode-toggle__label">{getModeLabel()}</span>
    </Button>
  )
}

export default DarkModeToggle
