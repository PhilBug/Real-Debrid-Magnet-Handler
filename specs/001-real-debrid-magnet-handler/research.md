# Research: Real-Debrid Magnet Handler

**Feature**: 001-real-debrid-magnet-handler
**Date**: 2025-02-05

---

## 1. Build Tool: @samrum/vite-plugin-web-extension

### Decision: Use v5.1.1 (latest, not v6)

**Rationale**:
- Full MV3 support with auto-generated manifest.json
- HMR for popup/options/content scripts
- Handles TypeScript → JS conversion automatically
- Active maintenance, proven in production

**Key Configuration**:
```typescript
// vite.config.ts
import webExtension from "@samrum/vite-plugin-web-extension";

webExtension({
  manifest: {
    manifest_version: 3,
    background: {
      service_worker: "./src/background/service-worker.ts"
    },
    action: {
      default_popup: "./src/popup/popup.html"
    },
    options_page: "./src/options/options.html"
  }
})
```

**Firefox MV3**: Requires `background: { script: ... }` not `service_worker` for full support.

---

## 2. React 19 + Extension Patterns

### Decision: useSyncExternalStore + useEffectEvent

**Rationale**:
- `useSyncExternalStore` prevents tearing with storage events
- `useEffectEvent` solves stale closures in message handlers
- Popup unmounts on blur (not hidden) - must persist to storage

**Key Patterns**:

```typescript
// Storage sync hook
function useExtensionState<T>(key: string, initialValue: T) {
  const cache: Record<string, any> = {};

  const state = useSyncExternalStore(
    (callback) => {
      const listener = (changes: any, area: string) => {
        if (area === 'local' && changes[key]) {
          cache[key] = changes[key].newValue;
          callback();
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    },
    () => cache[key] ?? initialValue
  );

  const setState = useCallback((value: T | ((prev: T) => T)) => {
    const newValue = value instanceof Function ? value(state) : value;
    cache[key] = newValue;
    chrome.storage.local.set({ [key]: newValue });
  }, [key, state]);

  return [state, setState] as const;
}

// Message passing with useEffectEvent
const handleMessage = useEffectEvent((response: any) => {
  // Always sees latest state
});

useEffect(() => {
  chrome.runtime.sendMessage({ type: 'GET_DATA' }, handleMessage);
}, []); // No deps needed
```

**Gotcha**: `getSnapshot` must be sync - maintain in-memory cache alongside async storage API.

---

## 3. Real-Debrid API Authentication

### Decision: Bearer token + chrome.storage.local

**Rationale**:
- No OAuth for extensions - simple Bearer token from https://real-debrid.com/apitoken
- Token persists unless password changed or regenerated
- Validate via `GET /user` endpoint (401 = invalid)

**Error Handling**:
| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad request | Fix params |
| 401 | Invalid token | Prompt re-entry |
| 403 | Account locked/not premium | Check account |
| 429 | Rate limit (250/min) | Exponential backoff |
| 503 | Service unavailable | Retry with backoff |

**Token Storage Pattern**:
```typescript
async function rdRequest(endpoint: string, options = {}) {
  const token = await getToken();
  if (!token) throw new Error('NO_TOKEN');

  const response = await fetch(`https://api.real-debrid.com/rest/1.0${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (response.status === 401) {
    await clearToken();
    throw new Error('TOKEN_EXPIRED');
  }

  if (response.status === 429) {
    await new Promise(r => setTimeout(r, 1000));
    return rdRequest(endpoint, options); // Retry once
  }

  return response;
}
```

---

## 4. Polling: browser.alarms vs setInterval

### Decision: browser.alarms API (MV3 requirement)

**Rationale**:
- Service workers terminate after ~30s inactivity
- `setTimeout/setInterval` cancelled when worker dies
- Alarms persist across service worker restarts
- Workers wake when alarm fires

**Implementation**:
```typescript
const POLL_ALARM = 'poll-torrents';

// Create alarm on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(POLL_ALARM, {
    periodInMinutes: 0.5  // 30 seconds minimum
  });
});

// Handle alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === POLL_ALARM) {
    await checkPendingTorrents();
  }
});

// Message passing: alarm → popup
async function checkPendingTorrents() {
  const data = await fetchStatus();

  // Notify popup if open (silently fails if closed)
  chrome.runtime.sendMessage({
    type: 'STATUS_UPDATE',
    data
  }).catch(() => {}); // Popup not open, ignore
}
```

**Best Practices**:
- Always load state from storage on worker startup
- Keep listeners at top-level (unconditional)
- Handle popup closed errors gracefully

---

## 5. Tailwind CSS 4.0 in Extensions

### Decision: @tailwindcss/vite plugin with CSP-compliant setup

**Rationale**:
- First-party Vite plugin, 100x faster with Oxide engine
- Build-time CSS generation = CSP-compliant by default
- No `tailwind.config.js` - use `@theme` directive in CSS
- Automatic content scanning (no PurgeCSS config)

**Configuration**:
```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import webExtension from "@samrum/vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    tailwindcss(),
    webExtension({ manifest: ... })
  ]
});
```

```css
/* src/styles/main.css */
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.11 178);
  --font-display: "Inter", "sans-serif";
}
```

**CSP Manifest**:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; style-src 'self'"
  }
}
```

**No `unsafe-inline` needed** - all CSS generated as external files.

---

## 6. Combined Tech Stack

| Component | Choice | Version |
|-----------|--------|---------|
| Build | Vite | ^7.3.1 |
| Plugin | @samrum/vite-plugin-web-extension | ^5.1.1 |
| Plugin | @tailwindcss/vite | ^4.1.18 |
| Framework | React | ^19.2.4 |
| Language | TypeScript | ^5.9.3 |
| Storage | browser.storage.local + sync | - |
| HTTP | axios | ^1.13.4 |
| Polyfill | webextension-polyfill | ^0.12.0 |

---

## Sources

- [@samrum/vite-plugin-web-extension GitHub](https://github.com/samrum/vite-plugin-web-extension)
- [React 19 useSyncExternalStore docs](https://react.dev/reference/react/useSyncExternalStore)
- [React useEffectEvent guide - LogRocket](https://blog.logrocket.com/react-useeffectevent)
- [Real-Debrid API Documentation](https://api.real-debrid.com/)
- [MDN alarms API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/alarms)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [vite-web-extension template](https://github.com/JohnBra/vite-web-extension)
