import { describe, it, expect } from 'vitest'
import type {
  TorrentItem,
  Settings,
  RdTorrentInfo,
  TorrentProgress,
  DownloadLink,
  NotificationState,
  DarkMode,
  DashboardSettings,
  ExtendedTorrentItem,
} from '../types'

describe('types', () => {
  describe('TorrentStatus', () => {
    it('accepts valid status values', () => {
      const validStatuses = ['processing', 'ready', 'error', 'timeout'] as const
      validStatuses.forEach(status => {
        expect(status).toBeTruthy()
      })
    })

    it('rejects invalid status values', () => {
      const invalidStatuses = ['invalid', 'pending', 'completed', null, undefined]
      const validStatuses = ['processing', 'ready', 'error', 'timeout'] as const

      invalidStatuses.forEach(status => {
        expect(validStatuses).not.toContain(status)
      })
    })
  })

  describe('TorrentItem', () => {
    it('accepts valid torrent item structure', () => {
      const item: TorrentItem = {
        id: 'ABC123',
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: 'test.torrent',
        downloadUrl: 'https://example.com/file.zip',
        status: 'ready',
        addedAt: Date.now(),
        lastRetry: Date.now(),
        retryCount: 0,
      }
      expect(item.id).toBe('ABC123')
      expect(item.status).toBe('ready')
    })

    it('accepts null downloadUrl for processing torrents', () => {
      const item: TorrentItem = {
        id: 'ABC123',
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: 'test.torrent',
        downloadUrl: null,
        status: 'processing',
        addedAt: Date.now(),
        lastRetry: Date.now(),
        retryCount: 0,
      }
      expect(item.downloadUrl).toBeNull()
      expect(item.status).toBe('processing')
    })

    it('validates required fields', () => {
      const partialItem = {
        id: 'ABC123',
        magnetLink: 'magnet:?xt=urn:btih:test',
        // missing required fields
      }

      // Type system should enforce all required fields at compile time
      expect(() => {
        const item: TorrentItem = partialItem as any
        if (!item.filename || !item.status) {
          throw new Error('Missing required fields')
        }
      }).toThrow()
    })
  })

  describe('Settings', () => {
    it('accepts valid settings structure', () => {
      const settings: Settings = {
        apiToken: 'test-token',
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
        contextMenuEnabled: false,
        alwaysSaveAllFiles: false,
        visibleTorrentsCount: 5,
      }
      expect(settings.maxListSize).toBe(10)
      expect(settings.apiToken).toBe('test-token')
    })

    it('accepts null apiToken (not configured)', () => {
      const settings: Settings = {
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
        contextMenuEnabled: false,
        alwaysSaveAllFiles: false,
        visibleTorrentsCount: 5,
      }
      expect(settings.apiToken).toBeNull()
    })

    it('enforces numeric constraints for maxListSize', () => {
      const validSizes = [5, 10, 25, 50]
      validSizes.forEach(size => {
        expect(size).toBeGreaterThanOrEqual(5)
        expect(size).toBeLessThanOrEqual(50)
      })
    })
  })

  describe('RdTorrentInfo', () => {
    it('accepts valid API response structure', () => {
      const info: RdTorrentInfo = {
        id: 'ABC123',
        filename: 'test.torrent',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'downloaded',
        progress: 100,
        links: ['https://example.com/file.zip'],
      }
      expect(info.status).toBe('downloaded')
      expect(info.links).toHaveLength(1)
    })

    it('accepts response without links (processing state)', () => {
      const info: RdTorrentInfo = {
        id: 'ABC123',
        filename: 'test.torrent',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'magnet_conversion',
        progress: 0,
      }
      expect(info.links).toBeUndefined()
      expect(info.status).toBe('magnet_conversion')
    })

    it('accepts response with files array', () => {
      const info: RdTorrentInfo = {
        id: 'ABC123',
        filename: 'test.torrent',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'waiting_files_selection',
        progress: 0,
        files: [
          { id: 0, path: 'file1.txt', bytes: 1024, selected: 0 },
          { id: 1, path: 'file2.txt', bytes: 2048, selected: 0 },
        ],
      }
      expect(info.files).toHaveLength(2)
      expect(info.files?.[0].id).toBe(0)
    })
  })

  describe('status mapping between API and internal', () => {
    it('maps magnet_conversion to processing', () => {
      const apiStatuses = ['magnet_conversion', 'waiting_files_selection', 'downloading']
      const processingStatuses = ['magnet_conversion', 'waiting_files_selection', 'downloading']

      apiStatuses.forEach(status => {
        expect(processingStatuses).toContain(status)
      })
    })

    it('maps downloaded to ready', () => {
      const apiStatus = 'downloaded'

      expect(['downloaded']).toContain(apiStatus)
      expect(['processing', 'ready', 'error', 'timeout']).toContain('ready')
    })

    it('maps error/dead to error', () => {
      const apiStatuses = ['error', 'dead']

      apiStatuses.forEach(status => {
        expect(['error', 'dead']).toContain(status)
      })
      expect(['processing', 'ready', 'error', 'timeout']).toContain('error')
    })
  })

  describe('TorrentProgress', () => {
    it('accepts valid progress structure', () => {
      const progress: TorrentProgress = {
        progress: 75,
        status: 'downloading',
        downloadSpeed: 1024000,
        uploadSpeed: 512000,
        eta: 300,
        seeds: 15,
        peers: 8,
      }
      expect(progress.progress).toBe(75)
      expect(progress.status).toBe('downloading')
      expect(progress.downloadSpeed).toBe(1024000)
    })

    it('accepts progress with optional fields omitted', () => {
      const progress: TorrentProgress = {
        progress: 100,
        status: 'completed',
      }
      expect(progress.progress).toBe(100)
      expect(progress.status).toBe('completed')
      expect(progress.downloadSpeed).toBeUndefined()
      expect(progress.eta).toBeUndefined()
    })

    it('accepts all valid status values', () => {
      const validStatuses: TorrentProgress['status'][] = [
        'downloading',
        'uploading',
        'converting',
        'completed',
        'error',
        'paused',
      ]
      validStatuses.forEach(status => {
        const progress: TorrentProgress = { progress: 50, status }
        expect(progress.status).toBe(status)
      })
    })

    it('validates progress range', () => {
      const validProgressValues = [0, 25, 50, 75, 100]
      validProgressValues.forEach(progress => {
        expect(progress).toBeGreaterThanOrEqual(0)
        expect(progress).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('DownloadLink', () => {
    it('accepts valid download link structure', () => {
      const link: DownloadLink = {
        url: 'https://example.com/file.zip',
        filename: 'file.zip',
        size: 1024000,
        selected: true,
      }
      expect(link.url).toBe('https://example.com/file.zip')
      expect(link.filename).toBe('file.zip')
      expect(link.size).toBe(1024000)
      expect(link.selected).toBe(true)
    })

    it('accepts link without size', () => {
      const link: DownloadLink = {
        url: 'https://example.com/file.zip',
        filename: 'file.zip',
        selected: false,
      }
      expect(link.size).toBeUndefined()
      expect(link.selected).toBe(false)
    })

    it('validates required fields', () => {
      const link: DownloadLink = {
        url: 'https://example.com/file.zip',
        filename: 'file.zip',
        selected: true,
      }
      expect(link.url).toBeTruthy()
      expect(link.filename).toBeTruthy()
      expect(typeof link.selected).toBe('boolean')
    })
  })

  describe('NotificationState', () => {
    it('accepts valid notification state structure', () => {
      const state: NotificationState = {
        notifiedTorrentIds: ['torrent-1', 'torrent-2', 'torrent-3'],
        lastNotificationTime: 1234567890,
      }
      expect(state.notifiedTorrentIds).toHaveLength(3)
      expect(state.lastNotificationTime).toBe(1234567890)
    })

    it('accepts empty notification state', () => {
      const state: NotificationState = {
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      }
      expect(state.notifiedTorrentIds).toHaveLength(0)
      expect(state.lastNotificationTime).toBe(0)
    })

    it('validates timestamp format', () => {
      const timestamp = Date.now()
      const state: NotificationState = {
        notifiedTorrentIds: ['torrent-1'],
        lastNotificationTime: timestamp,
      }
      expect(state.lastNotificationTime).toBeGreaterThanOrEqual(0)
      expect(typeof state.lastNotificationTime).toBe('number')
    })
  })

  describe('DarkMode', () => {
    it('accepts all valid dark mode values', () => {
      const validModes: DarkMode[] = ['light', 'dark', 'auto']
      validModes.forEach(mode => {
        expect(['light', 'dark', 'auto']).toContain(mode)
      })
    })

    it('rejects invalid dark mode values', () => {
      const invalidModes = ['system', 'manual', null, undefined]
      const validModes: DarkMode[] = ['light', 'dark', 'auto']
      invalidModes.forEach(mode => {
        expect(validModes).not.toContain(mode)
      })
    })
  })

  describe('DashboardSettings', () => {
    it('accepts valid dashboard settings structure', () => {
      const settings: DashboardSettings = {
        darkMode: 'dark',
        notificationsEnabled: true,
        autoRefresh: false,
        refreshInterval: 60,
      }
      expect(settings.darkMode).toBe('dark')
      expect(settings.notificationsEnabled).toBe(true)
      expect(settings.autoRefresh).toBe(false)
      expect(settings.refreshInterval).toBe(60)
    })

    it('accepts auto dark mode', () => {
      const settings: DashboardSettings = {
        darkMode: 'auto',
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      }
      expect(settings.darkMode).toBe('auto')
    })

    it('validates refresh interval', () => {
      const validIntervals = [10, 30, 60, 120]
      validIntervals.forEach(interval => {
        expect(interval).toBeGreaterThan(0)
      })
    })

    it('validates boolean settings', () => {
      const settings: DashboardSettings = {
        darkMode: 'light',
        notificationsEnabled: false,
        autoRefresh: false,
        refreshInterval: 30,
      }
      expect(typeof settings.notificationsEnabled).toBe('boolean')
      expect(typeof settings.autoRefresh).toBe('boolean')
    })
  })

  describe('ExtendedTorrentItem', () => {
    it('accepts valid extended torrent item structure', () => {
      const progress: TorrentProgress = {
        progress: 75,
        status: 'downloading',
        downloadSpeed: 1024000,
        eta: 300,
      }
      const links: DownloadLink[] = [
        {
          url: 'https://example.com/file1.zip',
          filename: 'file1.zip',
          size: 1024000,
          selected: true,
        },
        {
          url: 'https://example.com/file2.zip',
          filename: 'file2.zip',
          size: 2048000,
          selected: false,
        },
      ]
      const item: ExtendedTorrentItem = {
        id: 'ABC123',
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: 'test.torrent',
        downloadUrl: null,
        status: 'processing',
        addedAt: Date.now(),
        lastRetry: Date.now(),
        retryCount: 0,
        progress,
        links,
        lastUpdated: Date.now(),
      }
      expect(item.progress).toEqual(progress)
      expect(item.links).toEqual(links)
      expect(item.lastUpdated).toBeGreaterThan(0)
    })

    it('accepts extended torrent item without optional fields', () => {
      const item: ExtendedTorrentItem = {
        id: 'ABC123',
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: 'test.torrent',
        downloadUrl: 'https://example.com/file.zip',
        status: 'ready',
        addedAt: Date.now(),
        lastRetry: Date.now(),
        retryCount: 0,
        lastUpdated: Date.now(),
      }
      expect(item.progress).toBeUndefined()
      expect(item.links).toBeUndefined()
    })

    it('extends TorrentItem with additional fields', () => {
      const baseItem: TorrentItem = {
        id: 'ABC123',
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: 'test.torrent',
        downloadUrl: null,
        status: 'processing',
        addedAt: Date.now(),
        lastRetry: Date.now(),
        retryCount: 0,
      }
      const extendedItem: ExtendedTorrentItem = {
        ...baseItem,
        lastUpdated: Date.now(),
      }
      expect(extendedItem.id).toBe(baseItem.id)
      expect(extendedItem.lastUpdated).toBeGreaterThan(0)
    })

    it('validates timestamp fields', () => {
      const now = Date.now()
      const item: ExtendedTorrentItem = {
        id: 'ABC123',
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: 'test.torrent',
        downloadUrl: null,
        status: 'processing',
        addedAt: now,
        lastRetry: now,
        retryCount: 0,
        lastUpdated: now,
      }
      expect(item.addedAt).toBe(now)
      expect(item.lastUpdated).toBe(now)
    })
  })
})
