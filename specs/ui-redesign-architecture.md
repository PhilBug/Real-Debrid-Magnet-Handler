# UI Redesign Architecture: Real-Debrid Magnet Handler

## Executive Summary

This document defines a comprehensive UI architecture for redesigning the Real-Debrid Magnet Handler Firefox WebExtension. The design moves away from the current generic "browser extension" aesthetic toward a distinctive **Industrial Terminal** aesthetic that reflects the technical nature of the tool while providing a memorable, cohesive user experience.

---

## 1. Design Philosophy

### 1.1 Aesthetic Direction: Industrial Terminal

**Rationale:**
The Real-Debrid Magnet Handler is a utility tool for technical users who manage torrent downloads. The chosen aesthetic of **Industrial Terminal** combines:

- **Utilitarian clarity** - Information-dense but organized, respecting user efficiency
- **Terminal inspiration** - Monospace typography, command-prompt metaphors, and a color palette reminiscent of developer tools
- **Industrial precision** - Sharp edges, consistent grid alignment, and purposeful visual hierarchy

This direction stands apart from typical browser extensions by embracing the technical nature of the tool rather than hiding it behind consumer-friendly aesthetics.

### 1.2 Core Design Principles

1. **Information Density with Clarity** - Users should see torrent status at a glance without visual noise
2. **Consistent Visual Language** - Every element shares the same design DNA across all three UI surfaces
3. **Purposeful Motion** - Animations communicate state changes, not decoration
4. **Respectful of Focus** - Dark mode by default, high contrast for critical actions
5. **Terminal-Inspired Efficiency** - Keyboard-friendly, command-prompt input styling

### 1.3 Memorable Differentiator

**The Command Prompt Input Field**

The magnet input field will feature a distinctive `rd://` prompt prefix, styled like a terminal command line. This immediately communicates:
- The tool's purpose (Real-Debrid)
- The technical nature of the operation
- A memorable visual hook users will associate with the extension

Example: `rd:// paste_magnet_here...`

---

## 2. Design Token System

### 2.1 Color Palette

#### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface-primary` | `#FAFBFC` | Main background |
| `--color-surface-secondary` | `#FFFFFF` | Cards, elevated surfaces |
| `--color-surface-tertiary` | `#F0F2F5` | Input backgrounds, hover states |
| `--color-surface-elevated` | `#FFFFFF` | Modals, dropdowns |
| `--color-text-primary` | `#1A1D21` | Main text, headings |
| `--color-text-secondary` | `#5C6370` | Secondary text, descriptions |
| `--color-text-tertiary` | `#9DA5B4` | Placeholders, disabled text |
| `--color-text-inverse` | `#FFFFFF` | Text on primary colors |
| `--color-border-default` | `#E1E4E8` | Default borders |
| `--color-border-hover` | `#C9CDD4` | Hover border states |
| `--color-border-focus` | `#00D9FF` | Focus rings |
| `--color-accent-primary` | `#00D9FF` | Primary accent (cyan) |
| `--color-accent-primary-hover` | `#00B8D9` | Primary accent hover |
| `--color-accent-secondary` | `#7C3AED` | Secondary accent (purple) |
| `--color-status-success` | `#10B981` | Success states |
| `--color-status-warning` | `#F59E0B` | Warning states |
| `--color-status-error` | `#EF4444` | Error states |
| `--color-status-info` | `#3B82F6` | Info states |
| `--color-status-processing` | `#00D9FF` | Processing/active states |

#### Dark Mode (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface-primary` | `#0D1117` | Main background |
| `--color-surface-secondary` | `#161B22` | Cards, elevated surfaces |
| `--color-surface-tertiary` | `#21262D` | Input backgrounds, hover states |
| `--color-surface-elevated` | `#1C2128` | Modals, dropdowns |
| `--color-text-primary` | `#E6EDF3` | Main text, headings |
| `--color-text-secondary` | `#8B949E` | Secondary text, descriptions |
| `--color-text-tertiary` | `#6E7681` | Placeholders, disabled text |
| `--color-text-inverse` | `#0D1117` | Text on primary colors |
| `--color-border-default` | `#30363D` | Default borders |
| `--color-border-hover` | `#484F58` | Hover border states |
| `--color-border-focus` | `#00D9FF` | Focus rings |
| `--color-accent-primary` | `#00D9FF` | Primary accent (cyan) |
| `--color-accent-primary-hover` | `#39E5FF` | Primary accent hover |
| `--color-accent-secondary` | `#A78BFA` | Secondary accent (purple) |
| `--color-status-success` | `#3FB950` | Success states |
| `--color-status-warning` | `#D29922` | Warning states |
| `--color-status-error` | `#F85149` | Error states |
| `--color-status-info` | `#58A6FF` | Info states |
| `--color-status-processing` | `#00D9FF` | Processing/active states |

