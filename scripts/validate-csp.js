#!/usr/bin/env node
'use strict';
const fs   = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');
if (!fs.existsSync(indexPath)) {
  console.error('[validate-csp] dist/index.html not found — run vite build first');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const hasCsp = html.includes('Content-Security-Policy');
const hasConnectNone = html.includes("connect-src 'none'");
const hasNoUnsafeEval = !html.includes("'unsafe-eval'");

if (!hasCsp)          { console.error('[validate-csp] FAIL: CSP meta tag missing'); process.exit(1); }
if (!hasConnectNone)  { console.error("[validate-csp] FAIL: connect-src 'none' missing"); process.exit(1); }
if (!hasNoUnsafeEval) { console.error("[validate-csp] FAIL: unsafe-eval found in CSP"); process.exit(1); }

console.log('[validate-csp] PASS: CSP present, connect-src none, no unsafe-eval');
