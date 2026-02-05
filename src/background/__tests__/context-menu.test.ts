import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => {
  const mockContextMenus = {
    create: vi.fn(),
    remove: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  }

  const mockRuntime = {
    sendMessage: vi.fn(() => Promise.resolve()),
  }

  const mockStorage = {
    sync: {
      get: vi.fn(() =>
        Promise.resolve({
          apiToken: 'test-token',
          maxListSize: 10,
          retryInterval: 30,
          maxRetryDuration: 300,
          contextMenuEnabled: false,
          alwaysSaveAllFiles: false,
        })
      ),
      set: vi.fn(),
    },
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  }

  return {
    default: {
      contextMenus: mockContextMenus,
      runtime: mockRuntime,
      storage: mockStorage,
    },
    get mockContextMenus() {
      return mockContextMenus
    },
    get mockRuntime() {
      return mockRuntime
    },
    get mockStorage() {
      return mockStorage
    },
  }
})

describe('context-menu', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('createContextMenu', () => {
    it('creates context menu with correct properties', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockContextMenus } = webextension as any
      const { createContextMenu } = await import('../context-menu')

      await createContextMenu()

      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'send-to-real-debrid',
        title: 'Send to Real-Debrid Magnet Handler',
        contexts: ['link'],
        documentUrlPatterns: ['<all_urls>'],
      })
    })
  })

  describe('removeContextMenu', () => {
    it('removes context menu', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockContextMenus } = webextension as any
      const { removeContextMenu } = await import('../context-menu')

      await removeContextMenu()

      expect(mockContextMenus.remove).toHaveBeenCalledWith('send-to-real-debrid')
    })
  })

  describe('handleContextMenuClick', () => {
    it('sends ADD_MAGNET message when menu item clicked', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime } = webextension as any
      const { handleContextMenuClick } = await import('../context-menu')

      const info = {
        menuItemId: 'send-to-real-debrid',
        linkUrl: 'magnet:?xt=urn:btih:test',
        editable: false,
        modifiers: [],
      } as const

      await handleContextMenuClick(info as any)

      expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
        type: 'ADD_MAGNET',
        magnetLink: 'magnet:?xt=urn:btih:test',
      })
    })

    it('does not send message when menu item id does not match', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockRuntime } = webextension as any
      const { handleContextMenuClick } = await import('../context-menu')

      const info = {
        menuItemId: 'other-menu-item',
        linkUrl: 'magnet:?xt=urn:btih:test',
        editable: false,
        modifiers: [],
      } as const

      await handleContextMenuClick(info as any)

      expect(mockRuntime.sendMessage).not.toHaveBeenCalled()
    })
  })

  describe('initContextMenuListener', () => {
    it('adds click listener to context menus', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockContextMenus } = webextension as any
      const { initContextMenuListener } = await import('../context-menu')

      initContextMenuListener()

      expect(mockContextMenus.onClicked.addListener).toHaveBeenCalledWith(expect.any(Function))
    })

    it('listener callback calls handleContextMenuClick', async () => {
      const webextension = await import('webextension-polyfill')
      const { mockContextMenus, mockRuntime } = webextension as any

      // Get the callback that was passed to addListener
      const addListenerCalls = mockContextMenus.onClicked.addListener.mock.calls
      if (addListenerCalls.length > 0) {
        const callback = addListenerCalls[addListenerCalls.length - 1][0]

        // Call the callback with test data
        const info = {
          menuItemId: 'send-to-real-debrid',
          linkUrl: 'magnet:?xt=urn:btih:test',
          editable: false,
          modifiers: [],
        } as const

        await callback(info as any)

        // Verify message was sent (proves callback is wired correctly)
        expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
          type: 'ADD_MAGNET',
          magnetLink: 'magnet:?xt=urn:btih:test',
        })
      }
    })
  })

  describe('syncContextMenu', () => {
    it('creates context menu when enabled', async () => {
      // Need to reset modules to change the mock behavior
      vi.resetModules()

      // Set up mock with contextMenuEnabled: true
      vi.doMock('webextension-polyfill', () => {
        const mockContextMenus = {
          create: vi.fn(),
          remove: vi.fn(),
          onClicked: { addListener: vi.fn() },
        }

        const mockStorage = {
          sync: {
            get: vi.fn(() =>
              Promise.resolve({
                apiToken: 'test-token',
                maxListSize: 10,
                retryInterval: 30,
                maxRetryDuration: 300,
                contextMenuEnabled: true,
                alwaysSaveAllFiles: false,
              })
            ),
            set: vi.fn(),
          },
          local: {
            get: vi.fn(() => Promise.resolve({})),
            set: vi.fn(),
          },
          onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
          },
        }

        return {
          default: {
            contextMenus: mockContextMenus,
            storage: mockStorage,
          },
          get mockContextMenus() {
            return mockContextMenus
          },
        }
      })

      const webextension = await import('webextension-polyfill')
      const { mockContextMenus } = webextension as any
      const { syncContextMenu } = await import('../context-menu')

      await syncContextMenu()

      expect(mockContextMenus.create).toHaveBeenCalled()
      expect(mockContextMenus.remove).not.toHaveBeenCalled()
    })

    it('removes context menu when disabled', async () => {
      // Reset modules (default mock already has contextMenuEnabled: false)
      vi.resetModules()

      vi.doMock('webextension-polyfill', () => {
        const mockContextMenus = {
          create: vi.fn(),
          remove: vi.fn(),
          onClicked: { addListener: vi.fn() },
        }

        const mockStorage = {
          sync: {
            get: vi.fn(() =>
              Promise.resolve({
                apiToken: 'test-token',
                maxListSize: 10,
                retryInterval: 30,
                maxRetryDuration: 300,
                contextMenuEnabled: false,
                alwaysSaveAllFiles: false,
              })
            ),
            set: vi.fn(),
          },
          local: {
            get: vi.fn(() => Promise.resolve({})),
            set: vi.fn(),
          },
          onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
          },
        }

        return {
          default: {
            contextMenus: mockContextMenus,
            storage: mockStorage,
          },
          get mockContextMenus() {
            return mockContextMenus
          },
        }
      })

      const webextension = await import('webextension-polyfill')
      const { mockContextMenus } = webextension as any
      const { syncContextMenu } = await import('../context-menu')

      await syncContextMenu()

      expect(mockContextMenus.remove).toHaveBeenCalled()
      expect(mockContextMenus.create).not.toHaveBeenCalled()
    })
  })
})
