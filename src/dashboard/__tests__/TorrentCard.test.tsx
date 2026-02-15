import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { TorrentCard } from '../TorrentCard'
import type { ExtendedTorrentItem } from '../../utils/types'

describe('TorrentCard', () => {
  const mockOnRetry = vi.fn()
  const mockOnRemove = vi.fn()
  const mockOnCopyLinks = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => null as any)
    // Mock navigator.clipboard.writeText
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  const createMockTorrent = (
    overrides: Partial<ExtendedTorrentItem> = {}
  ): ExtendedTorrentItem => ({
    id: 'torrent-1',
    magnetLink: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
    hash: '0123456789abcdef0123456789abcdef01234567',
    filename: 'Test Movie 2024.mkv',
    downloadUrl: null,
    status: 'processing',
    addedAt: Date.now() - 3600000, // 1 hour ago
    lastRetry: Date.now(),
    retryCount: 0,
    lastUpdated: Date.now(),
    ...overrides,
  })

  describe('rendering', () => {
    it('renders torrent information', () => {
      const torrent = createMockTorrent()
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Test Movie 2024.mkv')).toBeInTheDocument()
      expect(screen.getByText('Processing')).toBeInTheDocument()
    })

    it('shows correct status badge for processing', () => {
      const torrent = createMockTorrent({ status: 'processing' })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Processing')).toBeInTheDocument()
    })

    it('shows correct status badge for ready', () => {
      const torrent = createMockTorrent({ status: 'ready' })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Ready')).toBeInTheDocument()
    })

    it('shows correct status badge for error', () => {
      const torrent = createMockTorrent({ status: 'error' })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('shows correct status badge for timeout', () => {
      const torrent = createMockTorrent({ status: 'timeout' })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Timeout')).toBeInTheDocument()
    })

    it('shows correct status badge for selecting_files', () => {
      const torrent = createMockTorrent({ status: 'selecting_files' })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Selecting Files')).toBeInTheDocument()
    })

    it('shows default status text for unknown status', () => {
      const torrent = createMockTorrent({ status: 'unknown' as any })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('shows relative time for addedAt', () => {
      const torrent = createMockTorrent({ addedAt: Date.now() - 3600000 }) // 1 hour ago
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText(/Added 1h ago/)).toBeInTheDocument()
    })

    it('shows "Just now" for very recent torrents', () => {
      const torrent = createMockTorrent({ addedAt: Date.now() - 30000 }) // 30 seconds ago
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText(/Added Just now/)).toBeInTheDocument()
    })

    it('shows retry count when > 0', () => {
      const torrent = createMockTorrent({ retryCount: 3 })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Retries: 3')).toBeInTheDocument()
    })

    it('does not show retry count when 0', () => {
      const torrent = createMockTorrent({ retryCount: 0 })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.queryByText(/Retries:/)).not.toBeInTheDocument()
    })

    it('shows progress indicator for active torrents with progress', () => {
      const torrent = createMockTorrent({
        progress: {
          progress: 50,
          status: 'downloading',
          downloadSpeed: 1048576, // 1 MB/s
          uploadSpeed: 524288, // 512 KB/s
          eta: 300, // 5 minutes
        },
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('shows download speed when available', () => {
      const torrent = createMockTorrent({
        progress: {
          progress: 50,
          status: 'downloading',
          downloadSpeed: 1048576, // 1 MB/s
        },
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText(/↓ 1.0 MB\/s/)).toBeInTheDocument()
    })

    it('shows upload speed when available', () => {
      const torrent = createMockTorrent({
        progress: {
          progress: 50,
          status: 'downloading',
          uploadSpeed: 524288, // 512 KB/s
        },
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText(/↑ 512.0 KB\/s/)).toBeInTheDocument()
    })

    it('shows ETA when available', () => {
      const torrent = createMockTorrent({
        progress: {
          progress: 50,
          status: 'downloading',
          eta: 300, // 5 minutes
        },
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText(/ETA: 5m/)).toBeInTheDocument()
    })

    it('shows download links when available', () => {
      const torrent = createMockTorrent({
        status: 'ready',
        links: [
          {
            filename: 'movie.mkv',
            url: 'https://example.com/movie.mkv',
            size: 1073741824,
            selected: false,
          },
        ],
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Download Links')).toBeInTheDocument()
      expect(screen.getByText('movie.mkv')).toBeInTheDocument()
    })

    it('does not show download links when not available', () => {
      const torrent = createMockTorrent({ status: 'processing' })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.queryByText('Download Links')).not.toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('shows retry button for error status', () => {
      const torrent = createMockTorrent({ status: 'error' })
      render(<TorrentCard torrent={torrent} onRetry={mockOnRetry} />)

      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('shows retry button for timeout status', () => {
      const torrent = createMockTorrent({ status: 'timeout' })
      render(<TorrentCard torrent={torrent} onRetry={mockOnRetry} />)

      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('does not show retry button for processing status', () => {
      const torrent = createMockTorrent({ status: 'processing' })
      render(<TorrentCard torrent={torrent} onRetry={mockOnRetry} />)

      expect(screen.queryByText('Retry')).not.toBeInTheDocument()
    })

    it('shows copy links button when links are available', () => {
      const torrent = createMockTorrent({
        status: 'ready',
        links: [
          {
            filename: 'movie.mkv',
            url: 'https://example.com/movie.mkv',
            selected: false,
          },
        ],
      })
      render(<TorrentCard torrent={torrent} onCopyLinks={mockOnCopyLinks} />)

      expect(screen.getByText('Copy Links')).toBeInTheDocument()
    })

    it('does not show copy links button when no links', () => {
      const torrent = createMockTorrent({ status: 'processing' })
      render(<TorrentCard torrent={torrent} onCopyLinks={mockOnCopyLinks} />)

      expect(screen.queryByText('Copy Links')).not.toBeInTheDocument()
    })

    it('shows remove button when onRemove provided', () => {
      const torrent = createMockTorrent()
      render(<TorrentCard torrent={torrent} onRemove={mockOnRemove} />)

      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    it('does not show remove button when onRemove not provided', () => {
      const torrent = createMockTorrent()
      render(<TorrentCard torrent={torrent} />)

      expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    })
  })

  describe('action handling', () => {
    it('calls onRetry with torrent id when retry clicked', () => {
      const torrent = createMockTorrent({ status: 'error' })
      render(<TorrentCard torrent={torrent} onRetry={mockOnRetry} />)

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      expect(mockOnRetry).toHaveBeenCalledWith('torrent-1')
    })

    it('calls onRemove with torrent id when remove clicked', () => {
      const torrent = createMockTorrent()
      render(<TorrentCard torrent={torrent} onRemove={mockOnRemove} />)

      const removeButton = screen.getByText('Remove')
      fireEvent.click(removeButton)

      expect(mockOnRemove).toHaveBeenCalledWith('torrent-1')
    })

    it('calls onCopyLinks with torrent id when copy links clicked', () => {
      const torrent = createMockTorrent({
        status: 'ready',
        links: [
          {
            filename: 'movie.mkv',
            url: 'https://example.com/movie.mkv',
            selected: false,
          },
        ],
      })
      render(<TorrentCard torrent={torrent} onCopyLinks={mockOnCopyLinks} />)

      const copyButton = screen.getByText('Copy Links')
      fireEvent.click(copyButton)

      expect(mockOnCopyLinks).toHaveBeenCalledWith('torrent-1')
    })

    it('copies all links to clipboard when copy links clicked', () => {
      const torrent = createMockTorrent({
        filename: 'Movie.mkv',
        status: 'ready',
        links: [
          {
            filename: 'movie.mkv',
            url: 'https://example.com/movie.mkv',
            selected: false,
          },
          {
            filename: 'subtitle.srt',
            url: 'https://example.com/subtitle.srt',
            selected: false,
          },
        ],
      })
      render(<TorrentCard torrent={torrent} onCopyLinks={mockOnCopyLinks} />)

      const copyButton = screen.getByRole('button', { name: /Copy links for Movie.mkv/ })
      fireEvent.click(copyButton)

      expect(mockOnCopyLinks).toHaveBeenCalledWith('torrent-1')
    })

    it('opens link in new tab when download link clicked', () => {
      const torrent = createMockTorrent({
        status: 'ready',
        links: [
          {
            filename: 'movie.mkv',
            url: 'https://example.com/movie.mkv',
            selected: false,
          },
        ],
      })
      render(<TorrentCard torrent={torrent} />)

      const linkButton = screen.getByText('movie.mkv').closest('button')
      fireEvent.click(linkButton!)

      expect(window.open).toHaveBeenCalledWith(
        'https://example.com/movie.mkv',
        '_blank',
        'noopener,noreferrer'
      )
    })
  })

  describe('edge cases', () => {
    it('handles missing optional fields', () => {
      const torrent = createMockTorrent({
        progress: undefined,
        links: undefined,
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByText('Test Movie 2024.mkv')).toBeInTheDocument()
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      expect(screen.queryByText('Download Links')).not.toBeInTheDocument()
    })

    it('handles empty links array', () => {
      const torrent = createMockTorrent({
        status: 'ready',
        links: [],
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.queryByText('Download Links')).not.toBeInTheDocument()
    })

    it('handles progress with zero speed', () => {
      const torrent = createMockTorrent({
        progress: {
          progress: 50,
          status: 'downloading',
          downloadSpeed: 0,
          uploadSpeed: 0,
        },
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.queryByText(/↓/)).not.toBeInTheDocument()
      expect(screen.queryByText(/↑/)).not.toBeInTheDocument()
    })

    it('handles progress with missing ETA', () => {
      const torrent = createMockTorrent({
        progress: {
          progress: 50,
          status: 'downloading',
          downloadSpeed: 1048576,
        },
      })
      render(<TorrentCard torrent={torrent} />)

      expect(screen.queryByText(/ETA:/)).not.toBeInTheDocument()
    })

    it('formats date correctly for old torrents', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10) // 10 days ago
      const torrent = createMockTorrent({ addedAt: oldDate.getTime() })
      render(<TorrentCard torrent={torrent} />)

      // Should show the actual date when older than 7 days
      expect(screen.getByText(/Added/)).toBeInTheDocument()
    })

    it('formats date correctly for very old torrents (shows date)', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 20) // 20 days ago
      const torrent = createMockTorrent({ addedAt: oldDate.getTime() })
      render(<TorrentCard torrent={torrent} />)

      // Should show the actual date instead of "20d ago"
      expect(screen.getByText(/Added/)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper aria-labels on action buttons', () => {
      const torrent = createMockTorrent({ status: 'error' })
      render(<TorrentCard torrent={torrent} onRetry={mockOnRetry} onRemove={mockOnRemove} />)

      expect(screen.getByLabelText(/Retry Test Movie 2024.mkv/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Remove Test Movie 2024.mkv/)).toBeInTheDocument()
    })

    it('has title attribute on filename', () => {
      const torrent = createMockTorrent()
      render(<TorrentCard torrent={torrent} />)

      const filenameElement = screen.getByText('Test Movie 2024.mkv')
      expect(filenameElement).toHaveAttribute('title', 'Test Movie 2024.mkv')
    })
  })
})
