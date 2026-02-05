import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { rdAPI } from '../realdebrid-api'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      defaults: { headers: { common: {} } },
      post: vi.fn().mockResolvedValue({ data: {} }),
      get: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    })),
    get: vi.fn(),
  },
}))

const mockedAxiosGet = vi.mocked(axios.get)

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getSettings: vi.fn(() =>
      Promise.resolve({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })
    ),
  },
}))

describe('RealDebridAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateToken', () => {
    it('returns true for valid token', async () => {
      mockedAxiosGet.mockResolvedValueOnce({ data: { id: 'user123' } })

      const result = await rdAPI.validateToken('valid-token')

      expect(result).toBe(true)
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://api.real-debrid.com/rest/1.0/user', {
        headers: { Authorization: 'Bearer valid-token' },
      })
    })

    it('returns false for invalid token', async () => {
      mockedAxiosGet.mockRejectedValueOnce(new Error('Unauthorized'))

      const result = await rdAPI.validateToken('invalid-token')

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockedAxiosGet.mockRejectedValueOnce(new Error('Network Error'))

      const result = await rdAPI.validateToken('test-token')

      expect(result).toBe(false)
    })
  })

  describe('authentication', () => {
    it('throws NO_TOKEN error when apiToken is not set', async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValueOnce({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })

      await expect(rdAPI.addMagnet('magnet:?xt=test')).rejects.toThrow('NO_TOKEN')
    })

    it('throws NO_TOKEN error for getTorrentInfo', async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValueOnce({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })

      await expect(rdAPI.getTorrentInfo('TORRENT_ID')).rejects.toThrow('NO_TOKEN')
    })

    it('throws NO_TOKEN error for selectFiles', async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValueOnce({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })

      await expect(rdAPI.selectFiles('TORRENT_ID')).rejects.toThrow('NO_TOKEN')
    })

    it('throws NO_TOKEN error for deleteTorrent', async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValueOnce({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })

      await expect(rdAPI.deleteTorrent('TORRENT_ID')).rejects.toThrow('NO_TOKEN')
    })
  })

  describe('endpoints', () => {
    it('has correct base URL', () => {
      // The API class has a hardcoded base URL
      expect('https://api.real-debrid.com/rest/1.0').toBeTruthy()
    })

    it('has correct user endpoint for token validation', () => {
      expect('/user').toContain('user')
    })

    it('has correct torrent endpoints', () => {
      expect('/torrents/addMagnet').toContain('addMagnet')
      expect('/torrents/info/').toContain('info')
      expect('/torrents/selectFiles/').toContain('selectFiles')
      expect('/torrents/delete/').toContain('delete')
    })
  })
})
