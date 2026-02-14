import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { NotificationManager } from '../NotificationManager'
import { storage } from '../../utils/storage'
import {
  requestNotificationPermission,
  isNotificationPermissionGranted,
} from '../../utils/notifications'

// Mock storage module
vi.mock('../../utils/storage', () => ({
  storage: {
    getDashboardSettings: vi.fn(),
    saveDashboardSettings: vi.fn(),
  },
}))

// Mock notifications module
vi.mock('../../utils/notifications', () => ({
  requestNotificationPermission: vi.fn(),
  isNotificationPermissionGranted: vi.fn(),
}))

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
}))

// Mock Notification API
const mockNotification = Object.assign(vi.fn(), {
  permission: 'default' as NotificationPermission,
})
Object.defineProperty(global, 'Notification', {
  writable: true,
  value: mockNotification,
})

describe('NotificationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()

    // Default mocks
    vi.mocked(storage.getDashboardSettings).mockResolvedValue({
      darkMode: 'auto',
      notificationsEnabled: true,
      autoRefresh: true,
      refreshInterval: 30,
    })
    vi.mocked(isNotificationPermissionGranted).mockReturnValue(false)
    vi.mocked(requestNotificationPermission).mockResolvedValue(false)
    mockNotification.permission = 'default'
  })

  describe('initial rendering', () => {
    it('renders null when dashboard settings are not loaded', () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue(null as any)

      const { container } = render(<NotificationManager />)

      expect(container.firstChild).toBeNull()
    })

    it('renders notification toggle when settings are loaded', async () => {
      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
    })

    it('shows permission request banner when notifications enabled but not granted', async () => {
      vi.mocked(isNotificationPermissionGranted).mockReturnValue(false)
      mockNotification.permission = 'default'

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByText('Enable Notifications')).toBeInTheDocument()
        expect(
          screen.getByText('Get notified when your torrents complete or fail')
        ).toBeInTheDocument()
      })
    })

    it('does not show permission request when permission is granted', async () => {
      vi.mocked(isNotificationPermissionGranted).mockReturnValue(true)
      mockNotification.permission = 'granted'

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument()
      })
    })

    it('does not show permission request when notifications are disabled', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: false,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument()
      })
    })
  })

  describe('permission request handling', () => {
    it('requests permission when Allow Notifications clicked', async () => {
      vi.mocked(requestNotificationPermission).mockResolvedValue(true)
      mockNotification.permission = 'default'

      render(<NotificationManager />)

      await waitFor(() => {
        const allowButton = screen.getByText('Allow Notifications')
        expect(allowButton).toBeInTheDocument()
      })

      const allowButton = screen.getByText('Allow Notifications')
      fireEvent.click(allowButton)

      await waitFor(() => {
        expect(requestNotificationPermission).toHaveBeenCalled()
      })
    })

    it('shows "Requesting..." while requesting permission', async () => {
      let resolvePermission: (value: boolean) => void
      vi.mocked(requestNotificationPermission).mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePermission = resolve
          })
      )
      mockNotification.permission = 'default'

      render(<NotificationManager />)

      await waitFor(() => {
        const allowButton = screen.getByText('Allow Notifications')
        fireEvent.click(allowButton)
      })

      expect(screen.getByText('Requesting...')).toBeInTheDocument()

      // Resolve the promise
      resolvePermission!(true)

      await waitFor(() => {
        expect(screen.queryByText('Requesting...')).not.toBeInTheDocument()
      })
    })

    it('disables notifications when permission denied', async () => {
      vi.mocked(requestNotificationPermission).mockResolvedValue(false)
      mockNotification.permission = 'denied'

      render(<NotificationManager />)

      await waitFor(() => {
        const allowButton = screen.getByText('Allow Notifications')
        fireEvent.click(allowButton)
      })

      await waitFor(() => {
        expect(storage.saveDashboardSettings).toHaveBeenCalledWith({
          notificationsEnabled: false,
        })
      })
    })

    it('dismisses permission request when Not Now clicked', async () => {
      mockNotification.permission = 'default'

      render(<NotificationManager />)

      await waitFor(() => {
        const notNowButton = screen.getByText('Not Now')
        expect(notNowButton).toBeInTheDocument()
      })

      const notNowButton = screen.getByText('Not Now')
      fireEvent.click(notNowButton)

      await waitFor(() => {
        expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument()
      })
    })

    it('disables notifications when permission request dismissed', async () => {
      mockNotification.permission = 'default'

      render(<NotificationManager />)

      await waitFor(() => {
        const notNowButton = screen.getByText('Not Now')
        fireEvent.click(notNowButton)
      })

      await waitFor(() => {
        expect(storage.saveDashboardSettings).toHaveBeenCalledWith({
          notificationsEnabled: false,
        })
      })
    })
  })

  describe('notification toggle', () => {
    it('shows enabled state when notifications are enabled', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Disable notifications/ })
        expect(toggle).toHaveClass('enabled')
        expect(toggle).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('shows disabled state when notifications are disabled', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: false,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Enable notifications/ })
        expect(toggle).toHaveClass('disabled')
        expect(toggle).toHaveAttribute('aria-pressed', 'false')
      })
    })

    it('enables notifications when toggle clicked while disabled', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: false,
        autoRefresh: true,
        refreshInterval: 30,
      })
      vi.mocked(isNotificationPermissionGranted).mockReturnValue(true)

      render(<NotificationManager />)

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Enable notifications/ })
        fireEvent.click(toggle)
      })

      await waitFor(() => {
        expect(storage.saveDashboardSettings).toHaveBeenCalledWith({
          notificationsEnabled: true,
        })
      })
    })

    it('disables notifications when toggle clicked while enabled', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Disable notifications/ })
        fireEvent.click(toggle)
      })

      await waitFor(() => {
        expect(storage.saveDashboardSettings).toHaveBeenCalledWith({
          notificationsEnabled: false,
        })
      })
    })

    it('shows permission request when enabling notifications without permission', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: false,
        autoRefresh: true,
        refreshInterval: 30,
      })
      vi.mocked(isNotificationPermissionGranted).mockReturnValue(false)
      mockNotification.permission = 'default'

      render(<NotificationManager />)

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Enable notifications/ })
        fireEvent.click(toggle)
      })

      await waitFor(() => {
        expect(screen.getByText('Enable Notifications')).toBeInTheDocument()
      })
    })
  })

  describe('permission status indicator', () => {
    it('shows checkmark when permission is granted', async () => {
      vi.mocked(isNotificationPermissionGranted).mockReturnValue(true)
      mockNotification.permission = 'granted'

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByText('✓')).toBeInTheDocument()
      })
    })

    it('shows X when permission is denied', async () => {
      vi.mocked(isNotificationPermissionGranted).mockReturnValue(false)
      mockNotification.permission = 'denied'

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByText('✗')).toBeInTheDocument()
      })
    })

    it('shows nothing when permission is default', async () => {
      vi.mocked(isNotificationPermissionGranted).mockReturnValue(false)
      mockNotification.permission = 'default'

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.queryByText('✓')).not.toBeInTheDocument()
        expect(screen.queryByText('✗')).not.toBeInTheDocument()
      })
    })

    it('shows denied warning when permission denied and notifications enabled', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })
      vi.mocked(isNotificationPermissionGranted).mockReturnValue(false)
      mockNotification.permission = 'denied'

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument()
        expect(
          screen.getByText('Notifications are blocked in browser settings')
        ).toBeInTheDocument()
      })
    })
  })

  describe('storage change handling', () => {
    it('updates when dashboard settings change', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })

      // Get the listener callback
      const addListenerCalls = browser.storage.onChanged.addListener.mock.calls
      const listenerCallback = addListenerCalls[0][0]

      // Simulate storage change
      listenerCallback(
        {
          dashboardSettings: {
            newValue: {
              darkMode: 'auto',
              notificationsEnabled: false,
              autoRefresh: true,
              refreshInterval: 30,
            },
          },
        },
        'sync'
      )

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Enable notifications/ })
        expect(toggle).toHaveClass('disabled')
      })
    })
  })

  describe('accessibility', () => {
    it('has proper aria-label on toggle', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Disable notifications/ })
        expect(toggle).toHaveAttribute('aria-label', 'Disable notifications')
      })
    })

    it('has proper aria-pressed attribute', async () => {
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /Disable notifications/ })
        expect(toggle).toHaveAttribute('aria-pressed', 'true')
      })
    })
  })

  describe('custom className', () => {
    it('applies custom className', async () => {
      const { container } = render(<NotificationManager className="custom-class" />)

      await waitFor(() => {
        const manager = container.querySelector('.notification-manager')
        expect(manager).toHaveClass('custom-class')
      })
    })
  })

  describe('error handling', () => {
    it('handles error when requesting permission', async () => {
      vi.mocked(requestNotificationPermission).mockRejectedValueOnce(new Error('Permission error'))

      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByText('Enable Notifications')).toBeInTheDocument()
      })

      const allowButton = screen.getByRole('button', { name: 'Allow Notifications' })
      fireEvent.click(allowButton)

      // Error should be logged but not throw
      await waitFor(() => {
        expect(requestNotificationPermission).toHaveBeenCalled()
      })
    })

    it('handles error when toggling notifications', async () => {
      vi.mocked(storage.saveDashboardSettings).mockRejectedValueOnce(new Error('Save error'))

      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Disable notifications' })).toBeInTheDocument()
      })

      const toggleButton = screen.getByRole('button', { name: 'Disable notifications' })
      fireEvent.click(toggleButton)

      // Error should be logged but not throw
      await waitFor(() => {
        expect(storage.saveDashboardSettings).toHaveBeenCalled()
      })
    })

    it('handles error when dismissing permission request', async () => {
      vi.mocked(storage.saveDashboardSettings).mockRejectedValueOnce(new Error('Save error'))

      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })

      render(<NotificationManager />)

      await waitFor(() => {
        expect(screen.getByText('Not Now')).toBeInTheDocument()
      })

      const dismissButton = screen.getByRole('button', { name: 'Not Now' })
      fireEvent.click(dismissButton)

      // Error should be logged but not throw
      await waitFor(() => {
        expect(storage.saveDashboardSettings).toHaveBeenCalled()
      })
    })
  })
})
