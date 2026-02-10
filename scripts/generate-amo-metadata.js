#!/usr/bin/env node

/**
 * Generates version-metadata.json for AMO submission API
 * Called by semantic-release before signing the extension
 */

const fs = require('fs')
const path = require('path')

const version = process.env.NEXT_RELEASE_VERSION
const notes = process.env.RELEASE_NOTES || ''

if (!version) {
  console.error('NEXT_RELEASE_VERSION environment variable not set')
  process.exit(1)
}

// Convert markdown notes to plain text for AMO
const plainNotes = notes
  .replace(/#{1,6}\s/g, '') // Remove markdown headers
  .replace(/\*\*/g, '') // Remove bold
  .replace(/\*/g, '') // Remove italics
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
  .replace(/`([^`]+)`/g, '$1') // Remove inline code
  .trim()

const metadata = {
  version,
  release_notes: plainNotes || `Version ${version}`,
}

const outputPath = path.join(__dirname, '..', 'version-metadata.json')
fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2))
console.log(`Generated version-metadata.json for version ${version}`)
