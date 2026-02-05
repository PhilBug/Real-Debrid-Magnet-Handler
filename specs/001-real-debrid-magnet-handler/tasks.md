# Tasks: Real-Debrid Magnet Handler

**Input**: Design documents from `/specs/001-real-debrid-magnet-handler/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/realdebrid-api.yaml

**Tests**: Vitest unit tests, integration tests, component tests with @testing-library/react

**Organization**: Tasks grouped by user story for independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- File paths per plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and build configuration

- [ ] T001 Create directory structure: src/{popup,options,background,utils,assets/icons,styles}
- [ ] T002 Initialize Vite project with @samrum/vite-plugin-web-extension v5.1.1
- [ ] T003 [P] Install core dependencies: react@19, react-dom@19, axios@1.7, webextension-polyfill@0.12
- [ ] T004 [P] Install Tailwind CSS 4.0: tailwindcss@latest, @tailwindcss/vite@latest
- [ ] T005 [P] Install dev dependencies: typescript@5.7, @types/react@19, @types/react-dom@19, @types/webextension-polyfill, web-ext
- [ ] T006 Create tsconfig.json with strict mode and path aliases
- [ ] T007 [P] Create extension icons (16px, 48px, 128px) in src/assets/icons/
- [ ] T008 Configure vite.config.ts with webExtension and tailwindcss plugins
- [ ] T009 [P] Create src/styles/main.css with Tailwind @import and @theme
- [ ] T010 Create web-ext-config.js for Firefox development
- [ ] T010b Install testing stack: vitest, @vitest/ui, jsdom, @testing-library/react, @testing-library/jest-dom
- [ ] T010c Install linting: eslint, @typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y
- [ ] T010d Install formatting: prettier, eslint-config-prettier, eslint-plugin-prettier
- [ ] T010e Create vitest.config.ts with jsdom environment and test match patterns
- [ ] T010f Create .eslintrc.json with TypeScript and React rules
- [ ] T010g Create .prettierrc with project formatting rules
- [ ] T010h Add test script to package.json: "test": "vitest", "test:ui": "vitest --ui", "lint": "eslint src", "format": "prettier --write src"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and types required by ALL user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T011 Create src/utils/types.ts with TorrentStatus, TorrentItem, Settings interfaces
- [ ] T012 Create src/utils/storage.ts with getSettings, saveSettings, getTorrents, saveTorrents, addTorrent, removeTorrent
- [ ] T013 Create src/utils/realdebrid-api.ts with RealDebridAPI class (validateToken, addMagnet, getTorrentInfo, selectFiles)
- [ ] T014 Configure manifest in vite.config.ts with permissions (storage, alarms), host_permissions (api.real-debrid.com)

- [ ] T014b Create src/utils/__tests__/types.test.ts: type guard tests, enum validation tests
- [ ] T014c Create src/utils/__tests__/storage.test.ts: mock browser.storage, test getSettings/saveSettings/getTorrents/saveTorrents
- [ ] T014d Create src/utils/__tests__/realdebrid-api.test.ts: mocked axios, test validateToken/addMagnet/getTorrentInfo/selectFiles

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Configure API Token (Priority: P1) 🎯 MVP

**Goal**: User can save and validate Real-Debrid API token via settings page

**Independent Test**: Settings page loads, accepts token, validates against /user endpoint, persists to browser.storage.sync

### Implementation for US1

- [ ] T015 [P] Create src/options/options.html entry point
- [ ] T016 [P] Create src/options/options.tsx with React 19 component
- [ ] T017 [US1] Implement API token input field (password type) with link to https://real-debrid.com/apitoken
- [ ] T018 [US1] Implement maxListSize number input (5-50, default: 10)
- [ ] T019 [US1] Implement save button with loading state
- [ ] T020 [US1] Wire token validation via rdAPI.validateToken() on save
- [ ] T021 [US1] Display success/error messages based on validation result
- [ ] T022 [US1] Persist settings to browser.storage.sync via storage.saveSettings()

- [ ] T022b Create src/options/__tests__/options.test.tsx: component render test, token input test, save button test, validation mock

**Checkpoint**: US1 complete - token can be configured and validated

---

## Phase 4: User Story 2 - Convert Magnet Link (Priority: P2)

**Goal**: User submits magnet link, extension polls Real-Debrid API, displays HTTP URL when ready

**Independent Test**: Popup loads, accepts magnet link, shows "processing", displays HTTP URL when conversion completes

### Implementation for US2

- [ ] T023 [P] Create src/popup/popup.html entry point
- [ ] T024 [P] Create src/popup/Popup.tsx with React 19 component
- [ ] T025 [P] Create src/background/service-worker.ts with browser.alarms setup
- [ ] T026 [US2] Implement magnet link input field in popup
- [ ] T027 [US2] Implement Convert button with loading state
- [ ] T028 [US2] Add magnet link validation (must start with "magnet:?" and include "xt=urn:btih:")
- [ ] T029 [US2] On submit: call rdAPI.addMagnet() via chrome.runtime.sendMessage to service worker
- [ ] T030 [US2] Service worker: handle ADD_MAGNET message, create TorrentItem with status="processing", save via storage.addTorrent()
- [ ] T031 [US2] Service worker: create browser.alarms for 30-second polling (periodInMinutes: 0.5)
- [ ] T032 [US2] Service worker: implement onAlarm listener to check pending torrents
- [ ] T033 [US2] Polling logic: call rdAPI.getTorrentInfo() for each processing torrent
- [ ] T034 [US2] Auto-select files: when status="waiting_files_selection", call rdAPI.selectFiles(id, "all")
- [ ] T035 [US2] Status mapping: magnet_conversion→processing, waiting_files_selection→processing, downloaded→ready, error/dead→error
- [ ] T036 [US2] Timeout handling: if (Date.now() - addedAt) > maxRetryDuration, set status="timeout"
- [ ] T037 [US2] When ready: extract links[0] as downloadUrl, save TorrentItem
- [ ] T038 [US2] Popup: useSyncExternalStore to subscribe to browser.storage.local changes for torrents
- [ ] T039 [US2] Popup: render torrent list with filename, status icon, downloadUrl (when ready)
- [ ] T040 [US2] Popup: handle "no token configured" error with link to settings

- [ ] T040b Create src/popup/__tests__/Popup.test.tsx: component render test, magnet input test, convert button test, torrent list render test, status display test

**Checkpoint**: US2 complete - magnet links convert to HTTP URLs with background polling

---

## Phase 5: User Story 3 - Retry Failed Conversions (Priority: P3)

**Goal**: User can manually retry torrents that timed out or errored

**Independent Test**: Failed/timeout torrent shows retry button, clicking resets status to "processing" and resumes polling

### Implementation for US3

- [ ] T041 [US3] Add retry button UI to torrent items (shown when status="error" or "timeout")
- [ ] T042 [US3] On retry click: send RETRY_TORRENT message to service worker with torrentId
- [ ] T043 [US3] Service worker: handle RETRY_TORRENT message, reset status to "processing", update lastRetry, increment retryCount
- [ ] T044 [US3] Service worker: save updated TorrentItem to storage
- [ ] T045 [US3] Next alarm cycle: polling resumes for retried torrent

**Checkpoint**: US3 complete - failed conversions can be retried manually

---

## Phase 6: User Story 4 - Manage Torrent List (Priority: P4)

**Goal**: User can remove torrents from list; list respects max size with FIFO cleanup

**Independent Test**: Remove button deletes item; list at max size removes oldest when new torrent added

### Implementation for US4

- [ ] T046 [P] [US4] Add remove (X) button to each torrent item in popup
- [ ] T047 [US4] On remove click: call storage.removeTorrent(id)
- [ ] T048 [US4] Update popup UI via useSyncExternalStore to reflect removal
- [ ] T049 [US4] Verify storage.saveTorrents() enforces maxListSize with slice(0, maxListSize) FIFO

**Checkpoint**: US4 complete - torrent list is manageable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: UX improvements, error handling, AMO compliance

- [ ] T050 [P] Add loading skeleton/status indicators during API calls
- [ ] T051 [P] Implement copy-to-clipboard button for download URLs
- [ ] T052 Add keyboard navigation support (Enter to submit, Escape to close)
- [ ] T053 Ensure all text is selectable and has sufficient color contrast
- [ ] T054 Add ARIA labels to icon-only buttons (settings, remove, retry)
- [ ] T055 Verify no unsafe-eval/dynamic code injection (MV3 compliance)
- [ ] T056 Add error boundaries for React components
- [ ] T057 Test extension loads and popup displays within 500ms (SC-003)
- [ ] T058 Verify background polling continues when popup closed (SC-004)
- [ ] T059 Run quickstart.md validation: load in Firefox, configure token, convert magnet
- [ ] T060 Run ESLint on all source files: `npm run lint`
- [ ] T061 Run Prettier check: `npm run format:check`
- [ ] T062 Run all tests: `npm test` - verify >80% coverage
- [ ] T063 Verify CI pipeline configuration for tests, lint, format

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3+ (User Stories) → Phase 7 (Polish)
                                         ↓
                          ┌────────┬───────┴───────┬────────┐
                          ↓        ↓               ↓        ↓
                      Phase 3   Phase 4         Phase 5   Phase 6
                      (US1-P1)  (US2-P2)        (US3-P3)  (US4-P4)
```

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational; can run in parallel or sequentially
- **Polish (Phase 7)**: Depends on desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent - only needs Foundational phase
- **US2 (P2)**: Independent - uses storage from Foundational, integrates with US1 settings but testable alone
- **US3 (P3)**: Depends on US2 (requires torrent items with status)
- **US4 (P4)**: Depends on US2 (requires torrent list display)

