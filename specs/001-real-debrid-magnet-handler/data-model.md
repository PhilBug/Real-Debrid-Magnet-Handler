# Data Model: Real-Debrid Magnet Handler

**Feature**: 001-real-debrid-magnet-handler
**Date**: 2025-02-05

---

## Core Entities

### TorrentItem

Represents a single torrent conversion tracked by the extension.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | string | Real-Debrid torrent ID | Required, from API |
| `magnetLink` | string | Original magnet link | Must start with `magnet:` |
| `filename` | string | Display filename | From API or "Processing..." |
| `downloadUrl` | string \| null | HTTP download URL | Null until status=ready |
| `status` | TorrentStatus | Current state | Required |
| `addedAt` | number | Timestamp (ms) | Required |
| `lastRetry` | number | Timestamp (ms) | Required |
| `retryCount` | number | Retry attempts | ≥ 0 |

### TorrentStatus (Enum)

| Value | Meaning |
|-------|---------|
| `processing` | Actively converting, polling in progress |
| `ready` | Conversion complete, HTTP URL available |
| `error` | API error, retry available |
| `timeout` | 5-minute timeout exceeded, retry available |

### Settings

Extension configuration stored in browser.storage.sync.

| Field | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `apiToken` | string \| null | null | - | Real-Debrid API token |
| `maxListSize` | number | 10 | 5-50 | Max torrents in list |
| `retryInterval` | number | 30 | 10-300 | Polling interval (seconds) |
| `maxRetryDuration` | number | 300 | 60-3600 | Max polling time (seconds) |

---

## State Transitions

```
[User submits magnet]
       ↓
   processing → [API poll every 30s]
       ↓           ↓
   downloaded   timeout/error
       ↓           ↓
      ready ← ← ← [User clicks retry]
```

### Transition Rules

| From | To | Trigger |
|------|-----|---------|
| - | processing | User submits magnet |
| processing | ready | API returns status=downloaded |
| processing | error | API returns error/dead |
| processing | timeout | elapsed > maxRetryDuration |
| error | processing | User clicks retry |
| timeout | processing | User clicks retry |

---

## Storage Schema

### browser.storage.sync
```typescript
interface SyncStorage {
  apiToken?: string;
  maxListSize?: number;
  retryInterval?: number;
  maxRetryDuration?: number;
}
```

### browser.storage.local
```typescript
interface LocalStorage {
  torrents?: TorrentItem[];
}
```

---

## API Response Mappings

### Real-Debrid → TorrentItem

```typescript
// POST /torrents/addMagnet response
{ id: string, uri: string }
→ TorrentItem.id, TorrentItem.magnetLink

// GET /torrents/info/{id} response
{
  id: string,
  filename: string,
  status: "magnet_conversion" | "waiting_files_selection" | "downloaded" | "error",
  links: string[]
}
→ TorrentItem.filename, TorrentItem.status (mapped), TorrentItem.downloadUrl
```

### Status Mapping

| Real-Debrid Status | TorrentStatus |
|-------------------|---------------|
| `magnet_conversion` | processing |
| `waiting_files_selection` | processing (auto-select files) |
| `downloaded` | ready |
| `error` | error |
| `dead` | error |

---

## Validation Rules

### Magnet Link
```typescript
const isValidMagnet = (link: string): boolean =>
  link.startsWith('magnet:?') && link.includes('xt=urn:btih:');
```

### API Token
```typescript
// Validated via GET /user endpoint
// 200 = valid, 401 = invalid
```

### List Size
```typescript
const MAX_LIST_SIZE = 50;
const MIN_LIST_SIZE = 5;

// Enforce FIFO when limit exceeded
if (torrents.length > maxListSize) {
  torrents = torrents.slice(0, maxListSize);
}
```
