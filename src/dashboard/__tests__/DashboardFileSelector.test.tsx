import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DashboardFileSelector } from '../DashboardFileSelector'
import browser from 'webextension-polyfill'

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
    },
  },
}))

describe('DashboardFileSelector', () => {
  const defaultProps = {
    torrentId: 't1',
    torrentFilename: 'test-torrent.mp4',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  const mockTorrentInfo = {
    id: 't1',
    filename: 'test-torrent.mp4',
    hash: 'hash1',
    status: 'waiting_files_selection',
    progress: 0,
    files: [
      { id: 1, path: '/file1.mp4', bytes: 1024 * 1024 * 10, selected: 1 },
      { id: 2, path: '/file2.txt', bytes: 1024, selected: 0 },
      { id: 3, path: '/file3.mkv', bytes: 1024 * 1024 * 50, selected: 0 },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(browser.runtime.sendMessage as any).mockResolvedValue({
      success: true,
      info: mockTorrentInfo,
    })
  })

  it('renders loading state initially', async () => {
    // Delay resolution to check loading state
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    ;(browser.runtime.sendMessage as any).mockReturnValue(promise)

    render(<DashboardFileSelector {...defaultProps} />)

    expect(screen.getByText('Loading files...')).toBeInTheDocument()

    // Clean up
    resolvePromise!({ success: true, info: mockTorrentInfo })
    await waitFor(() => expect(screen.queryByText('Loading files...')).not.toBeInTheDocument())
  })

  it('fetches and displays torrent info', async () => {
    render(<DashboardFileSelector {...defaultProps} />)

    await waitFor(
      () => {
        expect(screen.getByText('Select Files to Download')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    await waitFor(() => {
      expect(screen.getByText('/file1.mp4')).toBeInTheDocument()
      expect(screen.getByText('/file2.txt')).toBeInTheDocument()
      expect(screen.getByText('/file3.mkv')).toBeInTheDocument()
    })
  })

  it('displays error message when fetch fails', async () => {
    ;(browser.runtime.sendMessage as any).mockResolvedValue({
      success: false,
      error: 'Failed to fetch',
    })

    render(<DashboardFileSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
    })
  })

  it('displays error message on exception', async () => {
    ;(browser.runtime.sendMessage as any).mockRejectedValue(new Error('Network error'))

    render(<DashboardFileSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('toggles file selection', async () => {
    render(<DashboardFileSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('/file1.mp4')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox')
    const checkbox1 = checkboxes[0] // Assuming order is preserved (1, 2, 3)

    // Initial state is empty set according to component default
    expect(checkbox1).not.toBeChecked()

    fireEvent.click(checkbox1)
    expect(checkbox1).toBeChecked()

    fireEvent.click(checkbox1)
    expect(checkbox1).not.toBeChecked()
  })

  it('toggles all files via button', async () => {
    render(<DashboardFileSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Select All')).toBeInTheDocument()
    })

    const selectAllBtn = screen.getByText('Select All')
    fireEvent.click(selectAllBtn)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).toBeChecked()
    expect(checkboxes[1]).toBeChecked()
    expect(checkboxes[2]).toBeChecked()

    fireEvent.click(screen.getByText('Deselect All'))

    expect(checkboxes[0]).not.toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()
    expect(checkboxes[2]).not.toBeChecked()
  })

  it('confirms selection with specific files', async () => {
    render(<DashboardFileSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('/file1.mp4')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]) // file1 (id 1)
    fireEvent.click(checkboxes[2]) // file3 (id 3)

    const confirmBtn = screen.getByText('Confirm Selection')
    fireEvent.click(confirmBtn)

    expect(defaultProps.onConfirm).toHaveBeenCalledWith('t1', '1,3')
  })

  it('confirms selection with all files (empty selection sends all)', async () => {
    render(<DashboardFileSelector {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Confirm Selection')).toBeInTheDocument()
    })

    // Initial state is empty, so it sends 'all'
    fireEvent.click(screen.getByText('Confirm Selection'))
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('t1', 'all')
  })

  it('calls onCancel when cancel is clicked', async () => {
    render(<DashboardFileSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('calls onCancel when close is clicked in error state', async () => {
    ;(browser.runtime.sendMessage as any).mockResolvedValue({
      success: false,
      error: 'Failed',
    })

    render(<DashboardFileSelector {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Close'))
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })
})
