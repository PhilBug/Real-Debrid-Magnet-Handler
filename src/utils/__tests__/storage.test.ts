import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storage } from '../storage'

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
})
