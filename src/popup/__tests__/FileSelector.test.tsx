import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { FileSelector } from '../FileSelector'
import type { RdTorrentInfo } from '../../utils/types'

describe('FileSelector', () => {
  const mockTorrentInfo: RdTorrentInfo = {
    id: 'torrent-123',
    filename: 'Test Torrent',
    hash: 'abc123',
    status: 'waiting_files_selection',
    progress: 100,
    files: [
      { id: 1, path: 'file1.txt', bytes: 1024, selected: 0 },
      { id: 2, path: 'file2.mkv', bytes: 1024 * 1024 * 1024, selected: 0 },
      { id: 3, path: 'file3.srt', bytes: 1024 * 100, selected: 0 },
    ],
  }

  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders file list with all files', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Select Files to Download')).toBeInTheDocument()
    expect(screen.getByText('file1.txt')).toBeInTheDocument()
    expect(screen.getByText('file2.mkv')).toBeInTheDocument()
    expect(screen.getByText('file3.srt')).toBeInTheDocument()
  })

  it('formats file sizes correctly', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    // 1024 bytes = 1.0 KB
    expect(screen.getByText('1.0 KB')).toBeInTheDocument()
    // 1024 * 1024 * 1024 bytes = 1.0 GB
    expect(screen.getByText('1.0 GB')).toBeInTheDocument()
    // 1024 * 100 bytes = 100.0 KB
    expect(screen.getByText('100.0 KB')).toBeInTheDocument()
  })

  it('shows total size and selected size', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    // Total size is ~1GB + 100KB + 1KB, should show initial selected size as 0 B
    expect(screen.getByText(/0 B/)).toBeInTheDocument()
  })

  it('selects individual file when checkbox clicked', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)

    fireEvent.click(checkboxes[0])

    // After selecting first file (1024 bytes), selected size should update
    expect(screen.getByText('1.0 KB')).toBeInTheDocument()
  })

  it('deselects individual file when checkbox clicked twice', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')

    // First click selects
    fireEvent.click(checkboxes[0])
    expect(checkboxes[0]).toBeChecked()

    // Second click deselects
    fireEvent.click(checkboxes[0])
    expect(checkboxes[0]).not.toBeChecked()
  })

  it('selects all files when Select All clicked', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const selectAllButton = screen.getByText('Select All')
    fireEvent.click(selectAllButton)

    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked()
    })

    expect(selectAllButton).toHaveTextContent('Deselect All')
    expect(screen.getByText('3 of 3 files selected')).toBeInTheDocument()
  })

  it('deselects all files when Deselect All clicked', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    // First select all
    const selectAllButton = screen.getByText('Select All')
    fireEvent.click(selectAllButton)

    // Then deselect
    const deselectButton = screen.getByText('Deselect All')
    fireEvent.click(deselectButton)

    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked()
    })
  })

  it('calls onConfirm with all when no files selected and Confirm clicked', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const confirmButton = screen.getByText('Confirm Selection')
    fireEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledWith('all')
  })

  it('calls onConfirm with comma-separated IDs when files selected and Confirm clicked', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    // Select files 1 and 3
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[2])

    const confirmButton = screen.getByText('Confirm Selection')
    fireEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledWith('1,3')
  })

  it('calls onCancel when Cancel button clicked', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('updates selected size counter when files selected', () => {
    render(
      <FileSelector
        torrentInfo={mockTorrentInfo}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')

    // Select file 1 (1 KB)
    fireEvent.click(checkboxes[0])
    expect(screen.getByText(/1.0 KB \/ 1.0 GB/)).toBeInTheDocument()

    // Select file 2 (1 GB)
    fireEvent.click(checkboxes[1])
    expect(screen.getByText(/1.0 GB \/ 1.0 GB/)).toBeInTheDocument()
  })

  it('shows 0 of 0 files selected when no files', () => {
    const emptyTorrent: RdTorrentInfo = {
      ...mockTorrentInfo,
      files: [],
    }

    render(
      <FileSelector torrentInfo={emptyTorrent} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    expect(screen.getByText('0 of 0 files selected')).toBeInTheDocument()
  })
})
