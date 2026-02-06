# Firefox Real-Debrid Magnet Link Handler - Development Plan

## Project Overview

A Firefox extension (Manifest V3) that allows users to paste magnet links, convert them to HTTP download URLs via Real-Debrid API, and manage a persistent list of converted links with automatic retry logic.

---

## Technology Stack & Package Versions

### Core Build Tools
```json
{
  "vite": "^7.3.1",
  "@samrum/vite-plugin-web-extension": "^5.1.1",
  "web-ext": "^9.2.0",
  "webextension-polyfill": "^0.12.0"
}
```

### UI Framework & Styling
```json
{
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "@types/react": "^19.2.13",
  "@types/react-dom": "^19.2.3",
  "tailwindcss": "^4.1.18"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.9.3",
  "@types/webextension-polyfill": "^0.12.4",
  "eslint": "^9.39.2",
  "prettier": "^3.8.1"
}
```

### HTTP Client
```json
{
  "axios": "^1.13.4"
}
```

---

## Project Structure

```
firefox-realdebrid-addon/
├── src/
│   ├── manifest.json           # Extension manifest (MV3)
│   ├── popup/
│   │   ├── Popup.tsx          # Main popup component
│   │   ├── popup.html         # Popup HTML entry
│   │   └── popup.css          # Popup styles
│   ├── options/
│   │   ├── Options.tsx        # Settings page component
│   │   ├── options.html       # Options HTML entry
│   │   └── options.css        # Options styles
│   ├── background/
│   │   └── service-worker.ts  # Background service worker (MV3)
│   ├── utils/
│   │   ├── storage.ts         # Browser storage wrapper
│   │   ├── realdebrid-api.ts  # Real-Debrid API client
│   │   └── retry-logic.ts     # Retry mechanism
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── assets/
│       └── icons/             # Extension icons (16, 48, 128px)
├── dist/                       # Build output
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── web-ext-config.js
└── README.md
```

---

## Feature Requirements & Implementation Details

### 1. Popup View (Primary Interface)

**Trigger:** Click extension icon in toolbar

**Components:**
- **Magnet Link Input Field**
  - Text area/input for pasting magnet links
  - Submit button to process link
  - Loading state indicator during API call

- **Link List Display**
  - Shows filename + HTTP URL for each converted torrent
  - Scrollable container (displays 10 items, configurable)
  - Each item has:
    - Filename (from Real-Debrid response)
    - HTTP download URL (clickable/copyable)
    - Remove button (X icon)
    - Status indicator (processing/ready/error)

- **Retry Button**
  - Appears after 5-minute timeout if URL not ready
  - Triggers manual retry for failed conversions

**UI Layout:**
```
┌─────────────────────────────────┐
│  Real-Debrid Magnet Handler     │
├─────────────────────────────────┤
│  [Paste magnet link here...]    │
│  [Convert] [⚙️ Settings]         │
├─────────────────────────────────┤
│  📄 filename.mkv                 │
│     https://... [📋] [❌]        │
│  ⏳ processing.mp4               │
│     Waiting for conversion... [❌]│
│  📄 another.mkv                  │
│     https://... [📋] [❌]        │
│  ... (scroll for more)          │
└─────────────────────────────────┘
```

---

### 2. Settings Page

**Trigger:** Click settings icon/button in popup or `about:addons`

**Fields:**
- **API Token Input**
  - Secure text field (password type)
  - Validation on save (test API connection)
  - Instructions link to Real-Debrid token page
  
- **List Size Configuration**
  - Number input for max stored links (default: 10, range: 5-50)

- **Retry Settings (Optional)**
  - Retry interval (default: 30s)
  - Max retry duration (default: 5min)

**Storage:** Use `browser.storage.sync` for cross-device sync

---

### 3. Real-Debrid API Integration

**Base URL:** `https://api.real-debrid.com/rest/1.0/`

**Authentication:** 
- Header: `Authorization: Bearer YOUR_API_TOKEN`
- Store token in `browser.storage.sync.apiToken`

