# Development Commands

## Project Initialization (When ready to start)
```bash
# Initialize Vite web extension
npm init @samrum/vite-plugin-web-extension@latest
# Select: Manifest V3, React, TypeScript

# Install dependencies
npm install axios webextension-polyfill tailwindcss
npm install -D @types/webextension-polyfill web-ext

# Initialize Tailwind
npx tailwindcss init
```

## Development Workflow (Once initialized)
```bash
npm run dev      # Dev server with hot reload
npm run preview  # Run extension in Firefox (separate terminal)
npm run build    # Production build
npm run lint     # ESLint
npm run format   # Prettier
npm run package  # Build for distribution
```

## Git
- Use `gh` for GitHub operations
- Do NOT run git commit/push yourself (per user rules)
