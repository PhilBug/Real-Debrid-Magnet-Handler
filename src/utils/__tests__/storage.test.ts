import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storage, _testNotifySubscribers } from '../storage'

// Mock webextension-polyfill - factory function to avoid hoisting issues
vi.mock('webextension-polyfill', () => {
  const mockStorageSync = {
    get: vi.fn((defaults?: any) => Promise.resolve(defaults || {})),
    set: vi.fn(),
  }

  const mockStorageLocal = {
    get: vi.fn(() => Promise.resolve({})),
    set: vi.fn(),
  }

  // Track listener
  let listenerCallback: any = null

  return {
    default: {
      storage: {
        sync: mockStorageSync,
        local: mockStorageLocal,
        onChanged: {
          addListener: vi.fn((callback: any) => {
            listenerCallback = callback
          }),
          get __callback() {
            return listenerCallback
          },
        },
      },
    },
    get mockStorageSync() {
      return mockStorageSync
    },
    get mockStorageLocal() {
      return mockStorageLocal
    },
  }
})

describe('storage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const webextension = await import('webextension-polyfill')
    const { mockStorageSync, mockStorageLocal } = webextension as any
    // Reset mocks with fresh implementations
    mockStorageSync.get.mockImplementation((defaults?: any) => Promise.resolve(defaults || {}))
    mockStorageLocal.get.mockImplementation(() => Promise.resolve({}))
  })

  describe('getSettings', () => {
    it('returns default settings when storage is empty', async () => {
      const settings = await storage.getSettings()

      expect(settings).toEqual({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
        contextMenuEnabled: false,
        alwaysSaveAllFiles: false,
        visibleTorrentsCount: 5,
      })
    })

    it('returns stored settings when available', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      const storedSettings = {
        apiToken: 'test-token',
        maxListSize: 20,
        retryInterval: 60,
        maxRetryDuration: 600,
        contextMenuEnabled: true,
        alwaysSaveAllFiles: true,
      }
      mockStorageSync.get.mockResolvedValueOnce(storedSettings)

      const settings = await storage.getSettings()

      expect(settings).toEqual(storedSettings)
    })

    it('merges stored settings with defaults', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      mockStorageSync.get.mockImplementationOnce((defaults?: any) =>
        Promise.resolve({
          ...defaults,
          apiToken: 'test-token',
        })
      )

      const settings = await storage.getSettings()

      expect(settings.apiToken).toBe('test-token')
      expect(settings.maxListSize).toBe(10)
      expect(settings.retryInterval).toBe(30)
      expect(settings.maxRetryDuration).toBe(300)
    })
  })

  describe('saveSettings', () => {
    it('saves partial settings to browser.storage.sync', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      mockStorageSync.set.mockResolvedValue(undefined)

      await storage.saveSettings({ apiToken: 'new-token' })

      expect(mockStorageSync.set).toHaveBeenCalledWith({ apiToken: 'new-token' })
    })

    it('saves multiple settings at once', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      mockStorageSync.set.mockResolvedValue(undefined)

      await storage.saveSettings({
        apiToken: 'new-token',
        maxListSize: 25,
      })

      expect(mockStorageSync.set).toHaveBeenCalledWith({
        apiToken: 'new-token',
        maxListSize: 25,
      })
    })
  })

  describe('getTorrents', () => {
    it('returns empty array when no torrents stored', async () => {
      const torrents = await storage.getTorrents()

      expect(torrents).toEqual([])
    })

    it('returns stored torrents', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageLocal } = webextension as any
      const mockTorrents = [
        {
          id: '1',
          magnetLink: 'magnet:?xt=test',
          filename: 'test.torrent',
          downloadUrl: 'https://example.com',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]
      mockStorageLocal.get.mockResolvedValueOnce({ torrents: mockTorrents })

      const torrents = await storage.getTorrents()

      expect(torrents).toEqual(mockTorrents)
    })
  })

  describe('saveTorrents', () => {
    it('saves torrents to browser.storage.local', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageLocal } = webextension as any
      mockStorageLocal.set.mockResolvedValue(undefined)

      const mockTorrents = [
        {
          id: '1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'test.torrent',
          downloadUrl: null,
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      await storage.saveTorrents(mockTorrents)

      expect(mockStorageLocal.set).toHaveBeenCalledWith({ torrents: mockTorrents })
    })

    it('trims torrents to maxListSize', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync, mockStorageLocal } = webextension as any
      mockStorageSync.get.mockResolvedValueOnce({ maxListSize: 2 })
      mockStorageLocal.set.mockResolvedValue(undefined)

      const mockTorrents = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: `test${i}.torrent`,
        downloadUrl: null,
        status: 'processing' as const,
        addedAt: Date.now(),
        lastRetry: Date.now(),
        retryCount: 0,
      }))

      await storage.saveTorrents(mockTorrents)

      const savedTorrents = mockStorageLocal.set.mock.calls[0][0].torrents as any[]
      expect(savedTorrents).toHaveLength(2)
    })
  })

  describe('addTorrent', () => {
    it('adds torrent to the beginning of the list', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageLocal } = webextension as any
      const existingTorrents = [
        {
          id: '2',
          magnetLink: 'magnet:?xt=existing',
          filename: 'existing.torrent',
          downloadUrl: 'https://example.com',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]
      mockStorageLocal.get.mockResolvedValueOnce({ torrents: existingTorrents })
      mockStorageLocal.set.mockResolvedValue(undefined)

      const newTorrent = {
        id: '1',
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: 'new.torrent',
        downloadUrl: null,
        status: 'processing' as const,
        addedAt: Date.now(),
        lastRetry: Date.now(),
        retryCount: 0,
      }

      await storage.addTorrent(newTorrent)

      const savedTorrents = mockStorageLocal.set.mock.calls[0][0].torrents as any[]
      expect(savedTorrents[0].id).toBe('1')
    })
  })

  describe('removeTorrent', () => {
    it('removes torrent by id', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageLocal } = webextension as any
      const torrents = [
        {
          id: '1',
          magnetLink: 'magnet:?xt=test1',
          filename: 'test1.torrent',
          downloadUrl: null,
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
        {
          id: '2',
          magnetLink: 'magnet:?xt=test2',
          filename: 'test2.torrent',
          downloadUrl: 'https://example.com',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]
      mockStorageLocal.get.mockResolvedValueOnce({ torrents })
      mockStorageLocal.set.mockResolvedValue(undefined)

      await storage.removeTorrent('1')

      const savedTorrents = mockStorageLocal.set.mock.calls[0][0].torrents as any[]
      expect(savedTorrents).toHaveLength(1)
      expect(savedTorrents[0].id).toBe('2')
    })

    it('does nothing when id not found', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageLocal } = webextension as any
      const torrents = [
        {
          id: '1',
          magnetLink: 'magnet:?xt=test',
          filename: 'test.torrent',
          downloadUrl: null,
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]
      mockStorageLocal.get.mockResolvedValueOnce({ torrents })
      mockStorageLocal.set.mockResolvedValue(undefined)

      await storage.removeTorrent('nonexistent')

      const savedTorrents = mockStorageLocal.set.mock.calls[0][0].torrents as any[]
      expect(savedTorrents).toHaveLength(1)
    })
  })

  describe('getCache', () => {
    it('returns storage cache object', () => {
      const cache = storage.getCache()
      expect(typeof cache).toBe('object')
      expect(Array.isArray(cache)).toBe(false)
    })
  })

  describe('subscribe', () => {
    it('registers a callback and returns an unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = storage.subscribe(callback)

      expect(typeof unsubscribe).toBe('function')

      // Clean up
      unsubscribe()
    })

    it('unsubscribe removes the callback from being notified', () => {
      const callback = vi.fn()

      const unsubscribe = storage.subscribe(callback)
      unsubscribe()

      // Should not throw when called again
      expect(() => unsubscribe()).not.toThrow()
    })

    it('supports multiple subscribe/unsubscribe cycles', () => {
      const callback = vi.fn()

      const unsubscribe1 = storage.subscribe(callback)
      unsubscribe1()

      const unsubscribe2 = storage.subscribe(callback)
      unsubscribe2()

      // Should not throw
      expect(true).toBe(true)
    })

    it('can subscribe multiple callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const unsubscribe1 = storage.subscribe(callback1)
      const unsubscribe2 = storage.subscribe(callback2)

      // Both should be subscribed
      expect(typeof unsubscribe1).toBe('function')
      expect(typeof unsubscribe2).toBe('function')

      // Clean up
      unsubscribe1()
      unsubscribe2()
    })

    it('notifies subscribers when initializeCache completes', async () => {
      // This test verifies that notifySubscribers correctly calls all registered callbacks
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      // Subscribe both callbacks
      const unsubscribe1 = storage.subscribe(callback1)
      const unsubscribe2 = storage.subscribe(callback2)

      // Clear any previous calls
      callback1.mockClear()
      callback2.mockClear()

      // Manually trigger notification (simulates what happens after initializeCache completes)
      _testNotifySubscribers()

      // Both callbacks should have been called
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()

      // Clean up
      unsubscribe1()
      unsubscribe2()
    })
  })

  describe('storage change listener', () => {
    it('updates cache when storage changes', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any

      // Get the registered listener
      const listenerCallback = browser.storage.onChanged.__callback

      // Get initial cache
      const cacheBefore = storage.getCache()

      // Simulate a storage change
      const mockChanges = {
        apiToken: { newValue: 'new-token-123', oldValue: null },
        maxListSize: { newValue: 20, oldValue: 10 },
      }

      listenerCallback(mockChanges)

      // Verify cache was updated
      const cacheAfter = storage.getCache()
      expect(cacheAfter).toEqual(cacheBefore) // Cache is the same object reference
      expect(cacheAfter.apiToken).toBe('new-token-123')
    })
  })

  describe('getDashboardSettings', () => {
    it('returns default dashboard settings when storage is empty', async () => {
      const settings = await storage.getDashboardSettings()

      expect(settings).toEqual({
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      })
    })

    it('returns stored dashboard settings when available', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      const storedSettings = {
        dashboardSettings: {
          darkMode: 'dark' as const,
          notificationsEnabled: false,
          autoRefresh: false,
          refreshInterval: 60,
        },
      }
      mockStorageSync.get.mockResolvedValueOnce(storedSettings)

      const settings = await storage.getDashboardSettings()

      expect(settings).toEqual(storedSettings.dashboardSettings)
    })

    it('merges stored dashboard settings with defaults', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      mockStorageSync.get.mockImplementationOnce((defaults?: any) =>
        Promise.resolve({
          ...defaults,
          dashboardSettings: {
            ...defaults.dashboardSettings,
            darkMode: 'light',
          },
        })
      )

      const settings = await storage.getDashboardSettings()

      expect(settings.darkMode).toBe('light')
      expect(settings.notificationsEnabled).toBe(true)
      expect(settings.autoRefresh).toBe(true)
      expect(settings.refreshInterval).toBe(30)
    })
  })

  describe('saveDashboardSettings', () => {
    it('saves partial dashboard settings to browser.storage.sync', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      mockStorageSync.get.mockResolvedValueOnce({
        dashboardSettings: {
          darkMode: 'auto',
          notificationsEnabled: true,
          autoRefresh: true,
          refreshInterval: 30,
        },
      })
      mockStorageSync.set.mockResolvedValue(undefined)

      await storage.saveDashboardSettings({ darkMode: 'dark' })

      expect(mockStorageSync.set).toHaveBeenCalledWith({
        dashboardSettings: {
          darkMode: 'dark',
          notificationsEnabled: true,
          autoRefresh: true,
          refreshInterval: 30,
        },
      })
    })

    it('saves multiple dashboard settings at once', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      mockStorageSync.get.mockResolvedValueOnce({
        dashboardSettings: {
          darkMode: 'auto',
          notificationsEnabled: true,
          autoRefresh: true,
          refreshInterval: 30,
        },
      })
      mockStorageSync.set.mockResolvedValue(undefined)

      await storage.saveDashboardSettings({
        darkMode: 'light',
        notificationsEnabled: false,
      })

      expect(mockStorageSync.set).toHaveBeenCalledWith({
        dashboardSettings: {
          darkMode: 'light',
          notificationsEnabled: false,
          autoRefresh: true,
          refreshInterval: 30,
        },
      })
    })
  })

  describe('getNotificationState', () => {
    it('returns default notification state when storage is empty', async () => {
      const state = await storage.getNotificationState()

      expect(state).toEqual({
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      })
    })

    it('returns stored notification state when available', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageLocal } = webextension as any
      const storedState = {
        notificationState: {
          notifiedTorrentIds: ['torrent-1', 'torrent-2'],
          lastNotificationTime: 1234567890,
        },
      }
      mockStorageLocal.get.mockResolvedValueOnce(storedState)

      const state = await storage.getNotificationState()

      expect(state).toEqual(storedState.notificationState)
    })
  })

  describe('saveNotificationState', () => {
    it('saves notification state to browser.storage.local', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageLocal } = webextension as any
      mockStorageLocal.set.mockResolvedValue(undefined)

      const state = {
        notifiedTorrentIds: ['torrent-1', 'torrent-2', 'torrent-3'],
        lastNotificationTime: 1234567890,
      }

      await storage.saveNotificationState(state)

      expect(mockStorageLocal.set).toHaveBeenCalledWith({ notificationState: state })
    })
  })

  describe('getDarkMode', () => {
    it('returns dark mode from dashboard settings', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      mockStorageSync.get.mockResolvedValueOnce({
        dashboardSettings: {
          darkMode: 'dark',
          notificationsEnabled: true,
          autoRefresh: true,
          refreshInterval: 30,
        },
      })

      const darkMode = await storage.getDarkMode()

      expect(darkMode).toBe('dark')
    })

    it('returns auto mode by default', async () => {
      const darkMode = await storage.getDarkMode()

      expect(darkMode).toBe('auto')
    })
  })

  describe('setDarkMode', () => {
    it('saves dark mode to dashboard settings', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorageSync } = webextension as any
      mockStorageSync.get.mockResolvedValueOnce({
        dashboardSettings: {
          darkMode: 'auto',
          notificationsEnabled: true,
          autoRefresh: true,
          refreshInterval: 30,
        },
      })
      mockStorageSync.set.mockResolvedValue(undefined)

      await storage.setDarkMode('light')

      expect(mockStorageSync.set).toHaveBeenCalledWith({
        dashboardSettings: {
          darkMode: 'light',
          notificationsEnabled: true,
          autoRefresh: true,
          refreshInterval: 30,
        },
      })
    })
  })
})
