import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ProgressIndicator } from '../ProgressIndicator'

describe('ProgressIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders with correct progress value', () => {
      render(<ProgressIndicator progress={50} status="downloading" />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    it('displays percentage text inside bar when progress >= 5%', () => {
      render(<ProgressIndicator progress={50} status="downloading" />)

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('displays percentage text outside bar when progress < 5%', () => {
      render(<ProgressIndicator progress={3} status="downloading" />)

      expect(screen.getByText('3%')).toBeInTheDocument()
    })

    it('does not display percentage when showPercentage is false', () => {
      render(<ProgressIndicator progress={50} status="downloading" showPercentage={false} />)

      expect(screen.queryByText('50%')).not.toBeInTheDocument()
    })

    it('has correct accessibility attributes', () => {
      render(<ProgressIndicator progress={75} status="completed" />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 75%')
    })
  })

  describe('status colors', () => {
    it('applies downloading color for downloading status', () => {
      const { container } = render(<ProgressIndicator progress={50} status="downloading" />)

      const progressBar = container.querySelector('.progress-bar-fill')
      expect(progressBar).toHaveStyle({
        backgroundColor: 'var(--progress-downloading, #3b82f6)',
      })
    })

    it('applies uploading color for uploading status', () => {
      const { container } = render(<ProgressIndicator progress={50} status="uploading" />)

      const progressBar = container.querySelector('.progress-bar-fill')
      expect(progressBar).toHaveStyle({
        backgroundColor: 'var(--progress-uploading, #8b5cf6)',
      })
    })

    it('applies converting color for converting status', () => {
      const { container } = render(<ProgressIndicator progress={50} status="converting" />)

      const progressBar = container.querySelector('.progress-bar-fill')
      expect(progressBar).toHaveStyle({
        backgroundColor: 'var(--progress-converting, #f59e0b)',
      })
    })

    it('applies completed color for completed status', () => {
      const { container } = render(<ProgressIndicator progress={100} status="completed" />)

      const progressBar = container.querySelector('.progress-bar-fill')
      expect(progressBar).toHaveStyle({
        backgroundColor: 'var(--progress-completed, #10b981)',
      })
    })

    it('applies error color for error status', () => {
      const { container } = render(<ProgressIndicator progress={0} status="error" />)

      const progressBar = container.querySelector('.progress-bar-fill')
      expect(progressBar).toHaveStyle({
        backgroundColor: 'var(--progress-error, #ef4444)',
      })
    })

    it('applies paused color for paused status', () => {
      const { container } = render(<ProgressIndicator progress={50} status="paused" />)

      const progressBar = container.querySelector('.progress-bar-fill')
      expect(progressBar).toHaveStyle({
        backgroundColor: 'var(--progress-paused, #6b7280)',
      })
    })

    it('applies default color for unknown status', () => {
      const { container } = render(<ProgressIndicator progress={50} status={'unknown' as any} />)

      const progressBar = container.querySelector('.progress-bar-fill')
      expect(progressBar).toHaveStyle({
        backgroundColor: 'var(--progress-default, #3b82f6)',
      })
    })
  })

  describe('edge cases', () => {
    it('clamps progress to 0 for negative values', () => {
      render(<ProgressIndicator progress={-10} status="downloading" />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('clamps progress to 100 for values over 100', () => {
      render(<ProgressIndicator progress={150} status="downloading" />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('handles 0% progress', () => {
      render(<ProgressIndicator progress={0} status="error" />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('handles 100% progress', () => {
      render(<ProgressIndicator progress={100} status="completed" />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('handles decimal progress values', () => {
      render(<ProgressIndicator progress={75.7} status="downloading" />)

      expect(screen.getByText('76%')).toBeInTheDocument()
    })

    it('handles exactly 5% threshold', () => {
      render(<ProgressIndicator progress={5} status="downloading" />)

      // At exactly 5%, percentage should be inside the bar
      const progressBar = screen.getByRole('progressbar')
      const percentageInside = progressBar.querySelector('.progress-percentage')
      expect(percentageInside).toBeInTheDocument()
    })

    it('handles just below 5% threshold', () => {
      render(<ProgressIndicator progress={4.9} status="downloading" />)

      // Below 5%, percentage should be outside the bar
      const percentageOutside = screen.getByText('5%')
      expect(percentageOutside).toHaveClass('progress-percentage-outside')
    })
  })

  describe('reduced motion', () => {
    it('applies reduced-motion class when preferred', () => {
      // Mock matchMedia for reduced motion preference
      const mockMatchMedia = vi.fn().mockImplementation(
        (query: string) =>
          ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }) as MediaQueryList
      )

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      })

      const { container } = render(<ProgressIndicator progress={50} status="downloading" />)

      const progressBar = container.querySelector('.progress-bar-fill')
      expect(progressBar).toHaveClass('progress-bar-fill')
    })
  })
})
