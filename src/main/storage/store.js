'use strict';
const os     = require('os');
const crypto = require('crypto');

let _store = null;

const DEFAULTS = {
  toggles: {
    dnsResolver: true, phishtank: true, openphish: true, virustotal: false,
    toastAlerts: true, dohDetection: true, etwCryptojack: true, pqcSigning: false,
    mlNet: true, langIrregularity: true, homoglyph: true, dgaDetector: true,
    redirectChain: true, urlHashing: true, localOnly: false, telemetry: false, scanlines: false,
  },
  budgets: { dnsLatencyTarget: 30, cpuBudget: 5, dataRetentionDays: 90 },
  apiConfig: { goEndpoint: 'http://localhost:8080' },
  theme: 'original',
  sidebarOpen: true,
  windowBounds: { width: 1280, height: 840 },
};

function _deriveKey(app) {
  // Machine-specific key derived from hostname + userData path
  const raw = os.hostname() + (app?.getPath('userData') ?? '');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

function init(app) {
  let Store;
  try {
    Store = require('electron-store');
  } catch {
    console.warn('[nakora] electron-store not available — using in-memory store');
    _store = _makeMemoryStore();
    return _store;
  }

  _store = new Store({
    name: 'nakora-settings',
    encryptionKey: _deriveKey(app),
    defaults: DEFAULTS,
    clearInvalidConfig: true,
  });
  return _store;
}

// Memory store fallback
function _makeMemoryStore() {
  const data = JSON.parse(JSON.stringify(DEFAULTS));
  return {
    get: (key, def) => {
      const parts = key.split('.');
      let v = data;
      for (const p of parts) { v = v?.[p]; if (v === undefined) return def; }
      return v ?? def;
    },
    set: (key, value) => {
      const parts = key.split('.');
      let v = data;
      for (let i = 0; i < parts.length - 1; i++) {
        if (v[parts[i]] === undefined) v[parts[i]] = {};
        v = v[parts[i]];
      }
      v[parts[parts.length - 1]] = value;
    },
    store: data,
  };
}

function getStore() { return _store; }

module.exports = { init, getStore };
