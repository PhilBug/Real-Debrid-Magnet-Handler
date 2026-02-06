# Quickstart: Real-Debrid Magnet Handler

**Feature**: 001-real-debrid-magnet-handler
**Date**: 2025-02-05

---

## Initial Project Setup

```bash
# Navigate to project root
cd /home/philbug/git/Real-Debrid-Magnet-Handler

# Initialize Vite project with web extension plugin
npm init @samrum/vite-plugin-web-extension@latest

# Select options when prompted:
# - Manifest Version: 3
# - Framework: React
# - TypeScript: Yes
# - Package manager: npm (or your preference)
```

---

## Install Dependencies

```bash
# Core dependencies (if not already installed)
npm install axios webextension-polyfill

# Tailwind CSS 4.0
npm install tailwindcss@latest @tailwindcss/vite@latest

# Dev dependencies
npm install -D @types/webextension-polyfill web-ext
```

---

## Create Directory Structure

```bash
mkdir -p src/{popup,options,background,utils,assets/icons}
```

---

## Key Files to Create

### 1. `src/utils/types.ts`
```typescript
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
```

### 2. `src/utils/storage.ts`
```typescript
import browser from 'webextension-polyfill';
import { TorrentItem, Settings } from './types';

export const storage = {
  // Sync storage (settings)
  async getSettings(): Promise<Settings> {
    const result = await browser.storage.sync.get({
      apiToken: null,
      maxListSize: 10,
      retryInterval: 30,
      maxRetryDuration: 300
    });
    return result as Settings;
  },

  async saveSettings(settings: Partial<Settings>): Promise<void> {
    await browser.storage.sync.set(settings);
  },

  // Local storage (torrents)
  async getTorrents(): Promise<TorrentItem[]> {
    const result = await browser.storage.local.get('torrents');
    return result.torrents || [];
  },

  async saveTorrents(torrents: TorrentItem[]): Promise<void> {
    const settings = await this.getSettings();
    const trimmed = torrents.slice(0, settings.maxListSize);
    await browser.storage.local.set({ torrents: trimmed });
  },

  async addTorrent(torrent: TorrentItem): Promise<void> {
    const torrents = await this.getTorrents();
    torrents.unshift(torrent);
    await this.saveTorrents(torrents);
  },

  async removeTorrent(id: string): Promise<void> {
    const torrents = await this.getTorrents();
    const filtered = torrents.filter(t => t.id !== id);
    await browser.storage.local.set({ torrents: filtered });
  }
};
```

### 3. `src/utils/realdebrid-api.ts`
```typescript
import axios, { AxiosInstance } from 'axios';
import { storage } from './storage';

class RealDebridAPI {
  private client: AxiosInstance;
  private baseURL = 'https://api.real-debrid.com/rest/1.0';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async ensureAuth(): Promise<void> {
    const settings = await storage.getSettings();
    if (!settings.apiToken) throw new Error('NO_TOKEN');
    this.client.defaults.headers.common['Authorization'] = `Bearer ${settings.apiToken}`;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await axios.get(`${this.baseURL}/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return true;
    } catch {
      return false;
    }
  }

  async addMagnet(magnetLink: string) {
    await this.ensureAuth();
    const response = await this.client.post('/torrents/addMagnet', {
      magnet: magnetLink
    });
    return response.data;
  }

  async getTorrentInfo(torrentId: string) {
    await this.ensureAuth();
    const response = await this.client.get(`/torrents/info/${torrentId}`);
    return response.data;
  }

  async selectFiles(torrentId: string, files = 'all') {
    await this.ensureAuth();
    await this.client.post(`/torrents/selectFiles/${torrentId}`, { files });
  }
}

export const rdAPI = new RealDebridAPI();
```

---

## Configure Tailwind CSS

### `src/styles/main.css`
```css
@import "tailwindcss";

@theme {
  --color-primary-500: oklch(0.6 0.2 250);
  --color-primary-600: oklch(0.55 0.22 250);
  --font-sans: "Inter", system-ui, sans-serif;
}
```

### `vite.config.ts`
```typescript
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import webExtension from "@samrum/vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    tailwindcss(),
    webExtension({
      manifest: {
        manifest_version: 3,
        name: "Real-Debrid Magnet Handler",
        version: "1.0.0",
        permissions: ["storage", "alarms"],
        host_permissions: ["https://api.real-debrid.com/*"],
        action: {
          default_popup: "src/popup/popup.html",
          default_icon: {
            "16": "src/assets/icons/icon-16.png",
            "48": "src/assets/icons/icon-48.png",
            "128": "src/assets/icons/icon-128.png"
          }
        },
        options_ui: {
          page: "src/options/options.html",
          open_in_tab: false
        },
        background: {
          service_worker: "src/background/service-worker.ts",
          type: "module"
        },
        icons: {
          "16": "src/assets/icons/icon-16.png",
          "48": "src/assets/icons/icon-48.png",
          "128": "src/assets/icons/icon-128.png"
        }
      }
    })
  ]
});
```

---

## Development Commands

```bash
# Development with hot reload
npm run dev

# In separate terminal: run in Firefox
npm run preview

# Type check
npm run lint

# Build for production
npm run build

# Package extension
npm run package
```

---

## Extension Icons

Create placeholder icons or use a tool to generate:

```bash
# Using ImageMagick (convert icon.svg to png)
convert -size 128x128 xc:blue -fill white -gravity center -pointsize 48 -annotate 0 "RD" src/assets/icons/icon-128.png
convert src/assets/icons/icon-128.png -resize 48x48 src/assets/icons/icon-48.png
convert src/assets/icons/icon-128.png -resize 16x16 src/assets/icons/icon-16.png
```

---

## Getting API Token

1. Visit https://real-debrid.com/apitoken
2. Login to Real-Debrid account
3. Copy the API token
4. In extension, go to Settings (gear icon)
5. Paste token and Save

---

## Manual Testing Flow

1. **Load extension in Firefox**
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file from the extension

2. **Configure API token**
   - Click extension icon → Gear icon
   - Paste token → Save

3. **Test magnet conversion**
   - Paste a magnet link (e.g., from a legal torrent site)
   - Click Convert
   - Wait for status to change to "ready"
   - Click HTTP URL to download

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `browser` is not defined | Import `webextension-polyfill` as `browser` |
| Service worker not polling | Check `alarms` permission in manifest |
| CSS not loading | Ensure Tailwind CSS imported in entry files |
| HMR not working | Restart dev server, check console for errors |
| 401 errors | Re-enter API token in settings |
