// Run: node generate-icons.mjs
// Requires: npm install -g sharp  OR use the SVG directly in manifest

import { writeFileSync } from 'fs'

// Simple SVG icon for ilocare
const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#f8e8e8"/>
  <text x="96" y="120" text-anchor="middle" font-size="90" font-family="system-ui">🌸</text>
  <text x="96" y="160" text-anchor="middle" font-size="22" font-family="system-ui,sans-serif" font-weight="800" fill="#c87070">ilocare</text>
</svg>`

writeFileSync('icon-192.svg', svg192)
console.log('SVG icon created')
