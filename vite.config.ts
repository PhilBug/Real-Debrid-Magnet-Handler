import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import webExtension from "@samrum/vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    tailwindcss(),
    webExtension({
      manifest: {
        manifest_version: 3,
        name: "Real-Debrid Magnet Handler",
        version: "1.0.0",
        description: "Convert magnet links to HTTP downloads via Real-Debrid",
        permissions: ["storage", "alarms"],
        host_permissions: ["https://api.real-debrid.com/*"],
        action: {
          default_popup: "src/popup/popup.html",
          default_icon: {
            "16": "icons/icon-16.png",
            "48": "icons/icon-48.png",
            "128": "icons/icon-128.png"
          }
        },
        options_ui: {
          page: "src/options/options.html",
          open_in_tab: false
        },
        background: {
          service_worker: "src/background/service-worker.ts",
          scripts: ["src/background/service-worker.ts"],
          type: "module"
        },
        icons: {
          "16": "icons/icon-16.png",
          "48": "icons/icon-48.png",
          "128": "icons/icon-128.png"
        }
      }
    })
  ],
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
