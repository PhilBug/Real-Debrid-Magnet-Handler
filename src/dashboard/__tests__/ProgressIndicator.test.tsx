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

    it('displays percentage text when showPercentage is true', () => {
      render(<ProgressIndicator progress={50} status="downloading" />)

      expect(screen.getByText('50%')).toBeInTheDocument()
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
      expect(progressBar).toHaveAttribute('aria-label', 'Progress')
    })
  })

  describe('status variants', () => {
    it('applies downloading variant for downloading status', () => {
      const { container } = render(<ProgressIndicator progress={50} status="downloading" />)

      const progressBar = container.querySelector('.progress-bar')
      expect(progressBar).toHaveClass('progress-bar--downloading')
    })

    it('applies uploading variant for uploading status', () => {
      const { container } = render(<ProgressIndicator progress={50} status="uploading" />)

      const progressBar = container.querySelector('.progress-bar')
      expect(progressBar).toHaveClass('progress-bar--uploading')
    })

    it('applies converting variant for converting status', () => {
      const { container } = render(<ProgressIndicator progress={50} status="converting" />)

      const progressBar = container.querySelector('.progress-bar')
      expect(progressBar).toHaveClass('progress-bar--converting')
    })

    it('applies completed variant for completed status', () => {
      const { container } = render(<ProgressIndicator progress={100} status="completed" />)

      const progressBar = container.querySelector('.progress-bar')
      expect(progressBar).toHaveClass('progress-bar--completed')
    })

    it('applies error variant for error status', () => {
      const { container } = render(<ProgressIndicator progress={0} status="error" />)

      const progressBar = container.querySelector('.progress-bar')
      expect(progressBar).toHaveClass('progress-bar--error')
    })

    it('applies paused variant for paused status', () => {
      const { container } = render(<ProgressIndicator progress={50} status="paused" />)

      const progressBar = container.querySelector('.progress-bar')
      expect(progressBar).toHaveClass('progress-bar--paused')
    })

    it('applies default variant for unknown status', () => {
      const { container } = render(<ProgressIndicator progress={50} status={'unknown' as any} />)

      const progressBar = container.querySelector('.progress-bar')
      expect(progressBar).toHaveClass('progress-bar--default')
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

      // ProgressBar shows exact value, not rounded
      expect(screen.getByText('75.7%')).toBeInTheDocument()
    })

    it('handles exactly 5% threshold', () => {
      render(<ProgressIndicator progress={5} status="downloading" />)

      // ProgressBar shows percentage in header, not inside bar
      const percentage = screen.getByText('5%')
      expect(percentage).toBeInTheDocument()
      expect(percentage).toHaveClass('progress__percentage')
    })

    it('handles just below 5% threshold', () => {
      render(<ProgressIndicator progress={4.9} status="downloading" />)

      // ProgressBar shows exact value
      expect(screen.getByText('4.9%')).toBeInTheDocument()
    })
  })

  describe('progress bar structure', () => {
    it('renders progress bar with correct width', () => {
      const { container } = render(<ProgressIndicator progress={60} status="downloading" />)

      const progressBar = container.querySelector('.progress-bar')
      expect(progressBar).toHaveStyle({ width: '60%' })
    })

    it('renders with md size by default', () => {
      const { container } = render(<ProgressIndicator progress={50} status="downloading" />)

      const progressContainer = container.querySelector('.progress-container')
      expect(progressContainer).toHaveClass('progress--md')
    })
  })
})
