import { useEffect, useRef } from 'react'

/**
 * Custom hook to dynamically adjust popup height based on actual content.
 * Uses ResizeObserver to watch for content changes and update body height.
 *
 * @param torrentListRef - Reference to the torrent list container element
 * @param enabled - Whether the height calculation is enabled (default: true)
 */
export function usePopupHeight(
  torrentListRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean = true
): void {
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    if (!enabled || !torrentListRef.current) {
      return
    }

    // Calculate the fixed UI overhead (header, input section, status bar, footer)
    const calculateFixedUIHeight = (): number => {
      const header = document.querySelector('.popup__header') as HTMLElement | null
      const inputSection = document.querySelector('.popup__input-section') as HTMLElement | null
      const statusBar = document.querySelector('.popup__status-bar') as HTMLElement | null
      const footer = document.querySelector('.popup__footer') as HTMLElement | null

      let fixedHeight = 0
      if (header) {
        fixedHeight += header.offsetHeight
      }
      if (inputSection) {
        fixedHeight += inputSection.offsetHeight
      }
      // Only add status bar height if it's visible (offsetParent is non-null)
      if (statusBar && statusBar.offsetParent !== null) {
        fixedHeight += statusBar.offsetHeight
      }
      // Only add footer height if it's visible
      if (footer && footer.offsetParent !== null) {
        fixedHeight += footer.offsetHeight
      }

      // Return exact height without extra padding
      return fixedHeight
    }

    // Update popup height based on actual content
    const updatePopupHeight = (): void => {
      const popup = document.querySelector('.popup') as HTMLElement
      const torrentList = torrentListRef.current

      if (!popup || !torrentList) {
        return
      }

      const fixedHeight = calculateFixedUIHeight()
      const actualContentHeight = torrentList.scrollHeight

      // Calculate ideal height (capped at 600px browser hard limit)
      const idealHeight = Math.min(
        fixedHeight + actualContentHeight,
        600 // Browser hard limit for extension popups
      )

      // Set height to fit content exactly
      popup.style.minHeight = `${idealHeight}px`
      popup.style.height = `${idealHeight}px`

      // Update CSS variable for torrent list max-height
      const availableForList = idealHeight - fixedHeight
      popup.style.setProperty('--torrent-list-max-height', `${availableForList}px`)
    }

    // Set up ResizeObserver to watch for content changes
    resizeObserverRef.current = new ResizeObserver(() => {
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(updatePopupHeight)
    })

    // Observe the torrent list container directly (simpler and handles dynamic content)
    resizeObserverRef.current.observe(torrentListRef.current)

    // Initial calculation after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(updatePopupHeight, 50)

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      resizeObserverRef.current?.disconnect()
    }
  }, [enabled, torrentListRef])
}