### Critical Path (Sequential)

```
T001-T002 → T011-T012-T013 → T015-T022 (US1) → T023-T040 (US2) → T041-T045 (US3) → T046-T049 (US4)
```

### Parallel Opportunities

**Within Setup (Phase 1)**:
```bash
# Can run together:
T003, T004, T005  # Install dependencies
T007, T009        # Icons and CSS
```

**Within Foundational (Phase 2)**:
```bash
# T011, T012, T013 can run in parallel (different files)
```

**Within US2 (Phase 4)**:
```bash
# Can run together:
T023, T024, T025  # HTML, Popup, Service Worker files
```

**Cross-Story (after Foundational)**:
- US1, US2 could theoretically run in parallel (different files: options vs popup/background)
- US3 requires US2 complete
- US4 requires US2 complete

---

## Parallel Example: User Story 2 (Core Conversion)

```bash
# Create entry points together:
Task: "Create src/popup/popup.html entry point"
Task: "Create src/popup/Popup.tsx with React 19 component"
Task: "Create src/background/service-worker.ts with browser.alarms setup"

# Then implement features in popup (depends on Popup.tsx created):
Task: "Implement magnet link input field in popup"
Task: "Implement Convert button with loading state"
Task: "Add magnet link validation"
```

---

## Implementation Strategy

