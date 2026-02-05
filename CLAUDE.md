# MCP Tools Available

This project has access to Model Context Protocol (MCP) tools that should be used when working with the codebase:

### Serena (Semantic Codebase Agent)

- **Purpose**: Deep semantic understanding of the codebase, symbol navigation, and token-efficient code modification
- **When to use**:
  - **INSTEAD** of reading entire files or using `grep` when you need to find specific functionality
  - When you need to find where a class, function, or variable is defined or used (`find_symbol`)
  - When analyzing complex dependencies between different parts of the project
  - When you need to understand the project structure without dumping file contents into context
- **How to use**:
  - **Initialization**: At the start of a session, if Serena doesn't seem active, ask: *"Read Serena's initial instructions"*
  - **Workflow**: Ask to "Activate the project at [current path]" if it's the first time running in this directory
  - **Action**: Use Serena's tools to "map" or "index" the relevant code sections before proposing changes


## Active Technologies
- TypeScript 5.7 + React 19, Vite 5.4, @samrum/vite-plugin-web-extension 6.0, webextension-polyfill 0.12, axios 1.7, Tailwind CSS 4.0 (001-real-debrid-magnet-handler)
- browser.storage.sync (settings/token), browser.storage.local (torrent list) (001-real-debrid-magnet-handler)

## Recent Changes
- 001-real-debrid-magnet-handler: Added TypeScript 5.7 + React 19, Vite 5.4, @samrum/vite-plugin-web-extension 6.0, webextension-polyfill 0.12, axios 1.7, Tailwind CSS 4.0