**API Workflow:**

#### Step 1: Add Magnet Link
```typescript
POST /torrents/addMagnet
Body: { magnet: "magnet:?xt=urn:..." }

Response: {
  id: "string",      // Torrent ID
  uri: "string"      // Resource URL
}
```

#### Step 2: Get Torrent Info (Polling)
```typescript
GET /torrents/info/{id}

Response: {
  id: "string",
  filename: "string",
  status: "magnet_conversion" | "waiting_files_selection" | "downloaded" | "error",
  files: [{ id: number, path: string, bytes: number, selected: 0|1 }],
  links: ["string"],  // HTTP URLs (only when status="downloaded")
  progress: number    // 0-100
}
```

#### Step 3: Select Files
```typescript
POST /torrents/selectFiles/{id}
Body: { files: "all" }  // Or comma-separated file IDs

Response: 204 No Content
```

#### Step 4: Get Download Links
- After `selectFiles`, poll `/torrents/info/{id}` until `status === "downloaded"`
- Extract URLs from `links` array
- Each link is a direct HTTP download URL

**Error Handling:**
- 401: Invalid/expired token → Prompt user to update settings
- 503: Service unavailable → Display error, allow retry
- 400: Bad magnet link → Display validation error

---

### 4. Retry Logic & State Management

**Implementation Strategy:**

```typescript
interface TorrentItem {
  id: string;               // Real-Debrid torrent ID
  magnetLink: string;       // Original magnet link
  filename: string;         // Extracted from API
  downloadUrl: string | null; // HTTP URL when ready
  status: 'processing' | 'ready' | 'error' | 'timeout';
  addedAt: number;          // Timestamp
  lastRetry: number;        // Last retry attempt
  retryCount: number;       // Number of retry attempts
}
```

**Polling Strategy:**
1. After submitting magnet, add item to list with `status: 'processing'`
2. Start background polling (every 30 seconds)
3. Check torrent status via `/torrents/info/{id}`
4. If `status === "waiting_files_selection"`:
   - Call `/torrents/selectFiles/{id}` with `files: "all"`
5. Continue polling until:
   - Success: `status === "downloaded"` → Extract URLs, update UI
   - Timeout: 5 minutes elapsed → Set `status: 'timeout'`, show retry button
   - Error: API error → Set `status: 'error'`, show retry button

**Retry Button Logic:**
- Resets `lastRetry` timestamp
- Resumes polling for that specific torrent
- Maximum 5 minutes of retry attempts per click

**Background Service Worker:**
- Use `browser.alarms` API for periodic checks (MV3 compatible)
- Persist state in `browser.storage.local`
- Message passing between service worker and popup

---

### 5. Storage Management

**Data Structure:**
```typescript
interface StorageSchema {
  apiToken: string;
  maxListSize: number;      // Default: 10
  torrents: TorrentItem[];  // Active/completed torrents
  settings: {
    retryInterval: number;  // Seconds, default: 30
    maxRetryDuration: number; // Seconds, default: 300 (5min)
  }
}
```

**Storage Strategy:**
- `browser.storage.sync`: API token, settings
- `browser.storage.local`: Torrent list (larger data)
- Automatic cleanup: Remove items exceeding `maxListSize` (FIFO)

---

## Development Workflow

### Phase 1: Project Initialization

```bash
# Initialize project with Vite plugin
npm init @samrum/vite-plugin-web-extension@latest

# Select options:
# - Manifest Version: 3
# - Framework: React
# - TypeScript: Yes

# Install additional dependencies
npm install axios webextension-polyfill tailwindcss
npm install -D @types/webextension-polyfill web-ext

# Initialize Tailwind CSS
npx tailwindcss init
```

