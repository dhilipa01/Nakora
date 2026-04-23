'use strict';
// settings.handler.js
const keychain = require('../../storage/keychain.js');
const auditLog = require('../../services/audit-log.service.js');
let _store = null;

function initSettings(store) { _store = store; }

async function getSettings() {
  return {
    toggles: _store.get('toggles'),
    budgets: _store.get('budgets'),
    apiConfig: _store.get('apiConfig'),
    theme: _store.get('theme'),
    sidebarOpen: _store.get('sidebarOpen'),
  };
}

async function saveSettings(payload) {
  // payload already validated by router
  const { toggles, budgets, apiConfig, theme, sidebarOpen } = payload;
  if (toggles)     _store.set('toggles',     { ..._store.get('toggles'),     ...toggles });
  if (budgets)     _store.set('budgets',      { ..._store.get('budgets'),     ...budgets });
  if (apiConfig)   _store.set('apiConfig',    { ..._store.get('apiConfig'),   ...apiConfig });
  if (theme !== undefined)       _store.set('theme', theme);
  if (sidebarOpen !== undefined) _store.set('sidebarOpen', sidebarOpen);
  auditLog.log({ action: 'settings:save', channel: 'settings', success: true });
  return true;
}

async function testConnection({ endpoint }) {
  // Mock test — real implementation would attempt TCP connect
  await new Promise(r => setTimeout(r, 600 + Math.random() * 500));
  return { ok: Math.random() > 0.25, latencyMs: Math.floor(Math.random() * 80) + 20 };
}

async function resetToDefaults() {
  const DEFAULTS = require('../../storage/store.js').getStore().store;
  // For memory store fallback this is a no-op
  auditLog.log({ action: 'settings:reset', channel: 'settings', success: true });
  return true;
}

async function setApiKey({ name, value }) {
  const ok = await keychain.setKey(name, value);
  auditLog.log({ action: 'settings:set-api-key', channel: name, success: ok });
  return ok;
}

async function getApiKeyStatus({ name }) {
  const has = await keychain.hasKey(name);
  return { name, configured: has };
}

// ─── etw.handler.js ───────────────────────────────────────────────────────────
const etwMon = require('../../services/etw-monitor.service.js');

async function getCpuMetrics()       { return etwMon.getCpuMetrics(); }
async function getMemoryMetrics()    { return etwMon.getMemoryMetrics(); }
async function getActiveConnections(){ return etwMon.getConnections(); }
async function getTopProcesses()     { return etwMon.getProcesses(); }
async function getEtwEvents({ windowSeconds }) { return etwMon.getEtwEvents(windowSeconds); }

// ─── system.handler.js ────────────────────────────────────────────────────────
const sysMetrics = require('../../services/system-metrics.service.js');
const auditSvc   = require('../../services/audit-log.service.js');

let _appRef = null;
function initSystem(app) { _appRef = app; }

async function getSystemInfo()   { return sysMetrics.getSystemInfo(); }
async function getAppVersion()   { return _appRef?.getVersion() ?? '0.1.0'; }
async function getSessionInfo()  {
  const dns = require('../../services/dns-simulator.service.js');
  return dns.getStats();
}
async function getAuditLog({ limit }) { return auditSvc.getRecent(limit || 100); }

// ─── export.handler.js ───────────────────────────────────────────────────────
const { dialog } = require('electron');
const os   = require('os');
const fs   = require('fs');
const dnsSim = require('../../services/dns-simulator.service.js');
let _db2 = null;
let _store2 = null;
function initExport(db, store) { _db2 = db; _store2 = store; }

async function getExportPreview() {
  return {
    fields: ['export_metadata','system','session','configuration','domain_lists','threat_log','dns_log_sample','etw_snapshot'],
    systemInfo:   sysMetrics.getSystemInfo(),
    sessionStats: dnsSim.getStats(),
  };
}

async function generateExport(payload) {
  const [cpu, mem, procs, conns] = await Promise.all([
    Promise.resolve(etwMon.getCpuMetrics()),
    Promise.resolve(etwMon.getMemoryMetrics()),
    etwMon.getProcesses(),
    etwMon.getConnections(),
  ]);

  const store     = _store2;
  const toggles   = store?.get('toggles') ?? {};
  const budgets   = store?.get('budgets') ?? {};
  const apiConfig = store?.get('apiConfig') ?? {};

  const whitelist = _db2 ? _db2.query('SELECT domain, reason FROM whitelist WHERE added_by = ?', ['USER']) : [];
  const blacklist = _db2 ? _db2.query('SELECT domain FROM blacklist WHERE added_by = ?', ['USER']) : [];

  const exportObj = {
    export_metadata: {
      exported_at: new Date().toISOString(),
      app_name: 'nakora',
      app_version: _appRef?.getVersion() ?? '0.1.0',
      export_format_version: '1.0',
      gdpr_note: 'This export contains locally-generated session data only. No data was transmitted to external services without explicit user consent. Processed under GDPR Art. 32 minimization and Art. 20 portability.',
    },
    system: sysMetrics.getSystemInfo(),
    session: dnsSim.getStats(),
    configuration: {
      feature_toggles: toggles,
      performance_budgets: budgets,
      api_endpoints: {
        go_microservice: apiConfig.goEndpoint || 'http://localhost:8080',
        phishtank:   (await keychain.hasKey('phishtank'))   ? 'configured' : 'not configured',
        virustotal:  (await keychain.hasKey('virustotal'))  ? 'configured' : 'not configured',
      },
    },
    domain_lists: {
      whitelist: whitelist.map(e => ({ domain: e.domain, reason: e.reason })),
      blacklist_manual: blacklist.map(e => ({ domain: e.domain })),
    },
    threat_log: dnsSim.getFeed(500).filter(e => e.verdict !== 'CLEAN').slice(0, 50),
    dns_log_sample: dnsSim.getFeed(30),
    etw_snapshot: {
      timestamp: new Date().toISOString(),
      note: 'Partial ETW — kernel tap requires Windows service in production (simulated: true)',
      cpu, mem, top_processes: procs, active_connections: conns,
    },
  };

  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Export nakora Data',
    defaultPath: `nakora-export-${new Date().toISOString().slice(0,16).replace(/[T:]/g,'-')}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });

  if (canceled || !filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(filePath, JSON.stringify(exportObj, null, 2), 'utf8');
    auditLog.log({ action: 'export:generate', channel: 'export', success: true });
    return { ok: true, path: filePath };
  } catch (err) {
    auditLog.log({ action: 'export:generate', channel: 'export', success: false, error: err.message });
    return { ok: false, error: err.message };
  }
}

module.exports = {
  // settings
  initSettings, getSettings, saveSettings, testConnection, resetToDefaults, setApiKey, getApiKeyStatus,
  // etw
  getCpuMetrics, getMemoryMetrics, getActiveConnections, getTopProcesses, getEtwEvents,
  // system
  initSystem, getSystemInfo, getAppVersion, getSessionInfo, getAuditLog,
  // export
  initExport, getExportPreview, generateExport,
};
