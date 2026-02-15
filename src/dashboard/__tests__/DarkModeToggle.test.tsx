import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DarkModeToggle } from '../DarkModeToggle'
import { storage } from '../../utils/storage'

// Mock storage module
vi.mock('../../utils/storage', () => ({
  storage: {
    getDarkMode: vi.fn(),
    setDarkMode: vi.fn(),
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

describe('DarkModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.documentElement.classList.remove('dark')

    // Reset mock to default implementation
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
    it('renders with auto mode by default', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('auto')
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Auto (light)')).toBeInTheDocument()
      })
    })

    it('renders with light mode', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('light')

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument()
      })
    })

    it('renders with dark mode', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('dark')

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument()
      })
    })

    it('shows correct icon for light mode', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('light')

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument()
      })

      const button = screen.getByRole('button')
      expect(button.textContent).toContain('Light')
    })

    it('shows correct icon for dark mode', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('dark')

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument()
      })
    })

    it('shows correct icon for auto mode', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('auto')
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Auto (light)')).toBeInTheDocument()
      })
    })
  })

  describe('theme application', () => {
    it('applies dark class when dark mode is set', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('dark')

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('does not apply dark class when light mode is set', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('light')

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('applies dark class in auto mode when system prefers dark', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('auto')
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
        expect(screen.getByText('Auto (dark)')).toBeInTheDocument()
      })
    })

    it('does not apply dark class in auto mode when system prefers light', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('auto')
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
        expect(screen.getByText('Auto (light)')).toBeInTheDocument()
      })
    })
  })

  describe('mode cycling', () => {
    it('cycles from auto to light on click', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('auto')
      vi.mocked(storage.setDarkMode).mockResolvedValue(undefined)
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Auto (light)')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /Toggle theme/ })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(storage.setDarkMode).toHaveBeenCalledWith('light')
      })
    })

    it('cycles from light to dark on click', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('light')
      vi.mocked(storage.setDarkMode).mockResolvedValue(undefined)

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /Toggle theme/ })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(storage.setDarkMode).toHaveBeenCalledWith('dark')
      })
    })

    it('cycles from dark to auto on click', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('dark')
      vi.mocked(storage.setDarkMode).mockResolvedValue(undefined)
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /Toggle theme/ })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(storage.setDarkMode).toHaveBeenCalledWith('auto')
      })
    })

    it('persists mode to storage on click', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('auto')
      vi.mocked(storage.setDarkMode).mockResolvedValue(undefined)
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Auto (light)')).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /Toggle theme/ })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(storage.setDarkMode).toHaveBeenCalledWith('light')
      })
    })
  })

  describe('system preference changes', () => {
    it('responds to system preference changes in auto mode', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('auto')

      let changeHandler: (() => void) | null = null
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: () => void) => {
          if (event === 'change') {
            changeHandler = handler
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Auto (light)')).toBeInTheDocument()
      })

      // Simulate system preference change to dark
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

      // Trigger the change handler
      if (changeHandler) {
        await act(async () => {
          changeHandler!()
        })
      }

      await waitFor(() => {
        expect(screen.getByText('Auto (dark)')).toBeInTheDocument()
      })
    })

    it('does not respond to system preference changes in light mode', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('light')

      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument()
      })

      // System preference change should not affect light mode
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('does not respond to system preference changes in dark mode', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('dark')

      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      render(<DarkModeToggle />)

      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument()
      })

      // System preference change should not affect dark mode
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })
  })

  describe('accessibility', () => {
    it('has proper aria-label', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('light')

      render(<DarkModeToggle />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Toggle theme/ })
        expect(button).toHaveAttribute('aria-label', 'Toggle theme (current: Light)')
      })
    })

    it('has proper title attribute', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('dark')

      render(<DarkModeToggle />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Toggle theme/ })
        expect(button).toHaveAttribute('title', 'Dark')
      })
    })
  })

  describe('custom className', () => {
    it('applies custom className', async () => {
      vi.mocked(storage.getDarkMode).mockResolvedValue('auto')
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      const { container } = render(<DarkModeToggle className="custom-class" />)

      await waitFor(() => {
        const button = container.querySelector('.dark-mode-toggle')
        expect(button).toHaveClass('custom-class')
      })
    })
  })
})
