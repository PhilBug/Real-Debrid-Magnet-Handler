import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import webExtension from '@samrum/vite-plugin-web-extension'

export default defineConfig({
  base: '',
  plugins: [
    tailwindcss(),
    webExtension({
      manifest: {
        manifest_version: 3,
        name: 'Real-Debrid Magnet Handler',
        version: '1.0.0',
        description: 'Convert magnet links to HTTP downloads via Real-Debrid',
        permissions: ['storage', 'alarms', 'contextMenus'],
        host_permissions: ['https://api.real-debrid.com/*'],
        action: {
          default_popup: 'src/popup/popup.html',
          default_icon: {
            '16': 'icons/icon-16.png',
            '48': 'icons/icon-48.png',
            '128': 'icons/icon-128.png',
          },
        },
        options_ui: {
          page: 'src/options/options.html',
          open_in_tab: false,
        },
        background: {
          scripts: ['src/background/service-worker.ts'],
          type: 'module',
        } as any,
        browser_specific_settings: {
          gecko: {
            id: 'real-debrid-magnet-handler@philbug.dev',
            strict_min_version: '142.0',
            data_collection_permissions: {
              required: ['none'],
            },
          },
        },
        icons: {
          '16': 'icons/icon-16.png',
          '48': 'icons/icon-48.png',
          '128': 'icons/icon-128.png',
        },
      },
    }),
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
