import browser from 'webextension-polyfill';
import axios from 'axios';
import { storage } from '../utils/storage';
import type { TorrentItem, RdTorrentInfo } from '../utils/types';

const POLL_ALARM = 'poll-torrents';
const RD_API_BASE = 'https://api.real-debrid.com/rest/1.0';

// Constants
const DEFAULT_MAX_RETRY_DURATION = 300; // 5 minutes in seconds

// Setup alarm on install
browser.runtime.onInstalled.addListener(() => {
  browser.alarms.create(POLL_ALARM, {
    periodInMinutes: 0.5 // 30 seconds
  });
});

// Handle alarm for polling
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === POLL_ALARM) {
    await checkPendingTorrents();
  }
});

// Handle messages from popup
browser.runtime.onMessage.addListener(async (message: unknown) => {
  const msg = message as { type?: string; magnetLink?: string; torrentId?: string };

  if (msg.type === 'ADD_MAGNET') {
    return await handleAddMagnet(msg.magnetLink || '');
  } else if (msg.type === 'RETRY_TORRENT') {
    return await handleRetry(msg.torrentId || '');
  }
});

// Helper: Get auth headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const settings = await storage.getSettings();
  if (!settings.apiToken) throw new Error('NO_TOKEN');
  return {
    'Authorization': `Bearer ${settings.apiToken}`,
    'Content-Type': 'application/json'
  };
}

// Add magnet link
async function handleAddMagnet(magnetLink: string) {
  const settings = await storage.getSettings();
  if (!settings.apiToken) {
    return { error: 'API token not configured' };
  }

  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${RD_API_BASE}/torrents/addMagnet`, {
      magnet: magnetLink
    }, { headers });

    const torrent: TorrentItem = {
      id: response.data.id,
      magnetLink,
      filename: 'Processing...',
      downloadUrl: null,
      status: 'processing',
      addedAt: Date.now(),
      lastRetry: Date.now(),
      retryCount: 0
    };

    await storage.addTorrent(torrent);
    return { success: true, torrent };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage };
  }
}

// Retry torrent
async function handleRetry(torrentId: string) {
  const torrents = await storage.getTorrents();
  const torrent = torrents.find(t => t.id === torrentId);

  if (torrent) {
    torrent.status = 'processing';
    torrent.lastRetry = Date.now();
    torrent.retryCount += 1;
    await storage.saveTorrents(torrents);
  }

  return { success: true };
}

// Check pending torrents
async function checkPendingTorrents() {
  const settings = await storage.getSettings();
  if (!settings.apiToken) return;

  const torrents = await storage.getTorrents();
  const processingTorrents = torrents.filter(t => t.status === 'processing');

  if (processingTorrents.length === 0) return;

  const maxRetryDuration = settings.maxRetryDuration || DEFAULT_MAX_RETRY_DURATION;
  let hasChanges = false;

  for (const torrent of processingTorrents) {
    const elapsed = (Date.now() - torrent.addedAt) / 1000;

    // Check for timeout
    if (elapsed > maxRetryDuration) {
      torrent.status = 'timeout';
      hasChanges = true;
      continue;
    }

    try {
      const headers = await getAuthHeaders();
      const info = await axios.get<RdTorrentInfo>(`${RD_API_BASE}/torrents/info/${torrent.id}`, { headers });

      // Handle different statuses
      if (info.data.status === 'waiting_files_selection') {
        await axios.post(`${RD_API_BASE}/torrents/selectFiles/${torrent.id}`, {
          files: 'all'
        }, { headers });
        hasChanges = true;
      } else if (info.data.status === 'downloaded') {
        torrent.status = 'ready';
        torrent.filename = info.data.filename;
        torrent.downloadUrl = info.data.links?.[0] || null;
        hasChanges = true;
      } else if (info.data.status === 'error' || info.data.status === 'dead') {
        torrent.status = 'error';
        hasChanges = true;
      } else if (info.data.filename && torrent.filename === 'Processing...') {
        // Update filename when available
        torrent.filename = info.data.filename;
        hasChanges = true;
      }
    } catch (error) {
      console.error('Polling error for torrent', torrent.id, error);
      // Don't set error status on polling errors - keep trying
    }
  }

  if (hasChanges) {
    await storage.saveTorrents(torrents);
  }
}

// Re-create alarm on startup (in case it was cleared)
browser.alarms.get(POLL_ALARM).then((alarm) => {
  if (!alarm) {
    browser.alarms.create(POLL_ALARM, {
      periodInMinutes: 0.5
    });
  }
});

console.log('Real-Debrid Magnet Handler service worker loaded');