### Phase 2: Manifest Configuration

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Real-Debrid Magnet Handler",
  "version": "1.0.0",
  "description": "Convert magnet links to HTTP downloads via Real-Debrid",
  "permissions": [
    "storage",
    "alarms"
  ],
  "host_permissions": [
    "https://api.real-debrid.com/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    }
  },
  "options_ui": {
    "page": "options/options.html",
    "open_in_tab": true
  },
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "icons": {
    "16": "assets/icons/icon-16.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  }
}
```

### Phase 3: API Client Implementation

**src/utils/realdebrid-api.ts:**
```typescript
import axios, { AxiosInstance } from 'axios';
import browser from 'webextension-polyfill';

class RealDebridAPI {
  private client: AxiosInstance;
  private baseURL = 'https://api.real-debrid.com/rest/1.0';

  constructor() {
    this.client = axios.create({ baseURL: this.baseURL });
  }

  async setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async addMagnet(magnetLink: string) {
    const response = await this.client.post('/torrents/addMagnet', {
      magnet: magnetLink
    });
    return response.data; // { id, uri }
  }

  async getTorrentInfo(torrentId: string) {
    const response = await this.client.get(`/torrents/info/${torrentId}`);
    return response.data;
  }

  async selectFiles(torrentId: string, fileIds: string = 'all') {
    await this.client.post(`/torrents/selectFiles/${torrentId}`, {
      files: fileIds
    });
  }

  async deleteTorrent(torrentId: string) {
    await this.client.delete(`/torrents/delete/${torrentId}`);
  }
}

export const rdAPI = new RealDebridAPI();
```

### Phase 4: Storage Utilities

**src/utils/storage.ts:**
```typescript
import browser from 'webextension-polyfill';
import { TorrentItem } from '../types';

export const storage = {
  async getApiToken(): Promise<string | null> {
    const result = await browser.storage.sync.get('apiToken');
    return result.apiToken || null;
  },

  async setApiToken(token: string): Promise<void> {
    await browser.storage.sync.set({ apiToken: token });
  },

  async getTorrents(): Promise<TorrentItem[]> {
    const result = await browser.storage.local.get('torrents');
    return result.torrents || [];
  },

  async saveTorrents(torrents: TorrentItem[]): Promise<void> {
    await browser.storage.local.set({ torrents });
  },

  async addTorrent(torrent: TorrentItem): Promise<void> {
    const torrents = await this.getTorrents();
    const maxSize = await this.getMaxListSize();
    
    torrents.unshift(torrent); // Add to beginning
    if (torrents.length > maxSize) {
      torrents.pop(); // Remove oldest
    }
    
    await this.saveTorrents(torrents);
  },

  async removeTorrent(torrentId: string): Promise<void> {
    const torrents = await this.getTorrents();
    const filtered = torrents.filter(t => t.id !== torrentId);
    await this.saveTorrents(filtered);
  },

  async getMaxListSize(): Promise<number> {
    const result = await browser.storage.sync.get('maxListSize');
    return result.maxListSize || 10;
  },

  async setMaxListSize(size: number): Promise<void> {
    await browser.storage.sync.set({ maxListSize: size });
  }
};
```

### Phase 5: Background Service Worker (Polling Logic)

**src/background/service-worker.ts:**
```typescript
import browser from 'webextension-polyfill';
import { rdAPI } from '../utils/realdebrid-api';
import { storage } from '../utils/storage';

const POLLING_INTERVAL = 30; // seconds
const MAX_RETRY_DURATION = 300; // 5 minutes in seconds

// Setup alarm for periodic checks
browser.alarms.create('pollTorrents', { periodInMinutes: 0.5 }); // Every 30s

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pollTorrents') {
    await checkPendingTorrents();
  }
});

