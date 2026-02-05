import browser from 'webextension-polyfill'
import { storage } from '../utils/storage'

const CONTEXT_MENU_ID = 'send-to-real-debrid'

// Create context menu for magnet links
export async function createContextMenu(): Promise<void> {
  await browser.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Send to Real-Debrid Magnet Handler',
    contexts: ['link'],
    documentUrlPatterns: ['<all_urls>'],
  })
}

// Remove context menu
export async function removeContextMenu(): Promise<void> {
  await browser.contextMenus.remove(CONTEXT_MENU_ID)
}

// Check if context menu should be enabled and create/remove accordingly
export async function syncContextMenu(): Promise<void> {
  const settings = await storage.getSettings()
  if (settings.contextMenuEnabled) {
    await createContextMenu()
  } else {
    await removeContextMenu()
  }
}

// Handle context menu click
export async function handleContextMenuClick(info: browser.Menus.OnClickData): Promise<void> {
  if (info.menuItemId === CONTEXT_MENU_ID && info.linkUrl) {
    await browser.runtime.sendMessage({ type: 'ADD_MAGNET', magnetLink: info.linkUrl })
  }
}

// Initialize context menu listener
export function initContextMenuListener(): void {
  browser.contextMenus.onClicked.addListener(info => {
    // NOTE: This callback invocation (line 47) is intentionally not covered by unit tests.
    // It requires the browser to actually trigger a context menu click event, which is
    // only practical to test via integration/E2E tests. The callback logic itself is
    // tested separately in handleContextMenuClick() tests.
    handleContextMenuClick(info)
  })
}
