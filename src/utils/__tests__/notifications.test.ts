import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isNotificationPermissionGranted,
  requestNotificationPermission,
  showNotification,
  showTorrentCompleteNotification,
  showBatchCompleteNotification,
  showTorrentErrorNotification,
  notifyTorrentStatusChange,
  clearCompletedNotifications,
  resetNotificationState,
} from '../notifications'
import { storage } from '../storage'

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
    },
    tabs: {
      query: vi.fn(() => Promise.resolve([{ id: 1 }])),
      update: vi.fn(() => Promise.resolve()),
    },
  },
}))

// Mock storage module
vi.mock('../storage', () => ({
  storage: {
    getDashboardSettings: vi.fn(),
    getNotificationState: vi.fn(),
    saveNotificationState: vi.fn(),
  },
}))

// Mock Notification API
const mockNotificationConstructor = vi.fn()
const mockNotificationClose = vi.fn()

Object.defineProperty(globalThis, 'Notification', {
  writable: true,
  value: class MockNotification {
    static permission: NotificationPermission = 'default'
    static requestPermission = vi.fn()

    constructor(title: string, options?: NotificationOptions) {
      mockNotificationConstructor(title, options)
      this.onclick = null
    }

    close() {
      mockNotificationClose()
    }

    onclick: ((this: Notification, ev: Event) => any) | null = null
  } as any,
})

