import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { storage } from '../utils/storage'
import type { DarkMode } from '../utils/types'
import { ConversionDashboard } from './ConversionDashboard'

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

function DashboardApp() {
  // Apply dark mode on initial load to prevent flash
  useEffect(() => {
    const applyDarkMode = async () => {
      const darkMode = await storage.getDarkMode()
      applyThemeClass(darkMode)
    }
    applyDarkMode()

    // Listen for system preference changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = async () => {
      const darkMode = await storage.getDarkMode()
      if (darkMode === 'auto') {
        applyThemeClass('auto')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return <ConversionDashboard />
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<DashboardApp />)
}

export default DashboardApp
