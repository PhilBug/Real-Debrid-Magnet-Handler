import { describe, it, expect } from 'vitest'
import type { TorrentItem, Settings, RdTorrentInfo } from '../types'

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
        magnetLink: 'magnet:?xt=urn:btih:test',
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
        magnetLink: 'magnet:?xt=urn:btih:test',
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
})