#### Progress Bar Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-progress-downloading` | `#00D9FF` | `#00D9FF` | Download progress |
| `--color-progress-uploading` | `#A78BFA` | `#A78BFA` | Upload/seeding |
| `--color-progress-converting` | `#D29922` | `#D29922` | Conversion in progress |
| `--color-progress-completed` | `#10B981` | `#3FB950` | Completed |
| `--color-progress-error` | `#EF4444` | `#F85149` | Error state |
| `--color-progress-paused` | `#9DA5B4` | `#6E7681` | Paused/idle |

### 2.2 Typography Scale

#### Font Families

```css
/* Display/Heading Font - JetBrains Mono */
--font-display: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;

/* Body Font - DM Sans */
--font-body: 'DM Sans', 'Inter Var', -apple-system, sans-serif;

/* Monospace for data - JetBrains Mono */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Rationale:**
- **JetBrains Mono** is a developer-focused monospace font designed for readability. It brings the terminal aesthetic while remaining highly legible at small sizes.
- **DM Sans** provides a clean, geometric sans-serif that complements the monospace display font without competing for attention.

#### Type Scale

| Token | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| `--text-xs` | 11px | 1.4 | 0.02em | 400 | Tiny labels, timestamps |
| `--text-sm` | 13px | 1.5 | 0.01em | 400 | Body small, descriptions |
| `--text-base` | 15px | 1.6 | 0 | 400 | Body text |
| `--text-lg` | 18px | 1.5 | 0 | 500 | Emphasized text |
| `--text-xl` | 22px | 1.4 | -0.01em | 600 | Card titles |
| `--text-2xl` | 28px | 1.3 | -0.02em | 700 | Section headers |
| `--text-3xl` | 36px | 1.2 | -0.02em | 700 | Page titles |
| `--text-display` | 48px | 1.1 | -0.03em | 800 | Hero/display |

#### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### 2.3 Spacing Scale

Based on a 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0 | No spacing |
| `--space-1` | 4px | Tight spacing, inline elements |
| `--space-2` | 8px | Small gaps, icon spacing |
| `--space-3` | 12px | Default gap, list items |
| `--space-4` | 16px | Component padding |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Major section gaps |
| `--space-10` | 40px | Large separations |
| `--space-12` | 48px | Page section gaps |
| `--space-16` | 64px | Major layout gaps |

### 2.4 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0 | Sharp corners (terminal aesthetic) |
| `--radius-sm` | 3px | Small elements, badges |
| `--radius-md` | 6px | Buttons, inputs |
| `--radius-lg` | 10px | Cards, panels |
| `--radius-xl` | 16px | Large containers |
| `--radius-full` | 9999px | Pills, avatars |

**Design Note:** The Industrial Terminal aesthetic favors sharper corners. Use `--radius-sm` and `--radius-md` primarily, with `--radius-lg` only for major containers.

### 2.5 Shadow Depth Scale

#### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle lift |
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.06)` | Cards, dropdowns |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Elevated cards |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Modals |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.16)` | Major modals |
| `--shadow-glow` | `0 0 20px rgba(0,217,255,0.3)` | Focus glow, accent |

#### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.2)` | Subtle lift |
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.3)` | Cards, dropdowns |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Elevated cards |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Modals |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.6)` | Major modals |
| `--shadow-glow` | `0 0 20px rgba(0,217,255,0.4)` | Focus glow, accent |

### 2.6 Animation/Transition Timing

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 50ms | Immediate feedback |
| `--duration-fast` | 150ms | Hover states, toggles |
| `--duration-normal` | 250ms | Standard transitions |
| `--duration-slow` | 400ms | Complex animations |
| `--duration-slower` | 600ms | Page transitions |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Enter animations |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit animations |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions |

