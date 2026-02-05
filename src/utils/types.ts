export type TorrentStatus = 'processing' | 'ready' | 'error' | 'timeout';

export interface TorrentItem {
  id: string;
  magnetLink: string;
  filename: string;
  downloadUrl: string | null;
  status: TorrentStatus;
  addedAt: number;
  lastRetry: number;
  retryCount: number;
}

export interface Settings {
  apiToken: string | null;
  maxListSize: number;
  retryInterval: number;
  maxRetryDuration: number;
}

// Real-Debrid API response types
export interface RdTorrentAddedResponse {
  id: string;
  uri: string;
}

export interface RdTorrentInfo {
  id: string;
  filename: string;
  status: 'magnet_conversion' | 'waiting_files_selection' | 'downloading' | 'downloaded' | 'error' | 'dead';
  progress: number;
  files?: Array<{
    id: number;
    path: string;
    bytes: number;
    selected: number;
  }>;
  links?: string[];
}

export interface RdErrorResponse {
  error: string;
  error_code?: number;
}
