import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => {
  const mockAlarms = {
    create: vi.fn(),
    get: vi.fn(() => Promise.resolve(null)),
    onAlarm: {
      addListener: vi.fn(),
    },
  }

  const mockRuntime = {
    sendMessage: vi.fn(() => Promise.resolve()),
    onInstalled: {
      addListener: vi.fn(),
    },
    onMessage: {
      addListener: vi.fn(),
    },
  }

  const mockStorage = {
    sync: {
      get: vi.fn(() =>
        Promise.resolve({
          apiToken: 'test-token',
          maxListSize: 10,
          retryInterval: 30,
          maxRetryDuration: 300,
          contextMenuEnabled: false,
          alwaysSaveAllFiles: false,
        })
      ),
      set: vi.fn(() => Promise.resolve()),
    },
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  }

  return {
    default: {
      alarms: mockAlarms,
      runtime: mockRuntime,
      storage: mockStorage,
    },
    get mockAlarms() {
      return mockAlarms
    },
    get mockRuntime() {
      return mockRuntime
    },
    get mockStorage() {
      return mockStorage
    },
  }
})

// Mock realdebrid-api
vi.mock('../../utils/realdebrid-api', () => ({
  rdAPI: {
    getTorrents: vi.fn(() => Promise.resolve([])),
    addMagnet: vi.fn(() => Promise.resolve({ id: 'test-id' })),
    getTorrentInfo: vi.fn(() =>
      Promise.resolve({
        id: 'test-id',
        filename: 'Test Torrent',
        status: 'downloaded',
        progress: 100,
        links: [{ url: 'https://example.com/file.mkv' }],
      })
    ),
    unrestrictLink: vi.fn(() =>
      Promise.resolve({ download: 'https://example.com/unrestricted.mkv' })
    ),
    selectFiles: vi.fn(() => Promise.resolve()),
  },
}))

// Mock context-menu
vi.mock('../context-menu', () => ({
  syncContextMenu: vi.fn(() => Promise.resolve()),
  initContextMenuListener: vi.fn(),
}))

// Mock notifications
vi.mock('../../utils/notifications', () => ({
  notifyTorrentStatusChange: vi.fn(() => Promise.resolve()),
  showBatchCompleteNotification: vi.fn(() => Promise.resolve()),
  clearCompletedNotifications: vi.fn(() => Promise.resolve()),
}))

