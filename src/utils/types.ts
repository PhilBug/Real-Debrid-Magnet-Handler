export type TorrentStatus = 'processing' | 'ready' | 'error' | 'timeout' | 'selecting_files'

export interface TorrentItem {
  id: string
  magnetLink: string
  hash: string
  filename: string
  downloadUrl: string | null
  status: TorrentStatus
  addedAt: number
  lastRetry: number
  retryCount: number
}

export interface Settings {
  apiToken: string | null
  maxListSize: number
  retryInterval: number
  maxRetryDuration: number
  contextMenuEnabled: boolean
  alwaysSaveAllFiles: boolean
  visibleTorrentsCount: number
}

// Real-Debrid API response types
export interface RdTorrentAddedResponse {
  id: string
  uri: string
}

export interface RdTorrentInfo {
  id: string
  filename: string
  hash: string
  status:
    | 'magnet_conversion'
    | 'waiting_files_selection'
    | 'downloading'
    | 'downloaded'
    | 'error'
    | 'dead'
  progress: number
  files?: Array<{
    id: number
    path: string
    bytes: number
    selected: number
  }>
  links?: string[]
}

// Store torrent info for file selection UI
export interface TorrentInfoCache {
  [torrentId: string]: RdTorrentInfo
}

export interface RdErrorResponse {
  error: string
  error_code?: number
}

export interface RdUnrestrictLinkResponse {
  id: string
  filename: string
  filesize: number
  link: string
  host: string
  chunks: number
  crc: number
  download: string
  streamable: number
}

// Conversion Dashboard Types

export interface TorrentProgress {
  progress: number // 0-100
  status: 'downloading' | 'uploading' | 'converting' | 'completed' | 'error' | 'paused'
  downloadSpeed?: number // bytes/sec
  uploadSpeed?: number // bytes/sec
  eta?: number // seconds
  seeds?: number
  peers?: number
}

export interface DownloadLink {
  url: string
  filename: string
  size?: number
  selected: boolean
}

export interface NotificationState {
  notifiedTorrentIds: string[]
  lastNotificationTime: number
}

export type DarkMode = 'light' | 'dark' | 'auto'

export interface DashboardSettings {
  darkMode: DarkMode
  notificationsEnabled: boolean
  autoRefresh: boolean
  refreshInterval: number
}

export interface ExtendedTorrentItem extends TorrentItem {
  progress?: TorrentProgress
  links?: DownloadLink[]
  addedAt: number
  lastUpdated: number
}