### MVP Scope (US1 Only - Token Configuration)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (T015-T022)
4. **STOP and VALIDATE**: Load extension, open settings, enter token, see validation
5. Result: Working settings page with API token management

### Full MVP (US1 + US2 - Core Functionality)

1. Complete MVP Scope (above)
2. Complete Phase 4: US2 (T023-T040)
3. **STOP and VALIDATE**: Paste magnet link, see conversion, get HTTP URL
4. Result: Fully functional magnet-to-HTTP converter

### Incremental Delivery

| Increment | Stories Added | Value Delivered |
|-----------|---------------|-----------------|
| MVP 1 | US1 only | Can configure API token |
| MVP 2 | US1 + US2 | Can convert magnet links to HTTP |
| v1.1 | + US3 | Can retry failed conversions |
| v1.2 | + US4 | Can manage torrent list |

### Recommended Sequence

1. **Phase 1 → Phase 2 → Phase 3 (US1)**: Validate settings work
2. **Phase 4 (US2)**: Core conversion functionality
3. **Phase 5 (US3)**: Retry reliability
4. **Phase 6 (US4)**: List management UX
5. **Phase 7**: Polish and AMO submission prep

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 59 |
| **Setup Phase** | 10 |
| **Foundational Phase** | 4 |
| **US1 (P1)** | 8 |
| **US2 (P2)** | 18 |
| **US3 (P3)** | 5 |
| **US4 (P4)** | 4 |
| **Polish Phase** | 10 |
| **Parallelizable ([P])** | 15 |
| **Sequential** | 44 |

**MVP Tasks (Setup + Foundational + US1)**: 22 tasks
**Full Feature Tasks (All phases)**: 59 tasks