describe('service-worker', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    const webextension = await import('webextension-polyfill')
    const { mockStorage, mockRuntime } = webextension as any

    // Reset storage mocks
    mockStorage.sync.get.mockResolvedValue({
      apiToken: 'test-token',
      maxListSize: 10,
      retryInterval: 30,
      maxRetryDuration: 300,
      contextMenuEnabled: false,
      alwaysSaveAllFiles: false,
    })
    mockStorage.local.get.mockResolvedValue({})
    mockStorage.local.set.mockResolvedValue(undefined)
    mockStorage.sync.set.mockResolvedValue(undefined)

    // Reset runtime mocks
    mockRuntime.sendMessage.mockResolvedValue(undefined)
  })

  describe('message handlers', () => {
    it('handles RETRY_FAILED message', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockRuntime } = webextension as any

      // Mock existing torrents
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Error.mkv',
          status: 'error',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
        {
          id: 'torrent-2',
          magnetLink: 'magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01',
          hash: 'abcdef0123456789abcdef0123456789abcdef01',
          filename: 'Timeout.mkv',
          status: 'timeout',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 1,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      // Import service worker to register handlers
      await import('../service-worker')

      // Get the message listener
      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      // Send RETRY_FAILED message
      const result = await messageHandler({ type: 'RETRY_FAILED' })

      expect(result).toEqual({ success: true, retried: 2 })
      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({ id: 'torrent-1', status: 'processing', retryCount: 1 }),
          expect.objectContaining({ id: 'torrent-2', status: 'processing', retryCount: 2 }),
        ]),
      })
    })

    it('handles RETRY_FAILED with no failed torrents', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockRuntime } = webextension as any

      // Mock no failed torrents
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing.mkv',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'RETRY_FAILED' })

      expect(result).toEqual({ success: true, retried: 0 })
      expect(mockStorage.local.set).not.toHaveBeenCalled()
    })

    it('handles CLEAR_COMPLETED message', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockRuntime } = webextension as any

      const { clearCompletedNotifications } = await import('../../utils/notifications')

      // Mock torrents with completed ones
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Ready.mkv',
          status: 'ready',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          downloadUrl: 'https://example.com/ready.mkv',
        },
        {
          id: 'torrent-2',
          magnetLink: 'magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01',
          hash: 'abcdef0123456789abcdef0123456789abcdef01',
          filename: 'Processing.mkv',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'CLEAR_COMPLETED' })

      expect(result).toEqual({ success: true, cleared: 1 })
      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({ id: 'torrent-2', status: 'processing' }),
        ]),
      })
      expect(clearCompletedNotifications).toHaveBeenCalledWith(['torrent-1'])
    })

    it('handles CLEAR_COMPLETED with no completed torrents', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockRuntime } = webextension as any

      // Mock no completed torrents
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing.mkv',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'CLEAR_COMPLETED' })

      expect(result).toEqual({ success: true, cleared: 0 })
      expect(mockStorage.local.set).not.toHaveBeenCalled()
    })

    it('handles GET_TORRENT_PROGRESS message', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      // Mock torrent info
      const mockTorrentInfo = {
        id: 'torrent-1',
        filename: 'Test.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'downloading' as const,
        progress: 50,
        downloadSpeed: 1048576,
        uploadSpeed: 524288,
        eta: 300,
      }

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue(mockTorrentInfo)

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'GET_TORRENT_PROGRESS', torrentId: 'torrent-1' })

      expect(result).toEqual({
        success: true,
        progress: 50,
        status: 'downloading',
      })
      expect(rdAPI.getTorrentInfo).toHaveBeenCalledWith('torrent-1')
    })

    it('handles GET_TORRENT_PROGRESS with error', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      vi.mocked(rdAPI.getTorrentInfo).mockRejectedValue(new Error('API Error'))

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'GET_TORRENT_PROGRESS', torrentId: 'torrent-1' })

      expect(result).toEqual({
        success: false,
        error: 'API Error',
      })
    })

    it('handles NOTIFICATION_PERMISSION_REQUEST message', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime } = webextension as any

      // Mock Notification.requestPermission
      const mockRequestPermission = vi.fn().mockResolvedValue('granted')
      Object.defineProperty(global, 'Notification', {
        writable: true,
        value: {
          requestPermission: mockRequestPermission,
        },
      })

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'NOTIFICATION_PERMISSION_REQUEST' })

      expect(result).toEqual({ success: true, granted: true })
      expect(mockRequestPermission).toHaveBeenCalled()
    })

    it('handles NOTIFICATION_PERMISSION_REQUEST with denial', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime } = webextension as any

      const mockRequestPermission = vi.fn().mockResolvedValue('denied')
      Object.defineProperty(global, 'Notification', {
        writable: true,
        value: {
          requestPermission: mockRequestPermission,
        },
      })

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'NOTIFICATION_PERMISSION_REQUEST' })

      expect(result).toEqual({ success: true, granted: false })
      expect(mockRequestPermission).toHaveBeenCalled()
    })

    it('handles NOTIFICATION_PERMISSION_REQUEST with error', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime } = webextension as any

      const mockRequestPermission = vi.fn().mockRejectedValue(new Error('Permission error'))
      Object.defineProperty(global, 'Notification', {
        writable: true,
        value: {
          requestPermission: mockRequestPermission,
        },
      })

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'NOTIFICATION_PERMISSION_REQUEST' })

      expect(result).toEqual({
        success: false,
        error: 'Permission error',
      })
    })
  })

  describe('notification integration in polling', () => {
    it('sends notifications when torrents complete during polling', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { notifyTorrentStatusChange, showBatchCompleteNotification } =
        await import('../../utils/notifications')
      const { rdAPI } = await import('../../utils/realdebrid-api')

      // Mock torrents that will complete
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Movie1.mkv',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
        {
          id: 'torrent-2',
          magnetLink: 'magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01',
          hash: 'abcdef0123456789abcdef0123456789abcdef01',
          filename: 'Movie2.mkv',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      // Mock torrent info to show completion
      vi.mocked(rdAPI.getTorrentInfo).mockImplementation((id: string) => {
        if (id === 'torrent-1') {
          return Promise.resolve({
            id: 'torrent-1',
            filename: 'Movie1.mkv',
            hash: '0123456789abcdef0123456789abcdef01234567',
            status: 'downloaded' as const,
            progress: 100,
            links: ['https://example.com/movie1.mkv'],
          })
        } else if (id === 'torrent-2') {
          return Promise.resolve({
            id: 'torrent-2',
            filename: 'Movie2.mkv',
            hash: 'abcdef0123456789abcdef0123456789abcdef01',
            status: 'downloaded' as const,
            progress: 100,
            links: ['https://example.com/movie2.mkv'],
          })
        }
        return Promise.reject(new Error('Unknown torrent'))
      })

      vi.mocked(rdAPI.unrestrictLink).mockResolvedValue({
        id: 'unrestrict-1',
        filename: 'unrestricted.mkv',
        filesize: 1073741824,
        link: 'https://example.com/link.mkv',
        host: 'example.com',
        chunks: 1,
        crc: 0,
        download: 'https://example.com/unrestricted.mkv',
        streamable: 0,
      })

      await import('../service-worker')

      // Get the alarm listener
      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      // Trigger alarm
      await alarmHandler({ name: 'poll-torrents' })

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(notifyTorrentStatusChange).toHaveBeenCalledTimes(2)
      expect(showBatchCompleteNotification).toHaveBeenCalledWith(2, 0)
    })

    it('sends notifications when torrents fail during polling', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { notifyTorrentStatusChange, showBatchCompleteNotification } =
        await import('../../utils/notifications')
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Failed1.mkv',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
        {
          id: 'torrent-2',
          magnetLink: 'magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01',
          hash: 'abcdef0123456789abcdef0123456789abcdef01',
          filename: 'Failed2.mkv',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      // Mock torrent info to show errors
      vi.mocked(rdAPI.getTorrentInfo).mockImplementation((id: string) => {
        if (id === 'torrent-1') {
          return Promise.resolve({
            id: 'torrent-1',
            filename: 'Failed1.mkv',
            hash: '0123456789abcdef0123456789abcdef01234567',
            status: 'error' as const,
            progress: 0,
          })
        } else if (id === 'torrent-2') {
          return Promise.resolve({
            id: 'torrent-2',
            filename: 'Failed2.mkv',
            hash: 'abcdef0123456789abcdef0123456789abcdef01',
            status: 'error' as const,
            progress: 0,
          })
        }
        return Promise.reject(new Error('Unknown torrent'))
      })

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(notifyTorrentStatusChange).toHaveBeenCalledTimes(2)
      expect(showBatchCompleteNotification).toHaveBeenCalledWith(0, 2)
    })
  })

  describe('existing message handlers', () => {
    it('handles ADD_MAGNET message', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime, mockStorage } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      mockStorage.local.get.mockResolvedValue({ torrents: [] })
      vi.mocked(rdAPI.addMagnet).mockResolvedValue({
        id: 'new-torrent-id',
        uri: 'https://real-debrid.com/torrent/new-torrent-id',
      })

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({
        type: 'ADD_MAGNET',
        magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
      })

      expect(result).toHaveProperty('success', true)
      expect(rdAPI.addMagnet).toHaveBeenCalledWith(
        'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567'
      )
    })

    it('handles RETRY_TORRENT message', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime, mockStorage } = webextension as any

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Error.mkv',
          status: 'error',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'RETRY_TORRENT', torrentId: 'torrent-1' })

      expect(result).toEqual({ success: true })
      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({ id: 'torrent-1', status: 'processing', retryCount: 1 }),
        ]),
      })
    })

    it('handles SELECT_FILES message', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime, mockStorage } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Test.mkv',
          status: 'selecting_files',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({
        type: 'SELECT_FILES',
        torrentId: 'torrent-1',
        selectedFiles: 'all',
      })

      expect(result).toEqual({ success: true })
      expect(rdAPI.selectFiles).toHaveBeenCalledWith('torrent-1', 'all')
    })

    it('handles GET_TORRENT_INFO message', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrentInfo = {
        id: 'torrent-1',
        filename: 'Test.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'waiting_files_selection' as const,
        progress: 100,
        files: [
          { id: 1, path: 'file1.mkv', bytes: 1073741824, selected: 0 },
          { id: 2, path: 'file2.srt', bytes: 102400, selected: 0 },
        ],
      }

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue(mockTorrentInfo)

      await import('../service-worker')

      const addListenerCalls = mockRuntime.onMessage.addListener.mock.calls
      const messageHandler = addListenerCalls[addListenerCalls.length - 1][0]

      const result = await messageHandler({ type: 'GET_TORRENT_INFO', torrentId: 'torrent-1' })

      expect(result).toEqual({ success: true, info: mockTorrentInfo })
      expect(rdAPI.getTorrentInfo).toHaveBeenCalledWith('torrent-1')
    })
  })

  describe('polling branches', () => {
    it('handles timeout during polling', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { notifyTorrentStatusChange } = await import('../../utils/notifications')

      // Mock torrent that will timeout
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Timeout.mkv',
          status: 'processing',
          addedAt: Date.now() - 400000, // Added more than 300 seconds ago
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(notifyTorrentStatusChange).toHaveBeenCalledWith('torrent-1', 'Timeout.mkv', 'timeout')
    })

    it('handles waiting_files_selection status without auto-select', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue({
        id: 'torrent-1',
        filename: 'Select Files.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'waiting_files_selection' as const,
        progress: 0,
      })

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({
            id: 'torrent-1',
            status: 'selecting_files',
            filename: 'Select Files.mkv',
          }),
        ]),
      })
    })

    it('handles waiting_files_selection status with auto-select', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      // Enable auto-select in settings
      mockStorage.sync.get.mockResolvedValue({
        apiToken: 'test-token',
        maxListSize: 10,
        retryInterval: 30,
        maxRetryDuration: 300,
        contextMenuEnabled: false,
        alwaysSaveAllFiles: true,
      })

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue({
        id: 'torrent-1',
        filename: 'Auto Select.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'waiting_files_selection' as const,
        progress: 0,
      })

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(rdAPI.selectFiles).toHaveBeenCalledWith('torrent-1', 'all')
    })

    it('handles downloaded status without links', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue({
        id: 'torrent-1',
        filename: 'No Links.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'downloaded' as const,
        progress: 100,
        links: [],
      })

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({
            id: 'torrent-1',
            status: 'ready',
            downloadUrl: null,
          }),
        ]),
      })
    })

    it('handles error status during polling', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue({
        id: 'torrent-1',
        filename: 'Error.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'error' as const,
        progress: 0,
      })

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({
            id: 'torrent-1',
            status: 'error',
          }),
        ]),
      })
    })

    it('handles dead status during polling', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue({
        id: 'torrent-1',
        filename: 'Dead.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'dead' as const,
        progress: 0,
      })

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({
            id: 'torrent-1',
            status: 'error',
          }),
        ]),
      })
    })

    it('updates filename when available during polling', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue({
        id: 'torrent-1',
        filename: 'Updated Filename.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'downloading' as const,
        progress: 50,
      })

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({
            id: 'torrent-1',
            filename: 'Updated Filename.mkv',
          }),
        ]),
      })
    })

    it('handles polling error gracefully', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockRejectedValue(new Error('Polling error'))

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      // Should not throw
      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('updates hash from API when missing', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: undefined as any,
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue({
        id: 'torrent-1',
        hash: '0123456789abcdef0123456789abcdef01234567',
        filename: 'Updated.mkv',
        status: 'downloading' as const,
        progress: 50,
      })

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({
            id: 'torrent-1',
            hash: '0123456789abcdef0123456789abcdef01234567',
          }),
        ]),
      })
    })

    it('handles unrestrictLink error during polling', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockStorage, mockAlarms } = webextension as any
      const { rdAPI } = await import('../../utils/realdebrid-api')

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing...',
          status: 'processing',
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      mockStorage.local.get.mockResolvedValue({ torrents: mockTorrents })
      mockStorage.local.set.mockResolvedValue(undefined)

      vi.mocked(rdAPI.getTorrentInfo).mockResolvedValue({
        id: 'torrent-1',
        filename: 'Downloaded.mkv',
        hash: '0123456789abcdef0123456789abcdef01234567',
        status: 'downloaded' as const,
        progress: 100,
        links: ['https://example.com/file.mkv'],
      })

      vi.mocked(rdAPI.unrestrictLink).mockRejectedValue(new Error('Unrestrict error'))

      await import('../service-worker')

      const addListenerCalls = mockAlarms.onAlarm.addListener.mock.calls
      const alarmHandler = addListenerCalls[addListenerCalls.length - 1][0]

      await alarmHandler({ name: 'poll-torrents' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        torrents: expect.arrayContaining([
          expect.objectContaining({
            id: 'torrent-1',
            status: 'ready',
            downloadUrl: null,
          }),
        ]),
      })
    })
  })
})
