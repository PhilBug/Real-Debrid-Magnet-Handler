import React, { useEffect, useState } from 'react'
import { storage } from '../utils/storage'
import type { DarkMode } from '../utils/types'

interface DarkModeToggleProps {
  className?: string
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className = '' }) => {
  const [darkMode, setDarkModeState] = useState<DarkMode>('auto')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Resolve the actual theme based on user preference and system preference
  const resolveTheme = (userPreference: DarkMode): 'light' | 'dark' => {
    if (userPreference === 'light') return 'light'
    if (userPreference === 'dark') return 'dark'
    // auto mode: respect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Load initial dark mode preference
  useEffect(() => {
    const loadDarkMode = async () => {
      const savedMode = await storage.getDarkMode()
      setDarkModeState(savedMode)
      setResolvedTheme(resolveTheme(savedMode))
    }
    loadDarkMode()
  }, [])

  // Listen for system preference changes when in auto mode
  useEffect(() => {
    if (darkMode !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setResolvedTheme(resolveTheme(darkMode))
    }

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [darkMode])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const handleToggle = async () => {
    // Cycle through modes: auto -> light -> dark -> auto
    const modes: DarkMode[] = ['auto', 'light', 'dark']
    const currentIndex = modes.indexOf(darkMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]

    setDarkModeState(nextMode)
    setResolvedTheme(resolveTheme(nextMode))
    await storage.setDarkMode(nextMode)
  }

  const getModeIcon = (): string => {
    switch (darkMode) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'auto':
        return '🌗'
      default:
        return '🌗'
    }
  }

  const getModeLabel = (): string => {
    switch (darkMode) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      case 'auto':
        return `Auto (${resolvedTheme === 'dark' ? 'dark' : 'light'})`
      default:
        return 'Auto'
    }
  }

  return (
    <button
      className={`dark-mode-toggle ${className}`}
      onClick={handleToggle}
      aria-label={`Toggle theme (current: ${getModeLabel()})`}
      title={getModeLabel()}
    >
      <span className="dark-mode-icon">{getModeIcon()}</span>
      <span className="dark-mode-label">{getModeLabel()}</span>
    </button>
  )
}
