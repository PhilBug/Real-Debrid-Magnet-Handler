# Real-Debrid Magnet Handler

## Purpose
Firefox MV3 extension that converts magnet links to HTTP download URLs via Real-Debrid API.

## Tech Stack
- Build: Vite, @samrum/vite-plugin-web-extension
- UI: React 19, Tailwind CSS 4
- Language: TypeScript
- HTTP: Axios
- Polyfill: webextension-polyfill
- Test: Vitest, React Testing Library
- Dev: ESLint, Prettier, web-ext

## Current State
**ACTIVE DEVELOPMENT** - The project is fully initialized with a developed structure in `src/`.
Features implemented or heavily stubbed out include:
- Popup UI (`src/popup`)
- Options UI (`src/options`)
- Background service worker (`src/background`)
- Dashboard UI (`src/dashboard`)
- Reusable UI Components (`src/components/common`)
- Utils for RD API, storage, notifications (`src/utils`)
Extensive test coverage exists under `__tests__` directories.

## API Base
https://api.real-debrid.com/rest/1.0/

## References
- specs/001-real-debrid-magnet-handler/plan.md - SpecKit template