---

## 3. Component Architecture

### 3.1 Component Structure

```
src/components/
  common/           # Shared across all surfaces
    Button/
    Input/
    Badge/
    Icon/
    Card/
    Modal/
    Toast/
    ProgressBar/
    Spinner/
    Skeleton/
  layout/           # Layout components
    Header/
    Footer/
    Container/
    Stack/
    Grid/
  features/         # Feature-specific components
    MagnetInput/    # Command-prompt style input
    TorrentCard/
    TorrentList/
    FileSelector/
    BatchControls/
    StatusIndicator/
    DarkModeToggle/
    NotificationToggle/
```

### 3.2 Component Specifications

#### Button Component

**Variants:**
- `primary` - Filled with accent color, for main actions
- `secondary` - Outlined, for secondary actions
- `ghost` - No border/background, for subtle actions
- `danger` - Red accent, for destructive actions

**Sizes:**
- `sm` - 28px height, compact text
- `md` - 36px height, default
- `lg` - 44px height, prominent actions

**States:**
- Default, Hover, Active, Focus, Disabled, Loading

```css
/* Button Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-default);
  cursor: pointer;
  border: 1px solid transparent;
}

.btn:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

/* Primary Button */
.btn-primary {
  background: var(--color-accent-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-accent-primary);
}

.btn-primary:hover {
  background: var(--color-accent-primary-hover);
  border-color: var(--color-accent-primary-hover);
  box-shadow: var(--shadow-glow);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border-default);
}

.btn-secondary:hover {
  background: var(--color-surface-tertiary);
  border-color: var(--color-border-hover);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-color: transparent;
}

.btn-ghost:hover {
  background: var(--color-surface-tertiary);
  color: var(--color-text-primary);
}

/* Danger Button */
.btn-danger {
  background: var(--color-status-error);
  color: white;
  border-color: var(--color-status-error);
}

.btn-danger:hover {
  filter: brightness(1.1);
}
```

#### Input Component

**Variants:**
- `default` - Standard input
- `prompt` - Terminal-style with prefix (for magnet input)

**Sizes:**
- `sm` - 32px height
- `md` - 40px height (default)
- `lg` - 48px height

```css
/* Input Base */
.input {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-surface-tertiary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-4);
  transition: all var(--duration-fast) var(--ease-default);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.15);
}

/* Prompt Input (Terminal Style) */
.input-prompt {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background: var(--color-surface-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-default);
  padding-left: var(--space-12); /* Space for prompt prefix */
}

.input-prompt-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prompt-prefix {
  position: absolute;
  left: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-accent-primary);
  font-weight: var(--font-weight-semibold);
  pointer-events: none;
  user-select: none;
}
```

#### Card Component

**Variants:**
- `default` - Standard card with border
- `elevated` - With shadow for emphasis
- `interactive` - Hover states for clickable cards

```css
.card {
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all var(--duration-normal) var(--ease-default);
}

.card-elevated {
  box-shadow: var(--shadow-sm);
}

.card-interactive:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-interactive:active {
  transform: translateY(0);
}
```

#### Badge/Status Indicator Component

**Variants:**
- `default` - Neutral badge
- `success` - Green for ready/completed
- `warning` - Yellow for timeout/paused
- `error` - Red for errors
- `processing` - Cyan with pulse animation
- `info` - Blue for informational

**Sizes:**
- `sm` - Compact for inline use
- `md` - Default size

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-status-success);
  border-color: rgba(16, 185, 129, 0.3);
}

.badge-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-status-error);
  border-color: rgba(239, 68, 68, 0.3);
}

