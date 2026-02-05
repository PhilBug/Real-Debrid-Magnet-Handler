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

## Phase 7: User Story 5 - Context Menu Integration (Priority: P5)

**Goal**: User can right-click magnet links to send to extension without manual copying

**Independent Test**: Right-click magnet link shows "Send to Real-Debrid Magnet Handler", clicking opens popup with magnet pre-filled

### Implementation for US5

- [ ] T050 [P] [US5] Add contextMenus permission to manifest permissions in vite.config.ts
- [ ] T051 [P] [US5] Create src/background/context-menu.ts module
- [ ] T052 [US5] Implement createContextMenu(): chrome.contextMenus.create with title "Send to {extension name}"
- [ ] T053 [US5] Implement context menu click listener: extract magnet link from info.linkUrl
- [ ] T054 [US5] On click: save magnet to browser.storage.local, open extension popup
- [ ] T055 [US5] Add "enable context menu" toggle to Options page in src/options/options.tsx
- [ ] T056 [US5] Store contextMenuEnabled setting in browser.storage.sync (add to Settings type in src/utils/types.ts)
- [ ] T057 [US5] Implement context menu create/remove based on setting in src/background/context-menu.ts
- [ ] T058 [US5] Update Popup to read pre-filled magnet from storage on mount in src/popup/Popup.tsx
- [ ] T059 [US5] Clear pre-filled magnet from storage after submission in src/popup/Popup.tsx
- [ ] T060 [US5] Initialize context menu on extension install in src/background/service-worker.ts

**Checkpoint**: US5 complete - context menu integration works

---

## Phase 8: User Story 6 - Multi-File Selection UI (Priority: P6)

**Goal**: User can select individual files from torrents, with option to "always save all files"

**Independent Test**: When torrent has multiple files, show file selection UI; "always save all" setting skips selection

### Implementation for US6

- [ ] T061 [P] [US6] Add alwaysSaveAllFiles: boolean to Settings interface in src/utils/types.ts
- [ ] T062 [P] [US6] Add "always save all files" checkbox to Options page in src/options/options.tsx
- [ ] T063 [US6] Store alwaysSaveAllFiles in browser.storage.sync via storage.saveSettings()
- [ ] T064 [US6] Update RealDebridAPI.getTorrentInfo() to return full files array in src/utils/realdebrid-api.ts
- [ ] T065 [P] [US6] Create src/popup/FileSelector.tsx component
- [ ] T066 [US6] Implement file list display with checkboxes (id, path, bytes, selected) in FileSelector
- [ ] T067 [US6] Implement file size formatter (bytes → KB/MB/GB) in FileSelector
- [ ] T068 [US6] Implement "Select All" / "Select None" buttons in FileSelector
- [ ] T069 [US6] Add "Confirm Selection" button in FileSelector
- [ ] T070 [US6] Integrate FileSelector into Popup when status="waiting_files_selection" in src/popup/Popup.tsx
- [ ] T071 [US6] On confirm: send SELECT_FILES message to service worker with comma-separated file IDs
- [ ] T072 [US6] Service worker: handle SELECT_FILES message, call rdAPI.selectFiles(id, files) in src/background/service-worker.ts
- [ ] T073 [US6] Service worker: check alwaysSaveAllFiles setting, auto-select "all" if true in src/background/service-worker.ts
- [ ] T074 [US6] Add "selecting_files" status to TorrentStatus enum in src/utils/types.ts
- [ ] T075 [US6] Update Popup to show file selection UI or auto-select message in src/popup/Popup.tsx

**Checkpoint**: US6 complete - multi-file selection with "always save all" option works

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: UX improvements, error handling, AMO compliance

