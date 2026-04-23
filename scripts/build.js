#!/usr/bin/env node
'use strict';
const fs   = require('fs');
const path = require('path');

const FILTER_DIR = path.join(__dirname, '../data/filter-lists');
const REQUIRED   = ['coinblocker-domains.txt','openphish-feed.txt','urlhaus-domains.txt','peter-lowe-adservers.txt','easyprivacy-domains.txt','phishtank-domains.txt','cisa-indicators.json'];

let failed = 0;

console.log('[build] Validating filter list files...');
for (const file of REQUIRED) {
  const p = path.join(FILTER_DIR, file);
  if (!fs.existsSync(p)) {
    console.error(`  ✗ MISSING: ${file}`);
    failed++;
  } else {
    const size = fs.statSync(p).size;
    if (size === 0) { console.error(`  ✗ EMPTY: ${file}`); failed++; }
    else console.log(`  ✓ ${file} (${size} bytes)`);
  }
}

if (failed > 0) {
  console.error(`[build] ${failed} validation error(s). Aborting.`);
  process.exit(1);
}

// Inject build metadata as src/renderer/buildMeta.js
const meta = {
  version: require('../package.json').version,
  buildTime: new Date().toISOString(),
  commit: process.env.GIT_COMMIT || 'dev',
};
fs.writeFileSync(
  path.join(__dirname, '../src/renderer/buildMeta.js'),
  `export const BUILD_META = ${JSON.stringify(meta, null, 2)};\n`,
  'utf8'
);
console.log('[build] build metadata written');
console.log('[build] Pre-build validation passed.');
