import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DownloadLinks } from '../DownloadLinks'
import type { DownloadLink } from '../../utils/types'

describe('DownloadLinks', () => {
  const mockLinks: DownloadLink[] = [
    {
      filename: 'movie.mkv',
      url: 'https://example.com/movie.mkv',
      size: 1073741824, // 1 GB
      selected: false,
    },
    {
      filename: 'subtitle.srt',
      url: 'https://example.com/subtitle.srt',
      size: 102400, // 100 KB
      selected: false,
    },
    {
      filename: 'poster.jpg',
      url: 'https://example.com/poster.jpg',
      size: 524288, // 512 KB
      selected: false,
    },
  ]

  const mockOnLinkClick = vi.fn()
  const mockOnCopyLink = vi.fn()

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

  describe('rendering', () => {
    it('renders list of links', () => {
      render(<DownloadLinks links={mockLinks} />)

      expect(screen.getByText('movie.mkv')).toBeInTheDocument()
      expect(screen.getByText('subtitle.srt')).toBeInTheDocument()
      expect(screen.getByText('poster.jpg')).toBeInTheDocument()
    })

    it('shows download links header', () => {
      render(<DownloadLinks links={mockLinks} />)

      expect(screen.getByText('Download Links')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows file sizes correctly', () => {
      render(<DownloadLinks links={mockLinks} />)

      expect(screen.getByText('1.0 GB')).toBeInTheDocument()
      expect(screen.getByText('100.0 KB')).toBeInTheDocument()
      expect(screen.getByText('512.0 KB')).toBeInTheDocument()
    })

    it('renders null when links array is empty', () => {
      const { container } = render(<DownloadLinks links={[]} />)

      expect(container.firstChild).toBeNull()
    })

    it('renders null when links is undefined', () => {
      const { container } = render(<DownloadLinks links={undefined as any} />)

      expect(container.firstChild).toBeNull()
    })

    it('shows link count in header', () => {
      render(<DownloadLinks links={mockLinks} />)

      const countElement = screen.getByText('3')
      expect(countElement).toBeInTheDocument()
      expect(countElement).toHaveClass('download-links-count')
    })

    it('shows copy button for each link', () => {
      render(<DownloadLinks links={mockLinks} />)

      expect(screen.getByLabelText('Copy movie.mkv')).toBeInTheDocument()
      expect(screen.getByLabelText('Copy subtitle.srt')).toBeInTheDocument()
      expect(screen.getByLabelText('Copy poster.jpg')).toBeInTheDocument()
    })
  })

  describe('link click handling', () => {
    it('calls onLinkClick when provided', () => {
      render(<DownloadLinks links={mockLinks} onLinkClick={mockOnLinkClick} />)

      const firstLink = screen.getByText('movie.mkv').closest('.download-link-button')
      fireEvent.click(firstLink!)

      expect(mockOnLinkClick).toHaveBeenCalledWith(mockLinks[0])
    })

    it('opens link in new tab when onLinkClick is not provided', () => {
      render(<DownloadLinks links={mockLinks} />)

      const firstLink = screen.getByText('movie.mkv').closest('.download-link-button')
      fireEvent.click(firstLink!)

      expect(window.open).toHaveBeenCalledWith(mockLinks[0].url, '_blank', 'noopener,noreferrer')
    })

    it('shows selection state after click', () => {
      render(<DownloadLinks links={mockLinks} />)

      const firstLink = screen.getByText('movie.mkv').closest('.download-link-button')
      fireEvent.click(firstLink!)

      expect(firstLink).toHaveClass('download-link-button-selected')
    })

    it('updates selection state when different link clicked', () => {
      render(<DownloadLinks links={mockLinks} />)

      const firstLink = screen.getByText('movie.mkv').closest('.download-link-button')
      const secondLink = screen.getByText('subtitle.srt').closest('.download-link-button')

      fireEvent.click(firstLink!)
      expect(firstLink).toHaveClass('download-link-button-selected')

      fireEvent.click(secondLink!)
      expect(firstLink).not.toHaveClass('download-link-button-selected')
      expect(secondLink).toHaveClass('download-link-button-selected')
    })
  })

  describe('copy link handling', () => {
    it('copies link to clipboard when copy button clicked', () => {
      render(<DownloadLinks links={mockLinks} onCopyLink={mockOnCopyLink} />)

      const copyButton = screen.getByLabelText('Copy movie.mkv')
      fireEvent.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockLinks[0].url)
    })

    it('calls onCopyClick callback when provided', () => {
      render(<DownloadLinks links={mockLinks} onCopyLink={mockOnCopyLink} />)

      const copyButton = screen.getByLabelText('Copy movie.mkv')
      fireEvent.click(copyButton)

      expect(mockOnCopyLink).toHaveBeenCalledWith(mockLinks[0])
    })

    it('does not trigger link click when copy button clicked', () => {
      const onLinkClick = vi.fn()
      render(
        <DownloadLinks links={mockLinks} onLinkClick={onLinkClick} onCopyLink={mockOnCopyLink} />
      )

      const copyButton = screen.getByLabelText('Copy movie.mkv')
      fireEvent.click(copyButton)

      expect(onLinkClick).not.toHaveBeenCalled()
    })
  })

  describe('filename truncation', () => {
    it('does not truncate short filenames', () => {
      render(<DownloadLinks links={mockLinks} />)

      expect(screen.getByText('movie.mkv')).toBeInTheDocument()
    })

    it('truncates long filenames', () => {
      const longNameLink: DownloadLink = {
        filename:
          'this-is-a-very-long-filename-that-exceeds-the-maximum-length-and-should-be-truncated.mkv',
        url: 'https://example.com/file.mkv',
        selected: false,
      }

      render(<DownloadLinks links={[longNameLink]} />)

      const truncatedText = screen.getAllByText((_content: string, element: Element | null) => {
        return element?.textContent?.includes('...') && element?.textContent?.includes('.mkv')
          ? true
          : false
      })
      expect(truncatedText.length).toBeGreaterThan(0)
    })

    it('preserves file extension when truncating', () => {
      const longNameLink: DownloadLink = {
        filename: 'very-long-filename-here.txt',
        url: 'https://example.com/file.txt',
        selected: false,
      }

      render(<DownloadLinks links={[longNameLink]} />)

      const textElements = screen.getAllByText((_content: string, element: Element | null) => {
        return element?.textContent?.endsWith('.txt') ? true : false
      })
      expect(textElements.length).toBeGreaterThan(0)
    })
  })

  describe('file size formatting', () => {
    it('formats bytes correctly', () => {
      const link: DownloadLink = {
        filename: 'file.txt',
        url: 'https://example.com/file.txt',
        size: 512,
        selected: false,
      }

      render(<DownloadLinks links={[link]} />)

      expect(screen.getByText('512.0 B')).toBeInTheDocument()
    })

    it('formats kilobytes correctly', () => {
      const link: DownloadLink = {
        filename: 'file.txt',
        url: 'https://example.com/file.txt',
        size: 1536, // 1.5 KB
        selected: false,
      }

      render(<DownloadLinks links={[link]} />)

      expect(screen.getByText('1.5 KB')).toBeInTheDocument()
    })

    it('formats megabytes correctly', () => {
      const link: DownloadLink = {
        filename: 'file.txt',
        url: 'https://example.com/file.txt',
        size: 1572864, // 1.5 MB
        selected: false,
      }

      render(<DownloadLinks links={[link]} />)

      expect(screen.getByText('1.5 MB')).toBeInTheDocument()
    })

    it('formats gigabytes correctly', () => {
      const link: DownloadLink = {
        filename: 'file.txt',
        url: 'https://example.com/file.txt',
        size: 1610612736, // 1.5 GB
        selected: false,
      }

      render(<DownloadLinks links={[link]} />)

      expect(screen.getByText('1.5 GB')).toBeInTheDocument()
    })

    it('formats terabytes correctly', () => {
      const link: DownloadLink = {
        filename: 'file.txt',
        url: 'https://example.com/file.txt',
        size: 1649267441664, // 1.5 TB
        selected: false,
      }

      render(<DownloadLinks links={[link]} />)

      expect(screen.getByText('1.5 TB')).toBeInTheDocument()
    })

    it('handles missing size', () => {
      const link: DownloadLink = {
        filename: 'file.txt',
        url: 'https://example.com/file.txt',
        selected: false,
      }

      render(<DownloadLinks links={[link]} />)

      // Should not show size when it's missing
      const sizeElements = screen.queryByText(/\d+\.\d+\s+[BKMGT]B/)
      expect(sizeElements).not.toBeInTheDocument()
    })

    it('handles zero size', () => {
      const link: DownloadLink = {
        filename: 'file.txt',
        url: 'https://example.com/file.txt',
        size: 0,
        selected: false,
      }

      render(<DownloadLinks links={[link]} />)

      // Should not show size when it's 0 (falsy)
      const sizeElements = screen.queryByText(/0\.0 B/)
      expect(sizeElements).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper title attribute on link buttons', () => {
      render(<DownloadLinks links={mockLinks} />)

      const linkButton = screen.getByText('movie.mkv').closest('.download-link-button')
      expect(linkButton).toHaveAttribute('title', 'movie.mkv')
    })

    it('has proper aria-label on copy buttons', () => {
      render(<DownloadLinks links={mockLinks} onCopyLink={mockOnCopyLink} />)

      expect(screen.getByLabelText('Copy movie.mkv')).toBeInTheDocument()
    })
  })
})
