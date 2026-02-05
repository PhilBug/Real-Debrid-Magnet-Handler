import browser from 'webextension-polyfill'
import type { TorrentItem, Settings } from './types'

// In-memory cache for useSyncExternalStore sync snapshot requirement
const storageCache: Record<string, any> = {}

// Initialize cache on load
async function initializeCache() {
  const localData = await browser.storage.local.get(null)
  const syncData = await browser.storage.sync.get(null)
  Object.assign(storageCache, localData, syncData)
}

// Listen for storage changes to update cache
browser.storage.onChanged.addListener(changes => {
  for (const [key, { newValue }] of Object.entries(changes)) {
    storageCache[key] = newValue
  }
})

// Initialize cache
initializeCache()

export const storage = {
  // Sync storage (settings)
  async getSettings(): Promise<Settings> {
    const result = await browser.storage.sync.get({
      apiToken: null,
      maxListSize: 10,
      retryInterval: 30,
      maxRetryDuration: 300,
      contextMenuEnabled: false,
      alwaysSaveAllFiles: false,
    })
    return result as unknown as Settings
  },

  async saveSettings(settings: Partial<Settings>): Promise<void> {
    await browser.storage.sync.set(settings)
    // Update cache
    Object.assign(storageCache, settings as Record<string, unknown>)
  },

  // Local storage (torrents)
  async getTorrents(): Promise<TorrentItem[]> {
    const result = await browser.storage.local.get('torrents')
    return (result.torrents as TorrentItem[]) || []
  },

  async saveTorrents(torrents: TorrentItem[]): Promise<void> {
    const settings = await this.getSettings()
    const trimmed = torrents.slice(0, settings.maxListSize)
    await browser.storage.local.set({ torrents: trimmed })
    // Update cache
    storageCache.torrents = trimmed
  },

  async addTorrent(torrent: TorrentItem): Promise<void> {
    const torrents = await this.getTorrents()
    torrents.unshift(torrent)
    await this.saveTorrents(torrents)
  },

  async removeTorrent(id: string): Promise<void> {
    const torrents = await this.getTorrents()
    const filtered = torrents.filter(t => t.id !== id)
    await browser.storage.local.set({ torrents: filtered })
    // Update cache
    storageCache.torrents = filtered
  },

  // Cache access for useSyncExternalStore
  getCache(): Record<string, any> {
    return storageCache
  },
}
