# Real-Debrid Magnet Handler

A modern, Manifest V3 Firefox extension to convert magnet links into high-speed HTTP downloads using the Real-Debrid API.

## Features

- **Quick Conversion**: Paste magnet links directly into the popup for instant processing.
- **Background Polling**: Automatic status tracking using `browser.alarms`, ensuring conversions continue even when the popup is closed.
- **File Selection**: Intelligent handling of multi-file torrents with an interactive file selector.
- **Auto-Unrestrict**: Automatically generates unrestricted download links once the conversion is complete.
- **Context Menu**: Right-click any magnet link to send it directly to Real-Debrid (configurable).
- **Status Monitoring**: Real-time updates on conversion progress (processing, selecting files, ready, error, timeout).
- **History Management**: Keeps a list of recent conversions with configurable history size.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4.1
- **Build Tool**: Vite 7.3 with `@samrum/vite-plugin-web-extension`
- **API Client**: Axios 1.13
- **Browser API**: `webextension-polyfill` for cross-browser compatibility
- **Developer Tools**: Vitest (testing), ESLint 9, Prettier 3, web-ext 9.2

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Real-Debrid account and [API Token](https://real-debrid.com/apitoken)

### Development

1. Clone the repository:

   ```bash
   git clone https://github.com/PhilBug/Real-Debrid-Magnet-Handler.git
   cd Real-Debrid-Magnet-Handler
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server (with HMR):

   ```bash
   npm run dev
   ```

4. Load the extension in Firefox:
   - Run `npm run preview` to start the extension in a temporary Firefox profile.
   - OR manually: Open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select `dist/manifest.json`.

## Build & Packaging

### Production Build

To create a production-ready build in the `dist` folder:

```bash
npm run build
```

### Packaging for Firefox (AMO)

To generate a `.zip` or `.xpi` file for submission to the Mozilla Add-on Store:

```bash
npm run package
```

The artifact will be created in the `web-ext-artifacts/` directory.

### Linting for Firefox Compatibility

Before submitting, you can run the specialized Firefox linter to ensure compliance with Mozilla's standards:

```bash
npm run lint:firefox
```

## Development Workflow

To ensure high code quality and consistency, please follow these steps before contributing or submitting changes:

1. **Format Code**: `npm run format`
2. **Type Check**: `npm run lint`
3. **Run Tests**: `npm run test`
4. **Check Coverage**: `npm run test:coverage`
5. **Lint JS**: `npm run lint:eslint`
6. **Lint Firefox**: `npm run lint:firefox`

## Configuration

1. After installation, click the extension icon.
2. Click the **Settings (⚙️)** icon.
3. Paste your [Real-Debrid API Token](https://real-debrid.com/apitoken).
4. Click **Save**.

## Testing

Run the test suite using Vitest:

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Check coverage
npm run test:coverage
```

## License

MIT
