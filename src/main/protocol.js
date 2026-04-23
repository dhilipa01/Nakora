'use strict';
const { protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

const DIST_DIR = path.join(__dirname, '../../dist');

// Allowlist of permitted file extensions in the renderer
const ALLOWED_EXT = new Set(['.html', '.js', '.jsx', '.css', '.woff', '.woff2', '.ttf', '.png', '.ico', '.svg']);

function registerProtocol() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: false,
      },
    },
  ]);
}

function handleProtocol() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    // Normalise path — strip leading slash
    let relPath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');

    // Path traversal prevention: resolve and confirm it's within dist/
    const absPath = path.resolve(DIST_DIR, relPath);
    if (!absPath.startsWith(DIST_DIR + path.sep) && absPath !== DIST_DIR) {
      return new Response('Forbidden', { status: 403 });
    }

    const ext = path.extname(absPath).toLowerCase();
    if (!ALLOWED_EXT.has(ext) && ext !== '') {
      return new Response('Forbidden', { status: 403 });
    }

    // Serve file
    try {
      const data = fs.readFileSync(absPath);
      const mime = getMime(ext);
      return new Response(data, { headers: { 'Content-Type': mime } });
    } catch {
      // Fallback to index.html for SPA routing
      try {
        const html = fs.readFileSync(path.join(DIST_DIR, 'index.html'));
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }
  });
}

function getMime(ext) {
  const map = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
  };
  return map[ext] || 'application/octet-stream';
}

module.exports = { registerProtocol, handleProtocol };
