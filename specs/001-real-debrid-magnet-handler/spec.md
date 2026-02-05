# Feature Specification: Real-Debrid Magnet Handler

**Feature Branch**: `001-real-debrid-magnet-handler`
**Created**: 2025-02-05
**Status**: Draft
**Input**: Firefox extension (Manifest V3) for converting magnet links to HTTP downloads via Real-Debrid API

## User Scenarios & Testing

### User Story 1 - Configure API Token (Priority: P1)

User opens extension settings and enters their Real-Debrid API token to enable functionality.

**Why this priority**: Required before any other functionality works - core authentication.

**Independent Test**: Settings page loads, accepts token, validates against Real-Debrid API, persists to storage.

**Acceptance Scenarios**:
1. Given no token configured, When user visits settings page, Then sees API token input field with link to Real-Debrid token page
2. Given valid token entered, When user saves, Then token persists to browser.storage.sync and success message displays
3. Given invalid token, When user saves, Then error message displays and token is not saved

### User Story 2 - Convert Magnet Link (Priority: P2)

User pastes a magnet link into the popup and receives HTTP download URLs after conversion completes.

**Why this priority**: Core value proposition - converts magnet links to downloadable HTTP URLs.

**Independent Test**: Popup loads, accepts magnet link, shows conversion progress, displays HTTP URL when ready.

**Acceptance Scenarios**:
1. Given valid magnet link pasted, When user clicks Convert, Then link submits to Real-Debrid API and status shows "processing"
2. Given processing torrent, When conversion completes, Then HTTP URL displays in list with filename
3. Given invalid magnet link format, When user submits, Then validation error displays

### User Story 3 - Retry Failed Conversions (Priority: P3)

User can manually retry torrent conversions that timed out or failed.

**Why this priority**: Handles edge cases where initial conversion fails - improves reliability.

**Independent Test**: Failed/timeout torrent shows retry button, clicking resumes polling.

**Acceptance Scenarios**:
1. Given torrent status "timeout", When user clicks Retry, Then status resets to "processing" and polling resumes
2. Given torrent status "error", When user clicks Retry, Then status resets to "processing" and polling resumes

### User Story 4 - Manage Torrent List (Priority: P4)

User can remove completed/failed torrents from the list and view up to configured limit.

**Why this priority**: UX improvement - keeps list manageable.

**Independent Test**: Remove button deletes item, list respects max size setting.

**Acceptance Scenarios**:
1. Given torrent in list, When user clicks remove (X), Then item deleted from storage and UI
2. Given list at max size, When new torrent added, Then oldest item removed (FIFO)

### Edge Cases

- What happens when API token expires while converting? → Show error, prompt user to update token
- What happens when magnet link is malformed? → Validation error before API call
- What happens when Real-Debrid API is down? → Show error, allow retry later
- What happens when popup closes during conversion? → Background service worker continues polling
- What happens when browser restarts? → Service worker resumes, state persisted in storage
- What happens when user has no API token and tries to convert? → Error message with link to settings

## Requirements

### Testing Requirements (New)

- **TR-001**: All utility functions MUST have unit tests with >80% code coverage
- **TR-002**: API client MUST have integration tests with mocked responses
- **TR-003**: React components MUST have tests for user interactions and state changes
- **TR-004**: Tests MUST run in CI/CD pipeline before merge
- **TR-005**: Linter (ESLint) MUST pass with zero errors
- **TR-006**: Formatter (Prettier) MUST apply consistent code style
- **TR-007**: TypeScript MUST compile with strict mode (no any types)

### Functional Requirements

- **FR-001**: Extension MUST accept Real-Debrid API token via settings page
- **FR-002**: Extension MUST validate API token by calling Real-Debrid /user endpoint on save
- **FR-003**: Extension MUST accept magnet links via popup input field
- **FR-004**: Extension MUST submit magnet links to Real-Debrid /torrents/addMagnet endpoint
- **FR-005**: Extension MUST poll /torrents/info/{id} every 30 seconds until conversion completes or 5-minute timeout
- **FR-006**: Extension MUST automatically call /torrents/selectFiles/{id} with "all" when status is "waiting_files_selection"
- **FR-007**: Extension MUST extract HTTP URLs from response when torrent status is "downloaded"
- **FR-008**: Extension MUST persist torrent state to browser.storage.local
- **FR-009**: Extension MUST use browser.alarms API for polling (MV3 requirement)
- **FR-010**: Extension MUST display torrent list with filename, HTTP URL, and status indicators
- **FR-011**: Extension MUST allow users to remove torrents from list
- **FR-012**: Extension MUST provide retry button for timeout/error states
- **FR-013**: Extension MUST enforce configurable max list size (default: 10, range: 5-50)
- **FR-014**: Extension MUST sync API token and settings via browser.storage.sync
- **FR-015**: Extension MUST handle 401 errors by prompting user to update token

### Key Entities

- **TorrentItem**: Represents a single torrent conversion with id, magnetLink, filename, downloadUrl, status, addedAt, lastRetry, retryCount
- **Settings**: Contains apiToken (string), maxListSize (number), retryInterval (number), maxRetryDuration (number)
- **TorrentStatus**: Enum of processing, ready, error, timeout

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can configure API token and receive confirmation within 5 seconds
- **SC-002**: Magnet link conversion completes and HTTP URL displays within 5 minutes (per Real-Debrid SLA)
- **SC-003**: Popup loads and displays current torrent list within 500ms
- **SC-004**: Background polling continues even when popup is closed
- **SC-005**: Extension passes Firefox AMO review guidelines (no unsafe eval, MV3 compliant)
- **SC-006**: All API errors (401, 503, 400) display user-friendly messages
- **SC-007**: List FIFO cleanup works correctly when max size exceeded
- **SC-008**: Unit test coverage >80% for utility functions
- **SC-009**: All tests pass locally and in CI
- **SC-010**: ESLint passes with zero errors
