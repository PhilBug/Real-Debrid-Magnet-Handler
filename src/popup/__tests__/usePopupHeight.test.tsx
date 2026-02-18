import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { usePopupHeight } from '../usePopupHeight'

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// Use stubGlobal or direct assignment to window/globalThis for better compatibility
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

// Test component using the hook
const TestComponent = ({ enabled = true }: { enabled?: boolean }) => {
  const torrentListRef = useRef<HTMLDivElement>(null)
  usePopupHeight(torrentListRef, enabled)

  return (
    <div className="popup" style={{ height: 'auto' }}>
      <div className="popup__header" style={{ height: '50px' }}>
        Header
      </div>
      <div className="popup__input-section" style={{ height: '60px' }}>
        Input
      </div>
      <div className="popup__status-bar" style={{ height: '40px' }}>
        Status
      </div>
      <div ref={torrentListRef} className="torrent-list" style={{ height: 'auto' }}>
        <div style={{ height: '100px' }}>Item 1</div>
        <div style={{ height: '100px' }}>Item 2</div>
      </div>
      <div className="popup__footer" style={{ height: '40px' }}>
        Footer
      </div>
    </div>
  )
}

describe('usePopupHeight', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Mock offsetHeight and scrollHeight
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 50 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 200 })
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      value: document.body,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('calculates height correctly and sets min-height', () => {
    const { container } = render(<TestComponent />)

    // Mock specific heights
    const header = container.querySelector('.popup__header') as HTMLElement
    Object.defineProperty(header, 'offsetHeight', { configurable: true, value: 50 })

    const input = container.querySelector('.popup__input-section') as HTMLElement
    Object.defineProperty(input, 'offsetHeight', { configurable: true, value: 60 })

    const status = container.querySelector('.popup__status-bar') as HTMLElement
    Object.defineProperty(status, 'offsetHeight', { configurable: true, value: 40 })

    const footer = container.querySelector('.popup__footer') as HTMLElement
    Object.defineProperty(footer, 'offsetHeight', { configurable: true, value: 40 })

    const list = container.querySelector('.torrent-list') as HTMLElement
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 200 })

    // Trigger calculation
    vi.runAllTimers()

    const popup = container.querySelector('.popup') as HTMLElement

    // Total height should be: 50 (header) + 60 (input) + 40 (status) + 40 (footer) + 200 (list content) = 390
    // The hook sets minHeight
    expect(popup.style.minHeight).toBe('390px')
    expect(popup.style.height).toBe('390px')
  })

  it('caps height at 600px', () => {
    const { container } = render(<TestComponent />)

    const list = container.querySelector('.torrent-list') as HTMLElement
    // Set a very large content height
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 800 })

    vi.runAllTimers()

    const popup = container.querySelector('.popup') as HTMLElement
    expect(popup.style.minHeight).toBe('600px')
    expect(popup.style.height).toBe('600px')
  })

  it('updates CSS variable for list max-height', () => {
    const { container } = render(<TestComponent />)

    // Set specific heights to match the calculation in comments
    const header = container.querySelector('.popup__header') as HTMLElement
    Object.defineProperty(header, 'offsetHeight', { configurable: true, value: 50 })

    const input = container.querySelector('.popup__input-section') as HTMLElement
    Object.defineProperty(input, 'offsetHeight', { configurable: true, value: 60 })

    const status = container.querySelector('.popup__status-bar') as HTMLElement
    Object.defineProperty(status, 'offsetHeight', { configurable: true, value: 40 })

    const footer = container.querySelector('.popup__footer') as HTMLElement
    Object.defineProperty(footer, 'offsetHeight', { configurable: true, value: 40 })

    const list = container.querySelector('.torrent-list') as HTMLElement
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 800 }) // overflows 600

    // Fixed UI height = 50 + 60 + 40 + 40 = 190
    // Ideal height = 190 + 800 = 990 -> capped at 600
    // Available for list = 600 - 190 = 410

    vi.runAllTimers()

    const popup = container.querySelector('.popup') as HTMLElement
    expect(popup.style.getPropertyValue('--torrent-list-max-height')).toBe('410px')
  })

  it('ignores elements that are not visible (no offsetParent)', () => {
    const { container } = render(<TestComponent />)

    const footer = container.querySelector('.popup__footer') as HTMLElement
    Object.defineProperty(footer, 'offsetParent', { configurable: true, value: null })

    const list = container.querySelector('.torrent-list') as HTMLElement
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 200 })

    // Fixed height = 50 + 60 + 40 + 0 (footer hidden) = 150
    // Total = 150 + 200 = 350

    vi.runAllTimers()

    const popup = container.querySelector('.popup') as HTMLElement
    expect(popup.style.minHeight).toBe('350px')
  })
})