.badge-processing {
  background: rgba(0, 217, 255, 0.1);
  color: var(--color-status-processing);
  border-color: rgba(0, 217, 255, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

#### Progress Bar Component

**Variants:**
- `default` - Standard progress bar
- `compact` - Smaller height for inline use
- `animated` - With shimmer animation for indeterminate state

```css
.progress {
  height: 8px;
  background: var(--color-surface-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border-default);
}

.progress-bar {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width var(--duration-normal) var(--ease-default);
}

.progress-bar-downloading {
  background: var(--color-progress-downloading);
}

.progress-bar-completed {
  background: var(--color-progress-completed);
}

/* Animated shimmer for indeterminate state */
.progress-bar-animated {
  background: linear-gradient(
    90deg,
    var(--color-accent-primary) 0%,
    var(--color-accent-secondary) 50%,
    var(--color-accent-primary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Modal Component

**Sizes:**
- `sm` - 320px width
- `md` - 480px width
- `lg` - 640px width
- `full` - Full viewport on mobile

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn var(--duration-fast) var(--ease-out);
}

.modal {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp var(--duration-normal) var(--ease-bounce);
}

.modal-header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-default);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

#### Toast/Notification Component

**Positions:**
- `top-right` - Default for desktop
- `bottom` - Alternative for mobile

**Variants:**
- `success`, `error`, `warning`, `info`

```css
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 200;
  pointer-events: none;
}

.toast {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  pointer-events: auto;
  animation: toastIn var(--duration-normal) var(--ease-bounce);
  max-width: 320px;
}

.toast-exit {
  animation: toastOut var(--duration-fast) var(--ease-in) forwards;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
```

#### Icon Component

**Design Decision:** Replace all emoji icons with custom SVG icons that match the Industrial Terminal aesthetic.

**Icon Set:**
- `processing` - Animated circular arrows (cyan)
- `ready` - Checkmark in circle (green)
- `error` - X in circle (red)
- `timeout` - Clock (yellow)
- `selecting` - List with cursor (purple)
- `download` - Arrow down
- `upload` - Arrow up
- `copy` - Clipboard
- `remove` - Trash can
- `settings` - Gear
- `dark-mode` - Moon
- `light-mode` - Sun
- `auto-mode` - Half-moon

```css
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-sm { width: 14px; height: 14px; }
.icon-md { width: 18px; height: 18px; }
.icon-lg { width: 24px; height: 24px; }
.icon-xl { width: 32px; height: 32px; }

/* Animated processing icon */
.icon-processing {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 4. Page Layouts

### 4.1 Popup Layout (400px width)

```
+------------------------------------------+
|  HEADER                              [>]  |
|  [rd] Real-Debrid Magnet Handler        |
+------------------------------------------+
|                                          |
|  STATUS BAR                              |
|  [2 processing] [5 ready] [1 error]     |
|                                          |
+------------------------------------------+
|                                          |
|  MAGNET INPUT                            |
|  +------------------------------------+  |
|  | rd:// paste_magnet_link_here...    |  |
|  +------------------------------------+  |
|  [Convert]                        [Settings] |
|                                          |
+------------------------------------------+
|                                          |
|  TORRENT LIST                            |
|  +------------------------------------+  |
|  | [icon] filename.torrent       [x]  |  |
|  |        Status: Ready               |  |
|  +------------------------------------+  |
|  | [icon] another_file.mkv       [x]  |  |
|  |        Status: Processing 45%      |  |
|  |        [==========......]          |  |
|  +------------------------------------+  |
|  | [icon] error_file.zip         [x]  |  |
|  |        Status: Error [Retry]       |  |
|  +------------------------------------+  |
|                                          |
|  View all 8 in Dashboard ->              |
|                                          |
+------------------------------------------+
```

**Layout Specifications:**
- Width: 400px fixed
- Min-height: 300px
- Max-height: 500px (scrollable torrent list)
- Padding: 16px (--space-4)
- Gap between sections: 12px (--space-3)

### 4.2 Dashboard Layout (Full page)

```
+------------------------------------------------------------------+
|  HEADER                                                           |
|  [rd] Conversion Dashboard                    [Auto (dark)] [?]   |
|  Total: 12  |  Processing: 2  |  Ready: 8  |  Failed: 2         |
+------------------------------------------------------------------+
|  BATCH CONTROLS                                                   |
|  [Retry 2 Failed]  [Clear 8 Completed]                            |
+------------------------------------------------------------------+
|                                                                  |
|  TORRENT LIST (max-width: 1200px, centered)                      |
|  +--------------------------------------------------------------+|
|  | TORRENT CARD                                                 ||
|  | [processing] filename.torrent                     [PROCESSING]||
|  | Added 2h ago  |  Retries: 0                                 ||
|  |                                                              ||
|  | Progress: 45%                                                ||
|  | [==========================............]                     ||
|  | Down: 5.2 MB/s  |  Up: 1.1 MB/s  |  ETA: 12m                 ||
|  |                                                              ||
|  | [Retry] [Copy Links] [Remove]                                ||
|  +--------------------------------------------------------------+|
|  | TORRENT CARD                                                 ||
|  | [ready] another_file.mkv                            [READY]   ||
|  | Added 5h ago                                                 ||
|  |                                                              ||
|  | Download Links (3)                              [Copy All]    ||
|  | +----------------------------------------------------------+ ||
|  | | file1.mkv (2.1 GB)                              [Copy]   | ||
|  | | file2.mkv (1.8 GB)                              [Copy]   | ||
|  | | file3.srt (125 KB)                              [Copy]   | ||
|  | +----------------------------------------------------------+ ||
|  |                                                              ||
|  | [Retry] [Copy Links] [Remove]                                ||
|  +--------------------------------------------------------------+|
|                                                                  |
+------------------------------------------------------------------+
```

**Layout Specifications:**
- Full viewport height
- Header: fixed, 64px height
- Batch controls: sticky below header
- Main content: scrollable, max-width 1200px centered
- Card gap: 16px (--space-4)

### 4.3 Options Page Layout (500px width)

```
+--------------------------------------------------+
|  HEADER                                          |
|  [rd] Settings                                   |
+--------------------------------------------------+
|                                                  |
|  API TOKEN                                       |
|  +--------------------------------------------+  |
|  | [show] ************************************|  |
|  +--------------------------------------------+  |
|  Get your token at: real-debrid.com/apitoken    |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  MAXIMUM LIST SIZE                               |
|  +--------------------------------------------+  |
|  | [10]                                       |  |
|  +--------------------------------------------+  |
|  Number of torrents to keep in list (5-50)      |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  PREFERENCES                                     |
|  [x] Enable Context Menu                         |
|      Add "Send to Real-Debrid" to right-click    |
|                                                  |
|  [ ] Always Save All Files                       |
|      Skip file selection for multi-file torrents |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  THEME                                           |
|  (o) Auto (follows system)                       |
|  ( ) Light                                       |
|  ( ) Dark                                        |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [Save Settings]                                 |
|                                                  |
|  +--------------------------------------------+  |
|  | Settings saved successfully!               |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

**Layout Specifications:**
- Width: 500px max
- Padding: 32px (--space-8)
- Section gap: 24px (--space-6)
- Form field gap: 8px (--space-2)

---

## 5. Interaction Patterns

### 5.1 Micro-Animations

#### Button Interactions

```css
/* Button press effect */
.btn:active {
  transform: scale(0.97);
}

/* Button hover lift */
.btn:hover {
  transform: translateY(-1px);
}
```

#### Card Interactions

```css
/* Card hover expansion */
.torrent-card {
  transition: all var(--duration-normal) var(--ease-default);
}

.torrent-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Card removal animation */
.torrent-card-exit {
  animation: cardExit var(--duration-normal) var(--ease-in) forwards;
}

@keyframes cardExit {
  to {
    opacity: 0;
    transform: translateX(-20px) scale(0.95);
  }
}
```

#### Progress Bar Animation

```css
/* Smooth progress updates */
.progress-bar {
  transition: width var(--duration-slow) var(--ease-out);
}

/* Indeterminate state */
.progress-bar-indeterminate {
  animation: indeterminate 1.5s infinite linear;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-accent-primary) 50%,
    transparent 100%
  );
  background-size: 50% 100%;
}

@keyframes indeterminate {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}
```

### 5.2 Loading States

#### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-tertiary) 0%,
    var(--color-surface-secondary) 50%,
    var(--color-surface-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite linear;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Spinner Component

```css
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-default);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### 5.3 Error States