async function checkPendingTorrents() {
  const token = await storage.getApiToken();
  if (!token) return;

  await rdAPI.setToken(token);
  const torrents = await storage.getTorrents();
  const processingTorrents = torrents.filter(t => t.status === 'processing');

  for (const torrent of processingTorrents) {
    const elapsed = (Date.now() - torrent.addedAt) / 1000;
    
    if (elapsed > MAX_RETRY_DURATION) {
      torrent.status = 'timeout';
      continue;
    }

    try {
      const info = await rdAPI.getTorrentInfo(torrent.id);
      
      if (info.status === 'waiting_files_selection') {
        await rdAPI.selectFiles(torrent.id);
      } else if (info.status === 'downloaded') {
        torrent.status = 'ready';
        torrent.filename = info.filename;
        torrent.downloadUrl = info.links[0]; // First link
      } else if (info.status === 'error' || info.status === 'dead') {
        torrent.status = 'error';
      }
    } catch (error) {
      console.error('Polling error:', error);
      torrent.status = 'error';
    }
  }

  await storage.saveTorrents(torrents);
}

// Listen for messages from popup
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'ADD_MAGNET') {
    return await handleAddMagnet(message.magnetLink);
  } else if (message.type === 'RETRY_TORRENT') {
    return await handleRetry(message.torrentId);
  }
});

async function handleAddMagnet(magnetLink: string) {
  const token = await storage.getApiToken();
  if (!token) {
    return { error: 'API token not configured' };
  }

  try {
    await rdAPI.setToken(token);
    const result = await rdAPI.addMagnet(magnetLink);
    
    const torrent: TorrentItem = {
      id: result.id,
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
    return { error: error.message };
  }
}

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
```

### Phase 6: Popup Component

**src/popup/Popup.tsx:**
```typescript
import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { storage } from '../utils/storage';
import { TorrentItem } from '../types';

export default function Popup() {
  const [magnetLink, setMagnetLink] = useState('');
  const [torrents, setTorrents] = useState<TorrentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTorrents();
    
    // Listen for storage changes
    const listener = (changes: any) => {
      if (changes.torrents) {
        setTorrents(changes.torrents.newValue || []);
      }
    };
    
    browser.storage.local.onChanged.addListener(listener);
    return () => browser.storage.local.onChanged.removeListener(listener);
  }, []);

  const loadTorrents = async () => {
    const data = await storage.getTorrents();
    setTorrents(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magnetLink.startsWith('magnet:')) {
      setError('Invalid magnet link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await browser.runtime.sendMessage({
        type: 'ADD_MAGNET',
        magnetLink
      });

      if (response.error) {
        setError(response.error);
      } else {
        setMagnetLink('');
        await loadTorrents();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (torrentId: string) => {
    await browser.runtime.sendMessage({
      type: 'RETRY_TORRENT',
      torrentId
    });
    await loadTorrents();
  };

  const handleRemove = async (torrentId: string) => {
    await storage.removeTorrent(torrentId);
    await loadTorrents();
  };

  return (
    <div className="w-96 p-4 bg-gray-50">
      <h1 className="text-xl font-bold mb-4">Real-Debrid Magnet Handler</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={magnetLink}
          onChange={(e) => setMagnetLink(e.target.value)}
          placeholder="Paste magnet link here..."
          className="w-full p-2 border rounded mb-2"
          disabled={loading}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
          <button
            type="button"
            onClick={() => browser.runtime.openOptionsPage()}
            className="p-2 bg-gray-200 rounded"
          >
            ⚙️
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {torrents.map((torrent) => (
          <div key={torrent.id} className="bg-white p-3 rounded shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-2">
                <div className="font-medium text-sm">{torrent.filename}</div>
                {torrent.status === 'ready' && torrent.downloadUrl && (
                  <a
                    href={torrent.downloadUrl}
                    target="_blank"
                    className="text-blue-500 text-xs truncate block"
                  >
                    {torrent.downloadUrl}
                  </a>
                )}
                {torrent.status === 'processing' && (
                  <div className="text-gray-500 text-xs">⏳ Converting...</div>
                )}
                {torrent.status === 'timeout' && (
                  <div className="text-orange-500 text-xs">
                    ⏱️ Timeout - 
                    <button
                      onClick={() => handleRetry(torrent.id)}
                      className="ml-1 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {torrent.status === 'error' && (
                  <div className="text-red-500 text-xs">❌ Error</div>
                )}
              </div>
              <button
                onClick={() => handleRemove(torrent.id)}
                className="text-red-500 hover:text-red-700"
              >
                ❌
              </button>
            </div>
          </div>
        ))}
        
        {torrents.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            No torrents yet. Paste a magnet link above!
          </div>
        )}
      </div>
    </div>
  );
}
```

### Phase 7: Options/Settings Page

**src/options/Options.tsx:**
```typescript
import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { rdAPI } from '../utils/realdebrid-api';