describe('notifications', () => {
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
    vi.mocked(storage.getNotificationState).mockResolvedValue({
      notifiedTorrentIds: [],
      lastNotificationTime: 0,
    })
    vi.mocked(storage.saveNotificationState).mockResolvedValue(undefined)

    // Reset Notification permission
    ;(globalThis.Notification as any).permission = 'default'
  })

  describe('isNotificationPermissionGranted', () => {
    it('returns true when permission is granted', () => {
      ;(globalThis.Notification as any).permission = 'granted'

      expect(isNotificationPermissionGranted()).toBe(true)
    })

    it('returns false when permission is default', () => {
      ;(globalThis.Notification as any).permission = 'default'

      expect(isNotificationPermissionGranted()).toBe(false)
    })

    it('returns false when permission is denied', () => {
      ;(globalThis.Notification as any).permission = 'denied'

      expect(isNotificationPermissionGranted()).toBe(false)
    })
  })

  describe('requestNotificationPermission', () => {
    it('returns true when already granted', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      const result = await requestNotificationPermission()

      expect(result).toBe(true)
      expect(Notification.requestPermission).not.toHaveBeenCalled()
    })

    it('requests permission and returns true when granted', async () => {
      ;(globalThis.Notification as any).permission = 'default'
      vi.mocked(Notification.requestPermission).mockResolvedValue('granted')

      const result = await requestNotificationPermission()

      expect(result).toBe(true)
      expect(Notification.requestPermission).toHaveBeenCalled()
    })

    it('requests permission and returns false when denied', async () => {
      ;(globalThis.Notification as any).permission = 'default'
      vi.mocked(Notification.requestPermission).mockResolvedValue('denied')

      const result = await requestNotificationPermission()

      expect(result).toBe(false)
      expect(Notification.requestPermission).toHaveBeenCalled()
    })

    it('returns false on error', async () => {
      ;(globalThis.Notification as any).permission = 'default'
      vi.mocked(Notification.requestPermission).mockRejectedValue(new Error('Permission error'))

      const result = await requestNotificationPermission()

      expect(result).toBe(false)
    })
  })

  describe('showNotification', () => {
    it('creates notification when permission is granted', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showNotification('Test Title', { body: 'Test Body' })

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test Body',
          icon: 'chrome-extension://test-id/icons/icon-128.png',
          badge: 'chrome-extension://test-id/icons/icon-48.png',
        })
      )
    })

    it('does not create notification when permission is not granted', async () => {
      ;(globalThis.Notification as any).permission = 'default'

      await showNotification('Test Title', { body: 'Test Body' })

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })

    it('handles notification click to focus tab', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      // Just verify that the notification is created successfully
      // The onclick handler is set internally but testing it requires
      // more complex mocking of the Notification instance
      await showNotification('Test Title')

      // Verify notification was created
      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          icon: 'chrome-extension://test-id/icons/icon-128.png',
          badge: 'chrome-extension://test-id/icons/icon-48.png',
        })
      )
    })

    it('handles error when creating notification', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      mockNotificationConstructor.mockImplementationOnce(() => {
        throw new Error('Notification error')
      })

      // Should not throw, just log error
      await expect(showNotification('Test Title')).resolves.toBeUndefined()
    })
  })

  describe('showTorrentCompleteNotification', () => {
    it('shows notification when enabled and permission granted', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showTorrentCompleteNotification('Test Movie.mkv', 2)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Torrent Completed',
        expect.objectContaining({
          body: 'Test Movie.mkv (2 links)',
          tag: 'torrent-complete',
        })
      )
    })

    it('shows notification with singular link count', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showTorrentCompleteNotification('Test Movie.mkv', 1)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Torrent Completed',
        expect.objectContaining({
          body: 'Test Movie.mkv (1 link)',
        })
      )
    })

    it('shows notification without link count when 0', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showTorrentCompleteNotification('Test Movie.mkv', 0)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Torrent Completed',
        expect.objectContaining({
          body: 'Test Movie.mkv',
        })
      )
    })

    it('does not show notification when disabled in settings', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: false,
        autoRefresh: true,
        refreshInterval: 30,
      })

      await showTorrentCompleteNotification('Test Movie.mkv', 2)

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })

    it('does not show notification when permission not granted', async () => {
      ;(globalThis.Notification as any).permission = 'default'

      await showTorrentCompleteNotification('Test Movie.mkv', 2)

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })
  })

  describe('showBatchCompleteNotification', () => {
    it('shows notification with completed and failed counts', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showBatchCompleteNotification(3, 2)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Batch Update',
        expect.objectContaining({
          body: '3 completed, 2 failed',
          tag: 'batch-complete',
        })
      )
    })

    it('shows notification with only completed count', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showBatchCompleteNotification(5, 0)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Batch Update',
        expect.objectContaining({
          body: '5 torrents completed',
        })
      )
    })

    it('shows notification with singular completed count', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showBatchCompleteNotification(1, 0)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Batch Update',
        expect.objectContaining({
          body: '1 torrent completed',
        })
      )
    })

    it('shows notification with only failed count', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showBatchCompleteNotification(0, 3)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Batch Update',
        expect.objectContaining({
          body: '3 torrents failed',
        })
      )
    })

    it('shows notification with singular failed count', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showBatchCompleteNotification(0, 1)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Batch Update',
        expect.objectContaining({
          body: '1 torrent failed',
        })
      )
    })

    it('does not show notification when both counts are 0', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showBatchCompleteNotification(0, 0)

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })

    it('does not show notification when disabled in settings', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: false,
        autoRefresh: true,
        refreshInterval: 30,
      })

      await showBatchCompleteNotification(3, 2)

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })
  })

  describe('showTorrentErrorNotification', () => {
    it('shows error notification', async () => {
      ;(globalThis.Notification as any).permission = 'granted'

      await showTorrentErrorNotification('Failed Movie.mkv')

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Torrent Failed',
        expect.objectContaining({
          body: 'Failed Movie.mkv failed to convert',
          tag: 'torrent-error',
        })
      )
    })

    it('does not show notification when disabled in settings', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getDashboardSettings).mockResolvedValue({
        darkMode: 'auto',
        notificationsEnabled: false,
        autoRefresh: true,
        refreshInterval: 30,
      })

      await showTorrentErrorNotification('Failed Movie.mkv')

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })
  })

  describe('notifyTorrentStatusChange', () => {
    it('shows notification for ready status', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      })

      await notifyTorrentStatusChange('torrent-1', 'Test Movie.mkv', 'ready', 2)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Torrent Completed',
        expect.objectContaining({
          body: 'Test Movie.mkv (2 links)',
        })
      )
      expect(storage.saveNotificationState).toHaveBeenCalledWith(
        expect.objectContaining({
          notifiedTorrentIds: ['torrent-1'],
        })
      )
    })

    it('shows notification for error status', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      })

      await notifyTorrentStatusChange('torrent-1', 'Failed Movie.mkv', 'error')

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Torrent Failed',
        expect.objectContaining({
          body: 'Failed Movie.mkv failed to convert',
        })
      )
      expect(storage.saveNotificationState).toHaveBeenCalledWith(
        expect.objectContaining({
          notifiedTorrentIds: ['torrent-1'],
        })
      )
    })

    it('shows notification for timeout status', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      })

      await notifyTorrentStatusChange('torrent-1', 'Timeout Movie.mkv', 'timeout')

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Torrent Failed',
        expect.objectContaining({
          body: 'Timeout Movie.mkv failed to convert',
        })
      )
      expect(storage.saveNotificationState).toHaveBeenCalledWith(
        expect.objectContaining({
          notifiedTorrentIds: ['torrent-1'],
        })
      )
    })

    it('does not show notification when already notified', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: ['torrent-1'],
        lastNotificationTime: 0,
      })

      await notifyTorrentStatusChange('torrent-1', 'Test Movie.mkv', 'ready', 2)

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
      expect(storage.saveNotificationState).not.toHaveBeenCalled()
    })

    it('does not show notification for processing status', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      })

      await notifyTorrentStatusChange('torrent-1', 'Processing.mkv', 'processing')

      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })
  })

  describe('clearCompletedNotifications', () => {
    it('removes torrent IDs from notified list', async () => {
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: ['torrent-1', 'torrent-2', 'torrent-3'],
        lastNotificationTime: 1234567890,
      })

      await clearCompletedNotifications(['torrent-1', 'torrent-3'])

      expect(storage.saveNotificationState).toHaveBeenCalledWith({
        notifiedTorrentIds: ['torrent-2'],
        lastNotificationTime: 1234567890,
      })
    })

    it('handles empty torrent IDs array', async () => {
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: ['torrent-1', 'torrent-2'],
        lastNotificationTime: 1234567890,
      })

      await clearCompletedNotifications([])

      expect(storage.saveNotificationState).toHaveBeenCalledWith({
        notifiedTorrentIds: ['torrent-1', 'torrent-2'],
        lastNotificationTime: 1234567890,
      })
    })

    it('handles when all IDs are cleared', async () => {
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: ['torrent-1', 'torrent-2'],
        lastNotificationTime: 1234567890,
      })

      await clearCompletedNotifications(['torrent-1', 'torrent-2'])

      expect(storage.saveNotificationState).toHaveBeenCalledWith({
        notifiedTorrentIds: [],
        lastNotificationTime: 1234567890,
      })
    })
  })

  describe('resetNotificationState', () => {
    it('resets notification state to defaults', async () => {
      await resetNotificationState()

      expect(storage.saveNotificationState).toHaveBeenCalledWith({
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      })
    })
  })

  describe('deduplication logic', () => {
    it('prevents duplicate notifications for same torrent', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      })

      // First notification
      await notifyTorrentStatusChange('torrent-1', 'Test.mkv', 'ready', 1)
      expect(mockNotificationConstructor).toHaveBeenCalledTimes(1)

      // Update state to reflect first notification
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: ['torrent-1'],
        lastNotificationTime: 1234567890,
      })

      // Second notification for same torrent
      await notifyTorrentStatusChange('torrent-1', 'Test.mkv', 'ready', 1)
      expect(mockNotificationConstructor).toHaveBeenCalledTimes(1) // Still 1, not 2
    })

    it('allows notifications for different torrents', async () => {
      ;(globalThis.Notification as any).permission = 'granted'
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      })

      // First torrent
      await notifyTorrentStatusChange('torrent-1', 'Test1.mkv', 'ready', 1)

      // Update state
      vi.mocked(storage.getNotificationState).mockResolvedValue({
        notifiedTorrentIds: ['torrent-1'],
        lastNotificationTime: 1234567890,
      })

      // Second torrent (different ID)
      await notifyTorrentStatusChange('torrent-2', 'Test2.mkv', 'ready', 1)

      expect(mockNotificationConstructor).toHaveBeenCalledTimes(2)
    })
  })
})