#### Input Error

```css
.input-error {
  border-color: var(--color-status-error);
  background: rgba(239, 68, 68, 0.05);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.input-error-message {
  color: var(--color-status-error);
  font-size: var(--text-sm);
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
```

#### Error Banner

```css
.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 3px solid var(--color-status-error);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  animation: slideIn var(--duration-normal) var(--ease-out);
}
```

### 5.4 Success Confirmations

#### Success Toast

```css
.toast-success {
  border-left: 3px solid var(--color-status-success);
}

.toast-success .toast-icon {
  color: var(--color-status-success);
}
```

#### Success Animation

```css
/* Checkmark animation */
.icon-success {
  animation: successPop var(--duration-normal) var(--ease-bounce);
}

@keyframes successPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
```

### 5.5 Hover/Focus States

#### Focus Ring

```css
/* Consistent focus ring across all interactive elements */
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

/* Remove default outline when using mouse */
:focus:not(:focus-visible) {
  outline: none;
}
```

#### Hover Transitions

```css
/* Standard hover transition */
.hoverable {
  transition: all var(--duration-fast) var(--ease-default);
}

.hoverable:hover {
  background: var(--color-surface-tertiary);
}
```

---

## 6. Accessibility Considerations

### 6.1 Color Contrast Requirements

All text must meet WCAG 2.1 AA standards:

