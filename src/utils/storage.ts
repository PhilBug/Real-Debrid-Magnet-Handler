import browser from 'webextension-polyfill'
import type { TorrentItem, Settings, DashboardSettings, NotificationState } from './types'

// In-memory cache for useSyncExternalStore sync snapshot requirement
const storageCache: Record<string, any> = {}

// Subscribers for cache initialization and changes
const cacheSubscribers: Set<() => void> = new Set()

// Notify all subscribers of cache changes
function notifySubscribers(): void {
  for (const callback of cacheSubscribers) {
    callback()
  }
}

// Initialize cache on load
async function initializeCache() {
  const localData = await browser.storage.local.get(null)
  const syncData = await browser.storage.sync.get(null)
  Object.assign(storageCache, localData, syncData)
  // Notify subscribers after cache is populated
  notifySubscribers()
}

// Listen for storage changes to update cache
browser.storage.onChanged.addListener(changes => {
  for (const [key, { newValue }] of Object.entries(changes)) {
    storageCache[key] = newValue
  }
})

// Initialize cache
initializeCache()

// Export for testing
export const _testNotifySubscribers = notifySubscribers

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
      visibleTorrentsCount: 5,
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
    // Create new array reference so useSyncExternalStore detects change
    storageCache.torrents = [...trimmed]
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
    // Create new array reference so useSyncExternalStore detects change
    storageCache.torrents = [...filtered]
  },

  // Cache access for useSyncExternalStore
  getCache(): Record<string, any> {
    return storageCache
  },

  // Subscribe to cache changes (including initialization)
  subscribe(callback: () => void): () => void {
    cacheSubscribers.add(callback)
    return () => cacheSubscribers.delete(callback)
  },

  // Dashboard settings storage
  async getDashboardSettings(): Promise<DashboardSettings> {
    const result = await browser.storage.sync.get({
      dashboardSettings: {
        darkMode: 'auto' as const,
        notificationsEnabled: true,
        autoRefresh: true,
        refreshInterval: 30,
      },
    })
    return result.dashboardSettings as DashboardSettings
  },

  async saveDashboardSettings(settings: Partial<DashboardSettings>): Promise<void> {
    const current = await this.getDashboardSettings()
    const updated = { ...current, ...settings }
    await browser.storage.sync.set({ dashboardSettings: updated })
    // Update cache
    storageCache.dashboardSettings = updated
  },

  // Notification state storage
  async getNotificationState(): Promise<NotificationState> {
    const result = await browser.storage.local.get({
      notificationState: {
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      },
    })
    return (
      (result.notificationState as NotificationState) || {
        notifiedTorrentIds: [],
        lastNotificationTime: 0,
      }
    )
  },

  async saveNotificationState(state: NotificationState): Promise<void> {
    await browser.storage.local.set({ notificationState: state })
    // Update cache
    storageCache.notificationState = state
  },

  // Dark mode preference (stored separately for quick access)
  async getDarkMode(): Promise<'light' | 'dark' | 'auto'> {
    const settings = await this.getDashboardSettings()
    return settings.darkMode
  },

  async setDarkMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.saveDashboardSettings({ darkMode: mode })
  },
}
