import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { BatchControls } from '../BatchControls'

describe('BatchControls', () => {
  const mockOnRetryFailed = vi.fn()
  const mockOnClearCompleted = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders both buttons when callbacks provided', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      expect(screen.getByText('Retry Failed')).toBeInTheDocument()
      expect(screen.getByText('Clear Completed')).toBeInTheDocument()
    })

    it('shows correct counts on buttons', () => {
      render(
        <BatchControls
          failedCount={5}
          completedCount={10}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('does not show count when 0', () => {
      const { container } = render(
        <BatchControls
          failedCount={0}
          completedCount={0}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      // Count badges should not be shown when count is 0
      const countElements = container.querySelectorAll('.batch-control-count')
      expect(countElements).toHaveLength(0)
    })

    it('shows icons on buttons', () => {
      const { container } = render(
        <BatchControls
          failedCount={1}
          completedCount={1}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      // Icons are now SVG elements, not emoji
      const icons = container.querySelectorAll('svg.icon')
      expect(icons.length).toBeGreaterThanOrEqual(2)
    })

    it('does not render retry button when onRetryFailed not provided', () => {
      render(
        <BatchControls failedCount={2} completedCount={3} onClearCompleted={mockOnClearCompleted} />
      )

      expect(screen.queryByText('Retry Failed')).not.toBeInTheDocument()
    })

    it('does not render clear button when onClearCompleted not provided', () => {
      render(<BatchControls failedCount={2} completedCount={3} onRetryFailed={mockOnRetryFailed} />)

      expect(screen.queryByText('Clear Completed')).not.toBeInTheDocument()
    })
  })

  describe('button states', () => {
    it('disables retry button when failedCount is 0', () => {
      render(
        <BatchControls
          failedCount={0}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      expect(retryButton).toBeDisabled()
    })

    it('disables clear button when completedCount is 0', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={0}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      expect(clearButton).toBeDisabled()
    })

    it('enables retry button when failedCount > 0', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      expect(retryButton).not.toBeDisabled()
    })

    it('enables clear button when completedCount > 0', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      expect(clearButton).not.toBeDisabled()
    })

    it('disables both buttons when disabled prop is true', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
          disabled={true}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      expect(retryButton).toBeDisabled()
      expect(clearButton).toBeDisabled()
    })
  })

  describe('tooltips', () => {
    it('shows tooltip for retry button with count', () => {
      render(
        <BatchControls
          failedCount={5}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      expect(retryButton).toHaveAttribute('title', 'Retry 5 failed torrents')
    })

    it('shows tooltip for clear button with count', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={10}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      expect(clearButton).toHaveAttribute('title', 'Clear 10 completed torrents')
    })

    it('shows tooltip for retry button when no failed torrents', () => {
      render(
        <BatchControls
          failedCount={0}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      expect(retryButton).toHaveAttribute('title', 'No failed torrents to retry')
    })

    it('shows tooltip for clear button when no completed torrents', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={0}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      expect(clearButton).toHaveAttribute('title', 'No completed torrents to clear')
    })
  })

  describe('click handling', () => {
    it('calls onRetryFailed when retry button clicked', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      fireEvent.click(retryButton)

      expect(mockOnRetryFailed).toHaveBeenCalledTimes(1)
    })

    it('calls onClearCompleted when clear button clicked', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      fireEvent.click(clearButton)

      expect(mockOnClearCompleted).toHaveBeenCalledTimes(1)
    })

    it('does not call onRetryFailed when button disabled', () => {
      render(
        <BatchControls
          failedCount={0}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      fireEvent.click(retryButton)

      expect(mockOnRetryFailed).not.toHaveBeenCalled()
    })

    it('does not call onClearCompleted when button disabled', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={0}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      fireEvent.click(clearButton)

      expect(mockOnClearCompleted).not.toHaveBeenCalled()
    })

    it('does not call callbacks when disabled prop is true', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
          disabled={true}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      fireEvent.click(retryButton)
      fireEvent.click(clearButton)

      expect(mockOnRetryFailed).not.toHaveBeenCalled()
      expect(mockOnClearCompleted).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has proper aria-label on retry button', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      expect(retryButton).toHaveAttribute('aria-label', 'Retry all failed torrents (2)')
    })

    it('has proper aria-label on clear button', () => {
      render(
        <BatchControls
          failedCount={2}
          completedCount={3}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      expect(clearButton).toHaveAttribute('aria-label', 'Clear completed torrents (3)')
    })

    it('has proper aria-label when count is 0', () => {
      render(
        <BatchControls
          failedCount={0}
          completedCount={0}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      const retryButton = screen.getByRole('button', { name: /Retry all failed torrents/ })
      const clearButton = screen.getByRole('button', { name: /Clear completed torrents/ })
      expect(retryButton).toHaveAttribute('aria-label', 'Retry all failed torrents (0)')
      expect(clearButton).toHaveAttribute('aria-label', 'Clear completed torrents (0)')
    })
  })

  describe('edge cases', () => {
    it('handles very large counts', () => {
      render(
        <BatchControls
          failedCount={999}
          completedCount={1000}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      expect(screen.getByText('999')).toBeInTheDocument()
      expect(screen.getByText('1000')).toBeInTheDocument()
    })

    it('handles single counts', () => {
      render(
        <BatchControls
          failedCount={1}
          completedCount={1}
          onRetryFailed={mockOnRetryFailed}
          onClearCompleted={mockOnClearCompleted}
        />
      )

      // Both buttons show '1' count, so we should find both
      const ones = screen.getAllByText('1')
      expect(ones).toHaveLength(2)
    })
  })
})