| Combination | Light Mode | Dark Mode | Ratio |
|-------------|------------|-----------|-------|
| Primary text on surface | 13.5:1 | 12.8:1 | Pass AA |
| Secondary text on surface | 5.7:1 | 5.2:1 | Pass AA |
| Accent on surface | 3.2:1 | 3.8:1 | Pass AA Large |
| Error on surface | 4.9:1 | 4.5:1 | Pass AA |
| Success on surface | 3.8:1 | 4.2:1 | Pass AA Large |

**Note:** For small text (< 18px), ensure contrast ratio of at least 4.5:1. For large text (>= 18px or 14px bold), ensure at least 3:1.

### 6.2 Focus Management

1. **Visible Focus Indicators:** All interactive elements must have visible focus states using `:focus-visible`
2. **Focus Trapping:** Modals must trap focus within the modal until closed
3. **Focus Restoration:** When a modal closes, focus must return to the element that triggered it
4. **Skip Links:** Dashboard should include a skip link to main content

```html
<!-- Skip link example -->
<a href="#main-content" class="skip-link">Skip to main content</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-accent-primary);
  color: var(--color-text-inverse);
  padding: var(--space-2) var(--space-4);
  z-index: 1000;
  transition: top var(--duration-fast);
}

.skip-link:focus {
  top: 0;
}
```

### 6.3 Screen Reader Considerations

1. **ARIA Labels:** All icon-only buttons must have `aria-label`
2. **Live Regions:** Status updates must use `aria-live="polite"`
3. **Progress Announcements:** Progress bars must have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
4. **Status Badges:** Use `aria-label` or visually hidden text

```html
<!-- Icon button example -->
<button aria-label="Remove torrent" class="btn btn-ghost">
  <Icon name="remove" />
</button>

<!-- Live region example -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {statusMessage}
</div>

<!-- Progress bar example -->
<div 
  role="progressbar" 
  aria-valuenow="45" 
  aria-valuemin="0" 
  aria-valuemax="100"
  aria-label="Download progress"
>
  <div class="progress-bar" style="width: 45%"></div>
</div>
```

### 6.4 Motion Preferences

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 6.5 High Contrast Mode

```css
/* Enhanced borders for high contrast mode */
@media (prefers-contrast: high) {
  .card,
  .btn,
  .input {
    border-width: 2px;
  }
  
  .badge {
    border-width: 2px;
  }
}
```

---

## 7. Implementation Notes

### 7.1 CSS Architecture Approach

**Methodology:** CSS Custom Properties (CSS Variables) with BEM-inspired naming

**File Structure:**
```
src/styles/
  tokens/
    colors.css        # Color palette
    typography.css    # Font definitions
    spacing.css       # Spacing scale
    shadows.css       # Shadow definitions
    animation.css     # Animation tokens
  base/
    reset.css         # CSS reset
    global.css        # Global styles
    utilities.css     # Utility classes
  components/
    button.css
    input.css
    card.css
    badge.css
    modal.css
    toast.css
    progress.css
    icon.css
  themes/
    light.css         # Light mode variables
    dark.css          # Dark mode variables
  main.css            # Import all
```

**Naming Convention:**
- CSS Variables: `--category-property-variant` (e.g., `--color-text-primary`)
- Component Classes: `.component-name` with variants `.component-name--variant`
- Utility Classes: `.utility-property-value` (e.g., `.flex-center`)

### 7.2 Dark Mode Implementation Strategy

**Approach:** CSS class-based theming with system preference detection

