import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ConversionDashboard } from '../ConversionDashboard'
import { storage } from '../../utils/storage'

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
    },
    storage: {
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
}))

// Mock storage module
vi.mock('../../utils/storage', () => ({
  storage: {
    getCache: vi.fn(() => ({})),
    removeTorrent: vi.fn(),
    getDarkMode: vi.fn(() => Promise.resolve('auto')),
    setDarkMode: vi.fn(() => Promise.resolve()),
  },
}))

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

// Mock window.confirm
vi.spyOn(window, 'confirm').mockImplementation(() => true)

describe('ConversionDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset storage mock
    vi.mocked(storage.getCache).mockReturnValue({})

    // Reset matchMedia mock
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  describe('initial rendering', () => {
    it('renders dashboard header', () => {
      render(<ConversionDashboard />)

      expect(screen.getByText('Conversion Dashboard')).toBeInTheDocument()
    })

    it('renders empty state when no torrents', () => {
      render(<ConversionDashboard />)

      expect(screen.getByText('No torrents yet')).toBeInTheDocument()
      expect(
        screen.getByText('Paste a magnet link in the popup to start converting torrents.')
      ).toBeInTheDocument()
      expect(screen.getByText('No torrents yet')).toBeInTheDocument()
    })

    it('renders statistics in header', () => {
      render(<ConversionDashboard />)

      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getByText('Processing')).toBeInTheDocument()
      expect(screen.getByText('Ready')).toBeInTheDocument()
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('shows zero counts when no torrents', () => {
      render(<ConversionDashboard />)

      // All stats should show 0 when no torrents
      const zeroValues = screen.getAllByText('0')
      expect(zeroValues.length).toBeGreaterThan(0)
    })
  })

  describe('torrent list rendering', () => {
    it('renders torrent cards when torrents exist', async () => {
      // Mock storage cache with torrents
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Test Movie.mkv',
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Test Movie.mkv')).toBeInTheDocument()
      })
    })

    it('renders multiple torrent cards', async () => {
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Movie 1.mkv',
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
        {
          id: 'torrent-2',
          magnetLink: 'magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01',
          hash: 'abcdef0123456789abcdef0123456789abcdef01',
          filename: 'Movie 2.mkv',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          downloadUrl: 'https://example.com/movie2.mkv',
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Movie 1.mkv')).toBeInTheDocument()
        expect(screen.getByText('Movie 2.mkv')).toBeInTheDocument()
      })
    })

    it('shows correct statistics based on torrent status', async () => {
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing.mkv',
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
        {
          id: 'torrent-2',
          magnetLink: 'magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01',
          hash: 'abcdef0123456789abcdef0123456789abcdef01',
          filename: 'Ready.mkv',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          downloadUrl: 'https://example.com/ready.mkv',
        },
        {
          id: 'torrent-3',
          magnetLink: 'magnet:?xt=urn:btih:fedcba0987654321fedcba0987654321fedcba09',
          hash: 'fedcba0987654321fedcba0987654321fedcba09',
          filename: 'Error.mkv',
          status: 'error' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Total
      })
    })
  })

  describe('batch actions', () => {
    it('renders BatchControls component', async () => {
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Test.mkv',
          status: 'error' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Retry Failed')).toBeInTheDocument()
        expect(screen.getByText('Clear Completed')).toBeInTheDocument()
      })
    })

    it('sends RETRY_ALL_FAILED message when retry failed clicked', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Error.mkv',
          status: 'error' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
        {
          id: 'torrent-2',
          magnetLink: 'magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01',
          hash: 'abcdef0123456789abcdef0123456789abcdef01',
          filename: 'Timeout.mkv',
          status: 'timeout' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
        fireEvent.click(retryButton)
      })

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'RETRY_ALL_FAILED',
        torrentIds: ['torrent-1', 'torrent-2'],
      })
    })

    it('shows confirmation dialog when clearing completed', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Ready.mkv',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          downloadUrl: 'https://example.com/ready.mkv',
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
        fireEvent.click(clearButton)
      })

      expect(window.confirm).toHaveBeenCalledWith('Clear 1 completed torrent?')
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'CLEAR_COMPLETED',
      })
    })

    it('does not clear when confirmation dialog cancelled', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any

      vi.mocked(window.confirm).mockReturnValueOnce(false)

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Ready.mkv',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          downloadUrl: 'https://example.com/ready.mkv',
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
        fireEvent.click(clearButton)
      })

      expect(window.confirm).toHaveBeenCalledWith('Clear 1 completed torrent?')
      expect(browser.runtime.sendMessage).not.toHaveBeenCalled()
    })
  })

  describe('individual torrent actions', () => {
    it('sends RETRY_TORRENT message when retry clicked', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Error.mkv',
          status: 'error' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry Error.mkv/ })
        fireEvent.click(retryButton)
      })

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'RETRY_TORRENT',
        torrentId: 'torrent-1',
      })
    })

    it('removes torrent when remove clicked', async () => {
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Test.mkv',
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /Remove Test.mkv/ })
        fireEvent.click(removeButton)
      })

      expect(storage.removeTorrent).toHaveBeenCalledWith('torrent-1')
    })

    it('copies links to clipboard when copy links clicked', async () => {
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Movie.mkv',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          links: [
            {
              filename: 'movie.mkv',
              url: 'https://example.com/movie.mkv',
              size: 1073741824,
            },
            {
              filename: 'subtitle.srt',
              url: 'https://example.com/subtitle.srt',
              size: 102400,
            },
          ],
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /Copy links for Movie.mkv/ })
        fireEvent.click(copyButton)
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'movie.mkv: https://example.com/movie.mkv\nsubtitle.srt: https://example.com/subtitle.srt'
      )
    })

    it('does not copy links when torrent has no links', async () => {
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Processing.mkv',
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Copy links/ })).not.toBeInTheDocument()
      })

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
    })
  })

  describe('storage synchronization', () => {
    it('subscribes to storage changes', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any

      render(<ConversionDashboard />)

      expect(browser.storage.onChanged.addListener).toHaveBeenCalled()
    })

    it('updates when storage changes', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any

      render(<ConversionDashboard />)

      // Get the listener callback
      const addListenerCalls = browser.storage.onChanged.addListener.mock.calls
      const listenerCallback = addListenerCalls[0][0]

      // Simulate storage change with new torrents
      const newTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'New Movie.mkv',
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: newTorrents })

      await act(async () => {
        listenerCallback({ torrents: { newValue: newTorrents } }, 'local')
      })

      await waitFor(() => {
        expect(screen.getByText('New Movie.mkv')).toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('handles empty links array', async () => {
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Empty.mkv',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          links: [],
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Empty.mkv')).toBeInTheDocument()
        expect(screen.queryByText('Download Links')).not.toBeInTheDocument()
      })
    })

    it('handles missing optional fields', async () => {
      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Minimal.mkv',
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Minimal.mkv')).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('handles error when retrying torrent', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any
      browser.runtime.sendMessage.mockRejectedValueOnce(new Error('Retry error'))

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Error.mkv',
          status: 'error' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry Error.mkv/ })
        fireEvent.click(retryButton)
      })

      // Error should be logged but not throw
      expect(browser.runtime.sendMessage).toHaveBeenCalled()
    })

    it('handles error when removing torrent', async () => {
      vi.mocked(storage.removeTorrent).mockRejectedValueOnce(new Error('Remove error'))

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Test.mkv',
          status: 'processing' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /Remove Test.mkv/ })
        fireEvent.click(removeButton)
      })

      // Error should be logged but not throw
      expect(storage.removeTorrent).toHaveBeenCalledWith('torrent-1')
    })

    it('handles error when copying links', async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Copy error'))

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Movie.mkv',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          links: [
            {
              filename: 'movie.mkv',
              url: 'https://example.com/movie.mkv',
              size: 1073741824,
            },
          ],
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /Copy links for Movie.mkv/ })
        fireEvent.click(copyButton)
      })

      // Error should be logged but not throw
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    it('handles error when retrying all failed', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any
      browser.runtime.sendMessage.mockRejectedValueOnce(new Error('Batch retry error'))

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Error.mkv',
          status: 'error' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
        fireEvent.click(retryButton)
      })

      // Error should be logged but not throw
      expect(browser.runtime.sendMessage).toHaveBeenCalled()
    })

    it('handles error when clearing completed', async () => {
      const webextension = await import('webextension-polyfill')
      const browser = webextension.default as any
      browser.runtime.sendMessage.mockRejectedValueOnce(new Error('Clear error'))

      const mockTorrents = [
        {
          id: 'torrent-1',
          magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
          hash: '0123456789abcdef0123456789abcdef01234567',
          filename: 'Ready.mkv',
          status: 'ready' as const,
          addedAt: Date.now(),
          lastRetry: Date.now(),
          retryCount: 0,
          downloadUrl: 'https://example.com/ready.mkv',
        },
      ]

      vi.mocked(storage.getCache).mockReturnValue({ torrents: mockTorrents })

      render(<ConversionDashboard />)

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
        fireEvent.click(clearButton)
      })

      // Error should be logged but not throw
      expect(browser.runtime.sendMessage).toHaveBeenCalled()
    })
  })
})