- [ ] T076 [P] Add loading skeleton/status indicators during API calls
- [ ] T077 [P] Implement copy-to-clipboard button for download URLs
- [ ] T078 Add keyboard navigation support (Enter to submit, Escape to close)
- [ ] T079 Ensure all text is selectable and has sufficient color contrast
- [ ] T080 Add ARIA labels to icon-only buttons (settings, remove, retry)
- [ ] T081 Verify no unsafe-eval/dynamic code injection (MV3 compliance)
- [ ] T082 Add error boundaries for React components
- [ ] T083 Test extension loads and popup displays within 500ms (SC-003)
- [ ] T084 Verify background polling continues when popup closed (SC-004)
- [ ] T085 Run quickstart.md validation: load in Firefox, configure token, convert magnet
- [ ] T086 Run ESLint on all source files: `npm run lint`
- [ ] T087 Run Prettier check: `npm run format:check`
- [ ] T088 Run all tests: `npm test` - verify >80% coverage
- [ ] T089 Verify CI pipeline configuration for tests, lint, format

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3+ (User Stories) → Phase 9 (Polish)
                                         ↓
        ┌────────┬───────┴───────┬────────┬────────┬────────┐
        ↓        ↓               ↓        ↓        ↓        ↓
    Phase 3   Phase 4         Phase 5   Phase 6   Phase 7   Phase 8
    (US1-P1)  (US2-P2)        (US3-P3)  (US4-P4)  (US5-P5)  (US6-P6)
```

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational; US3-US4 depend on US2; US5-US6 are independent
- **Polish (Phase 9)**: Depends on desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent - only needs Foundational phase
- **US2 (P2)**: Independent - uses storage from Foundational, integrates with US1 settings but testable alone
- **US3 (P3)**: Depends on US2 (requires torrent items with status)
- **US4 (P4)**: Depends on US2 (requires torrent list display)
- **US5 (P5)**: Independent - context menu feature, no story dependencies (new feature)
- **US6 (P6)**: Extends US2 - integrates with conversion flow but independently testable (new feature)

### Critical Path (Sequential)

```
T001-T002 → T011-T012-T013 → T015-T022 (US1) → T023-T040 (US2) → T041-T045 (US3) → T046-T049 (US4)
                                                           ↓                      ↓
                                                      T050-T060 (US5)       T061-T075 (US6)
```

**New Features (User Requested)**:
- **US5 (Phase 7)**: Context menu when right-clicking magnet links - can proceed in parallel with US3-US4
- **US6 (Phase 8)**: Multi-file selection UI - extends US2 but can be developed independently

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
- US1, US2, US5, US6 could theoretically run in parallel (different files)
- US3 requires US2 complete
- US4 requires US2 complete
- US6 extends US2 but can be developed independently with mock data

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
| v1.3 | + US5 | Context menu for magnet links (NEW) |
| v1.4 | + US6 | Multi-file selection UI (NEW) |

### Recommended Sequence

1. **Phase 1 → Phase 2 → Phase 3 (US1)**: Validate settings work
2. **Phase 4 (US2)**: Core conversion functionality
3. **Phase 5 (US3)**: Retry reliability
4. **Phase 6 (US4)**: List management UX
5. **Phase 7 (US5)**: Context menu integration (NEW)
6. **Phase 8 (US6)**: Multi-file selection UI (NEW)
7. **Phase 9**: Polish and AMO submission prep

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 87 |
| **Setup Phase** | 10 |
| **Foundational Phase** | 6 |
| **US1 (P1)** | 8 |
| **US2 (P2)** | 18 |
| **US3 (P3)** | 5 |
| **US4 (P4)** | 4 |
| **US5 (P5)** | 11 (NEW) |
| **US6 (P6)** | 15 (NEW) |
| **Polish Phase** | 10 |
| **Parallelizable ([P])** | 23 |
| **Sequential** | 64 |

**MVP Tasks (Setup + Foundational + US1)**: 24 tasks
**Core Feature Tasks (Setup + Foundational + US1 + US2)**: 42 tasks
**Full Feature Tasks (All phases)**: 87 tasks

**New Features Added**:
- **US5 (11 tasks)**: Context menu integration with enable/disable setting
- **US6 (15 tasks)**: Multi-file selection UI with "always save all" setting
