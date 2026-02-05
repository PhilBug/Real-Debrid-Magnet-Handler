# Real-Debrid Magnet Handler

## Purpose
Firefox MV3 extension that converts magnet links to HTTP download URLs via Real-Debrid API.

## Tech Stack (Planned)
- Build: Vite 5.4, @samrum/vite-plugin-web-extension 6.0
- UI: React 19, React DOM 19, Tailwind CSS 4.0
- Language: TypeScript 5.7
- HTTP: Axios 1.7
- Polyfill: webextension-polyfill 0.12
- Dev: ESLint 9, Prettier 3

## Current State
**GREENFIELD PROJECT** - No source code exists yet. Only planning documentation.

## Key Features
1. Popup UI for magnet input
2. Settings page (API token, list size)
3. Background service worker with polling
4. Retry logic (5min timeout)
5. Persistent storage (browser.storage)

## API Base
https://api.real-debrid.com/rest/1.0/

## References
- initial-plan.md - Comprehensive implementation plan
- specs/001-real-debrid-magnet-handler/plan.md - SpecKit template (unfilled)
