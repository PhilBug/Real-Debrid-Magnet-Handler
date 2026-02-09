#!/usr/bin/env node

/**
 * Updates the version in vite.config.ts
 * Called by semantic-release via @semantic-release/exec
 */

const fs = require('fs')
const path = require('path')

const nextReleaseVersion = process.env.NEXT_RELEASE_VERSION
if (!nextReleaseVersion) {
  console.error('NEXT_RELEASE_VERSION environment variable not set')
  process.exit(1)
}

const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts')
let content = fs.readFileSync(viteConfigPath, 'utf-8')

// Update version in manifest section
content = content.replace(/version:\s*['"][^'"]+['"]/, `version: '${nextReleaseVersion}'`)

fs.writeFileSync(viteConfigPath, content)
console.log(`Updated vite.config.ts version to ${nextReleaseVersion}`)