```css
/* Root defaults to dark mode */
:root {
  color-scheme: dark;
  /* ... dark mode variables ... */
}

/* Light mode override */
:root.light {
  color-scheme: light;
  /* ... light mode variables ... */
}

/* Auto mode - follows system preference */
@media (prefers-color-scheme: light) {
  :root.auto {
    color-scheme: light;
    /* ... light mode variables ... */
  }
}
```

**JavaScript Theme Management:**
```typescript
// Theme state management
type Theme = 'light' | 'dark' | 'auto';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'auto');
  root.classList.add(theme);
  
  // For auto mode, also set based on system preference
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.style.colorScheme = prefersDark ? 'dark' : 'light';
  } else {
    root.style.colorScheme = theme;
  }
}
```

### 7.3 Animation Approach

**Strategy:** CSS-first animations with React integration for orchestration

**CSS Animations:** Use for all hover, focus, and simple state transitions
**React Animation:** Use for:
- List enter/exit animations (consider `framer-motion` or custom hooks)
- Modal open/close sequences
- Page load orchestration

**Recommended Libraries:**
- CSS: Native CSS animations with custom properties
- React: `framer-motion` for complex sequences (optional, can be done with CSS)

**Example: Staggered List Animation**
```css
.torrent-list .torrent-card {
  animation: fadeSlideIn var(--duration-normal) var(--ease-out) backwards;
}

.torrent-list .torrent-card:nth-child(1) { animation-delay: 0ms; }
.torrent-list .torrent-card:nth-child(2) { animation-delay: 50ms; }
.torrent-list .torrent-card:nth-child(3) { animation-delay: 100ms; }
.torrent-list .torrent-card:nth-child(4) { animation-delay: 150ms; }
/* ... up to reasonable limit */

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 7.4 Font Loading Strategy

**Google Fonts Import:**
```html
<!-- Preconnect for performance -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Font loading with display=swap -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**CSS Font Face (for extension bundle):**
```css
/* Include fonts in extension for offline support */
@font-face {
  font-family: 'JetBrains Mono';
  src: url('../assets/fonts/JetBrainsMono-Variable.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'DM Sans';
  src: url('../assets/fonts/DMSans-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

### 7.5 Migration Path

**Phase 1: Foundation**
1. Create new CSS token files
2. Update HTML templates to include new CSS
3. Implement theme switching logic

**Phase 2: Components**
1. Create new component CSS files
2. Update React components to use new classes
3. Replace emoji icons with SVG icons

**Phase 3: Surfaces**
1. Update Popup layout and styles
2. Update Dashboard layout and styles
3. Update Options page layout and styles

**Phase 4: Polish**
1. Add micro-animations
2. Implement loading states
3. Test accessibility
4. Performance optimization

---

## 8. Visual Reference

### 8.1 Color Palette Visualization

```
LIGHT MODE
==========  ==========  ==========  ==========
Primary     Secondary   Tertiary    Elevated
#FAFBFC     #FFFFFF     #F0F2F5     #FFFFFF
==========  ==========  ==========  ==========

Text: #1A1D21 (primary)  #5C6370 (secondary)  #9DA5B4 (tertiary)
Accent: #00D9FF (cyan)   #7C3AED (purple)

DARK MODE
==========  ==========  ==========  ==========
Primary     Secondary   Tertiary    Elevated
#0D1117     #161B22     #21262D     #1C2128
==========  ==========  ==========  ==========

Text: #E6EDF3 (primary)  #8B949E (secondary)  #6E7681 (tertiary)
Accent: #00D9FF (cyan)   #A78BFA (purple)
```

### 8.2 Typography Sample

```
JETBrains Mono - Display/Headings
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789
The quick brown fox jumps over the lazy dog

DM Sans - Body Text
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789
The quick brown fox jumps over the lazy dog
```

---

## 9. Summary

This UI architecture establishes a cohesive **Industrial Terminal** aesthetic that:

1. **Differentiates** the extension from generic browser extensions
2. **Unifies** the visual language across all three UI surfaces
3. **Supports** both light and dark modes with a consistent token system
4. **Enhances** usability with purposeful micro-animations
5. **Ensures** accessibility through proper contrast, focus management, and motion preferences

The design token system provides a solid foundation for implementation, while the component specifications offer clear guidance for building each UI element. The migration path ensures a smooth transition from the current implementation to the new design.