export default function Options() {
  const [apiToken, setApiToken] = useState('');
  const [maxListSize, setMaxListSize] = useState(10);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const token = await storage.getApiToken();
    const size = await storage.getMaxListSize();
    setApiToken(token || '');
    setMaxListSize(size);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Test API token
      await rdAPI.setToken(apiToken);
      await rdAPI.client.get('/user'); // Validation call
      
      await storage.setApiToken(apiToken);
      await storage.setMaxListSize(maxListSize);
      
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Real-Debrid API Token
          </label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your API token"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your token at:{' '}
            <a
              href="https://real-debrid.com/apitoken"
              target="_blank"
              className="text-blue-500 underline"
            >
              https://real-debrid.com/apitoken
            </a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Maximum List Size
          </label>
          <input
            type="number"
            value={maxListSize}
            onChange={(e) => setMaxListSize(parseInt(e.target.value))}
            min="5"
            max="50"
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of torrents to keep in the list (5-50)
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-500 text-white p-3 rounded disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {message && (
          <div
            className={`p-3 rounded ${
              message.startsWith('Error')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
```

---

## Build & Development Commands

### package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "web-ext run --source-dir ./dist",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,json}\"",
    "package": "web-ext build --source-dir ./dist --artifacts-dir ./packages"
  }
}
```

### Development Workflow
```bash
# Start development server with hot reload
npm run dev

# In separate terminal, run extension in Firefox
npm run preview

# Build for production
npm run build

# Package for distribution
npm run package
```

---

## Best Practices & Recommendations

### 1. Error Handling
- Implement comprehensive try-catch blocks around all API calls
- Show user-friendly error messages in the UI
- Log errors to console for debugging
- Handle network timeouts gracefully

### 2. Security
- Never hardcode API tokens
- Use `browser.storage.sync` for sensitive data (encrypted by browser)
- Validate all user inputs
- Use HTTPS for all API calls

### 3. Performance
- Debounce rapid storage writes
- Use `browser.alarms` instead of `setTimeout` (MV3 requirement)
- Lazy load torrent list items for large datasets
- Cache API responses when appropriate

### 4. UX Improvements
- Add loading skeletons during API calls
- Implement copy-to-clipboard for download URLs
- Show notifications for completed conversions
- Add keyboard shortcuts (optional)

### 5. Testing
- Test with various magnet link formats
- Test timeout scenarios
- Test with invalid API tokens
- Test list size limits
- Test across Firefox versions (latest 3 versions)

### 6. Accessibility
- Use semantic HTML
- Provide ARIA labels for icon buttons
- Ensure keyboard navigation works
- Maintain sufficient color contrast

---

## Context7 MCP Usage Instructions

### For Claude Code Development

When implementing this project, use Context7 MCP to fetch up-to-date documentation:

```bash
# Get latest Vite plugin documentation
@context7 fetch https://github.com/samrum/vite-plugin-web-extension

# Get WebExtension Polyfill docs
@context7 fetch https://github.com/mozilla/webextension-polyfill

# Get Real-Debrid API docs
@context7 fetch https://api.real-debrid.com

# Get React 19 documentation
@context7 fetch https://react.dev

# Get Tailwind CSS 4 docs
@context7 fetch https://tailwindcss.com/docs

# Get Firefox extension API docs
@context7 fetch https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API
```

### Key Documentation URLs
- **Vite Plugin:** https://github.com/samrum/vite-plugin-web-extension
- **WebExtension Polyfill:** https://github.com/mozilla/webextension-polyfill/blob/main/README.md
- **Real-Debrid API:** https://api.real-debrid.com
- **Firefox MV3 Guide:** https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/
- **Browser Storage API:** https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
- **Alarms API:** https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/alarms

---

## Implementation Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|---------------|
| **Setup** | Project init, dependencies, tooling | 2-3 hours |
| **API Client** | Real-Debrid integration, auth | 3-4 hours |
| **Storage** | Data persistence, state management | 2-3 hours |
| **Background Worker** | Polling logic, retry mechanism | 4-5 hours |
| **Popup UI** | Main interface, list display | 3-4 hours |
| **Settings UI** | Options page, validation | 2-3 hours |
| **Testing** | Manual testing, bug fixes | 3-4 hours |
| **Polish** | UI/UX improvements, error handling | 2-3 hours |
| **Total** | | **21-29 hours** |

---

## Common Gotchas & Solutions

### 1. Service Worker Lifecycle (MV3)
**Issue:** Service workers can be terminated by the browser  
**Solution:** Use `browser.alarms` for persistent timers, always load state from storage

### 2. CORS Issues
**Issue:** Direct API calls from content scripts may fail  
**Solution:** Make all API calls from background service worker

### 3. Storage Limits
**Issue:** `browser.storage.sync` has 100KB limit  
**Solution:** Store large data in `browser.storage.local`, only settings in sync

### 4. Promise Handling
**Issue:** Async operations in service worker  
**Solution:** Always use `async/await` and return promises from message handlers

### 5. React in Popup
**Issue:** Popup closes when losing focus  
**Solution:** Accept this behavior, ensure state persists via storage

---

## Additional Features (Future Enhancements)

- [ ] Context menu integration (right-click magnet links)
- [ ] Batch magnet link processing
- [ ] Download progress indicators
- [ ] Custom file selection before download
- [ ] Integration with download managers
- [ ] Dark mode support
- [ ] Export/import torrent list
- [ ] Search/filter in torrent list
- [ ] Notifications for completed downloads
- [ ] Multi-language support (i18n)

---

## Resources & References

### Official Documentation
- **Firefox Extension Workshop:** https://extensionworkshop.com
- **MDN Web Extensions:** https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
- **Real-Debrid API Docs:** https://api.real-debrid.com
- **Vite Documentation:** https://vitejs.dev

### Example Projects
- **Magnet-to-RD Userscript:** https://github.com/Pahiro/Magnet-to-RD
- **Vite WebExtension Template:** https://github.com/JohnBra/vite-web-extension
- **React+Vite Extension:** https://github.com/oviirup/vite-webext

### Community
- **Reddit r/RealDebrid:** https://reddit.com/r/RealDebrid
- **Firefox Extension Development:** https://discourse.mozilla.org/c/add-ons/35

---

## Success Criteria

✅ Extension loads and displays popup on toolbar click  
✅ User can configure API token in settings  
✅ Magnet links are successfully converted to HTTP URLs  
✅ Retry logic works after 5-minute timeout  
✅ List displays correct number of items with scrolling  
✅ Remove button successfully deletes items  
✅ Extension passes Firefox AMO review guidelines  
✅ All API errors are handled gracefully  
✅ UI is responsive and accessible  

---

## Final Notes for Claude Code

1. **Always use Context7 MCP** to fetch latest library documentation before implementing features
2. **Prioritize type safety** - Define TypeScript interfaces for all data structures
3. **Test incrementally** - Build and test each phase before moving to the next
4. **Follow MV3 patterns** - Use service workers correctly, avoid deprecated APIs
5. **Handle edge cases** - Empty states, network failures, invalid inputs
6. **Keep UI simple** - Focus on core functionality first, enhance later
7. **Document as you go** - Add JSDoc comments for complex functions

**Start with:** Phase 1 (Project Initialization) and work sequentially through phases.

