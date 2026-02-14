import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { storage } from '../utils/storage'
import { ConversionDashboard } from './ConversionDashboard'

function DashboardApp() {
  // Apply dark mode on initial load to prevent flash
  useEffect(() => {
    const applyDarkMode = async () => {
      const darkMode = await storage.getDarkMode()
      const resolveTheme = (userPreference: 'light' | 'dark' | 'auto'): 'light' | 'dark' => {
        if (userPreference === 'light') return 'light'
        if (userPreference === 'dark') return 'dark'
        // auto mode: respect system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      const resolvedTheme = resolveTheme(darkMode)
      document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    }
    applyDarkMode()
  }, [])

  return <ConversionDashboard />
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<DashboardApp />)
}

export default DashboardApp
