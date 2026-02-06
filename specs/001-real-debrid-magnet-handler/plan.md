# Implementation Plan: Real-Debrid Magnet Handler

**Branch**: `001-real-debrid-magnet-handler` | **Date**: 2025-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-real-debrid-magnet-handler/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Firefox Manifest V3 extension that converts magnet links to HTTP download URLs via Real-Debrid API. Technical approach: React-based popup/options UI, background service worker for polling, browser.storage for persistence, axios for HTTP calls to Real-Debrid REST API.

## Technical Context

**Language/Version**: TypeScript 5.9
**Primary Dependencies**: React 19, Vite 7.3, @samrum/vite-plugin-web-extension 5.1, webextension-polyfill 0.12, axios 1.13, Tailwind CSS 4.1
**Storage**: browser.storage.sync (settings/token), browser.storage.local (torrent list)
**Testing**: Manual testing via web-ext; Jest/Vitest for unit tests (future)
**Target Platform**: Firefox 115+ (MV3 support)
**Project Type**: single (browser extension)
**Performance Goals**: Popup load <500ms, API polling every 30s, 5min conversion timeout
**Constraints**: MV3 compliance (no background pages, must use service worker), browser.storage.sync 100KB limit, popup lifecycle (closes on blur)
**Scale/Scope**: Single user, ~50 concurrent torrents max, 4 source files (popup, options, service-worker, utils)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**No constitution defined** - Template-only constitution.md, no gates to enforce.

## Project Structure

### Documentation (this feature)

```text
specs/001-real-debrid-magnet-handler/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── realdebrid-api.yaml
```

### Source Code (repository root)

```text
src/
├── manifest.json           # Extension manifest
├── popup/
│   ├── Popup.tsx          # Main popup component
│   ├── popup.html
│   └── popup.css
├── options/
│   ├── Options.tsx        # Settings page
│   ├── options.html
│   └── options.css
├── background/
│   └── service-worker.ts  # Background service worker (polling logic)
├── utils/
│   ├── storage.ts         # Browser storage wrapper
│   ├── realdebrid-api.ts  # Real-Debrid API client
│   └── types.ts           # TypeScript types
├── assets/
│   └── icons/             # Extension icons (16, 48, 128px)
└── styles/
    └── tailwind.css       # Tailwind imports

dist/                       # Build output
package.json
tsconfig.json
vite.config.ts
tailwind.config.js
web-ext-config.js
```

**Structure Decision**: Single-project browser extension structure. All source in `src/`, build output to `dist/`. Follows @samrum/vite-plugin-web-extension conventions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - no constitution defined.

---

## Phase 0: Research

**Status**: ✅ Complete

See [research.md](./research.md) for findings on:
- @samrum/vite-plugin-web-extension v5.1.1 (not v6)
- React 19 patterns: useSyncExternalStore, useEffectEvent
- Real-Debrid Bearer token auth + error handling
- browser.alarms for MV3 polling
- Tailwind CSS 4.0 Vite plugin with CSP

---

## Phase 1: Design Artifacts

**Status**: ✅ Complete

- [x] [data-model.md](./data-model.md) - TorrentItem, Settings, state transitions
- [x] [contracts/realdebrid-api.yaml](./contracts/realdebrid-api.yaml) - OpenAPI spec
- [x] [quickstart.md](./quickstart.md) - Setup guide with code examples
- [x] Agent context update (CLAUDE.md modified)

---

## Phase 2: Task Breakdown

**Status**: ✅ Complete

See [tasks.md](./tasks.md) for detailed implementation tasks.

**Summary**:
- 59 total tasks across 7 phases
- 4 user stories (US1-US4) organized by priority P1-P4
- MVP scope: 22 tasks (Setup + Foundational + US1)
- Full feature: 59 tasks (all phases)
