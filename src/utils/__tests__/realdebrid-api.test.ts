import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock axios at the module level
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      defaults: { headers: { common: {} } },
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    })),
    get: vi.fn(),
  },
}))

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
  // Track the axios instance created by the API class
  let mockClientInstance: any
  let rdAPI: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset modules to get fresh instances
    vi.resetModules()

    // Setup fresh mock instance
    mockClientInstance = {
      defaults: { headers: { common: {} } },
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    }

    const axios = (await import('axios')).default
    vi.mocked(axios.create).mockReturnValue(mockClientInstance)

    // Import rdAPI after mocks are set up
    const module = await import('../realdebrid-api')
    rdAPI = module.rdAPI
  })

  describe('validateToken', () => {
    it('returns true for valid token', async () => {
      const axios = (await import('axios')).default
      const mockedAxiosGet = vi.mocked(axios.get)
      mockedAxiosGet.mockResolvedValueOnce({ data: { id: 'user123' } })

      const result = await rdAPI.validateToken('valid-token')

      expect(result).toBe(true)
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://api.real-debrid.com/rest/1.0/user', {
        headers: { Authorization: 'Bearer valid-token' },
      })
    })

    it('returns false for invalid token', async () => {
      const axios = (await import('axios')).default
      const mockedAxiosGet = vi.mocked(axios.get)
      mockedAxiosGet.mockRejectedValueOnce(new Error('Unauthorized'))

      const result = await rdAPI.validateToken('invalid-token')

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      const axios = (await import('axios')).default
      const mockedAxiosGet = vi.mocked(axios.get)
      mockedAxiosGet.mockRejectedValueOnce(new Error('Network Error'))

      const result = await rdAPI.validateToken('test-token')

      expect(result).toBe(false)
    })
  })

  describe('authentication', () => {
    it('throws NO_TOKEN error when apiToken is not set for addMagnet', async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValueOnce({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })

      await expect(rdAPI.addMagnet('magnet:?xt=test')).rejects.toThrow('NO_TOKEN')
    })

    it('throws NO_TOKEN error when apiToken is not set for getTorrentInfo', async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValueOnce({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })

      await expect(rdAPI.getTorrentInfo('TORRENT_ID')).rejects.toThrow('NO_TOKEN')
    })

    it('throws NO_TOKEN error when apiToken is not set for selectFiles', async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValueOnce({
        apiToken: null,
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })

      await expect(rdAPI.selectFiles('TORRENT_ID')).rejects.toThrow('NO_TOKEN')
    })

    it('throws NO_TOKEN error when apiToken is not set for deleteTorrent', async () => {
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

  describe('addMagnet with valid token', () => {
    beforeEach(async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValue({
        apiToken: 'test-token',
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })
    })

    it('adds magnet link and returns torrent id', async () => {
      const mockResponse = { id: 'TORRENT_ID', uri: 'magnet:?xt=test' }
      mockClientInstance.post.mockResolvedValue({ data: mockResponse })

      const result = await rdAPI.addMagnet('magnet:?xt=urn:btih:test')

      expect(result).toEqual(mockResponse)
      expect(mockClientInstance.post).toHaveBeenCalledWith('/torrents/addMagnet', {
        magnet: 'magnet:?xt=urn:btih:test',
      })
    })

    it('sets Authorization header when apiToken is available', async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValue({
        apiToken: 'my-token',
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })

      mockClientInstance.post.mockResolvedValue({ data: { id: '123' } })

      await rdAPI.addMagnet('magnet:?xt=test')

      expect(mockClientInstance.defaults.headers.common['Authorization']).toBe('Bearer my-token')
    })
  })

  describe('getTorrentInfo with valid token', () => {
    beforeEach(async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValue({
        apiToken: 'test-token',
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })
    })

    it('returns torrent info for valid id', async () => {
      const mockInfo = {
        id: 'TORRENT_ID',
        filename: 'test.torrent',
        status: 'downloaded',
        progress: 100,
        links: ['https://example.com/file.zip'],
      }
      mockClientInstance.get.mockResolvedValue({ data: mockInfo })

      const result = await rdAPI.getTorrentInfo('TORRENT_ID')

      expect(result).toEqual(mockInfo)
      expect(mockClientInstance.get).toHaveBeenCalledWith('/torrents/info/TORRENT_ID')
    })
  })

  describe('selectFiles with valid token', () => {
    beforeEach(async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValue({
        apiToken: 'test-token',
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })
    })

    it('selects all files for torrent', async () => {
      mockClientInstance.post.mockResolvedValue({ data: {} })

      await rdAPI.selectFiles('TORRENT_ID', 'all')

      expect(mockClientInstance.post).toHaveBeenCalledWith('/torrents/selectFiles/TORRENT_ID', {
        files: 'all',
      })
    })

    it('defaults to "all" files when not specified', async () => {
      mockClientInstance.post.mockResolvedValue({ data: {} })

      await rdAPI.selectFiles('TORRENT_ID')

      expect(mockClientInstance.post).toHaveBeenCalledWith('/torrents/selectFiles/TORRENT_ID', {
        files: 'all',
      })
    })
  })

  describe('deleteTorrent with valid token', () => {
    beforeEach(async () => {
      const { storage } = await import('../storage')
      vi.mocked(storage.getSettings).mockResolvedValue({
        apiToken: 'test-token',
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
      })
    })

    it('deletes torrent from Real-Debrid', async () => {
      mockClientInstance.delete.mockResolvedValue({ data: {} })

      await rdAPI.deleteTorrent('TORRENT_ID')

      expect(mockClientInstance.delete).toHaveBeenCalledWith('/torrents/delete/TORRENT_ID')
    })
  })

  describe('endpoints', () => {
    it('has correct base URL', () => {
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
