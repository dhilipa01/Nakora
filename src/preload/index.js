'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// Strict channel whitelist
const ALLOWED = new Set([
  'dns:get-stats','dns:get-feed','dns:get-query-log','dns:clear-log',
  'domains:get-whitelist','domains:get-blacklist',
  'domains:add-whitelist','domains:remove-whitelist',
  'domains:add-blacklist','domains:remove-blacklist',
  'domains:get-filter-lists','domains:toggle-filter-list',
  'settings:get-settings','settings:save-settings','settings:test-connection',
  'settings:reset-to-defaults','settings:set-api-key','settings:get-api-key-status',
  'etw:get-cpu','etw:get-memory','etw:get-connections','etw:get-processes','etw:get-events',
  'system:get-info','system:get-version','system:get-session','system:get-audit-log',
  'export:get-preview','export:generate',
]);

function invoke(channel, payload) {
  if (!ALLOWED.has(channel)) return Promise.reject(new Error(`Channel not permitted: ${channel}`));
  return ipcRenderer.invoke(channel, payload);
}

// Client-side type guards (defence-in-depth before Zone 1 validator)
const isString = v => typeof v === 'string' && v.length > 0 && v.length < 300;
const isObj    = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isInt    = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

contextBridge.exposeInMainWorld('nakora', {

  dns: {
    getStats:     ()       => invoke('dns:get-stats'),
    getFeed:      (limit)  => invoke('dns:get-feed', { limit: isInt(limit,1,500) ? limit : 30 }),
    getQueryLog:  (filters)=> invoke('dns:get-query-log', isObj(filters) ? filters : {}),
    clearLog:     ()       => invoke('dns:clear-log'),
  },

  domains: {
    getWhitelist:       ()              => invoke('domains:get-whitelist'),
    getBlacklist:       ()              => invoke('domains:get-blacklist'),
    addToWhitelist:     (domain, reason)=> invoke('domains:add-whitelist', { domain: String(domain), reason: reason ? String(reason).slice(0,200) : '' }),
    removeFromWhitelist:(domain)        => invoke('domains:remove-whitelist', { domain: String(domain) }),
    addToBlacklist:     (domain)        => invoke('domains:add-blacklist', { domain: String(domain) }),
    removeFromBlacklist:(domain)        => invoke('domains:remove-blacklist', { domain: String(domain) }),
    getFilterLists:     ()              => invoke('domains:get-filter-lists'),
    toggleFilterList:   (listId, en)    => invoke('domains:toggle-filter-list', { listId: String(listId), enabled: !!en }),
  },

  settings: {
    getSettings:     ()        => invoke('settings:get-settings'),
    saveSettings:    (partial) => invoke('settings:save-settings', isObj(partial) ? partial : {}),
    testConnection:  (ep)      => invoke('settings:test-connection', { endpoint: String(ep) }),
    resetToDefaults: ()        => invoke('settings:reset-to-defaults'),
    setApiKey:       (name, v) => invoke('settings:set-api-key', { name: String(name), value: String(v) }),
    getApiKeyStatus: (name)    => invoke('settings:get-api-key-status', { name: String(name) }),
  },

  etw: {
    getCpu:         ()      => invoke('etw:get-cpu', {}),
    getMemory:      ()      => invoke('etw:get-memory', {}),
    getConnections: ()      => invoke('etw:get-connections', {}),
    getProcesses:   ()      => invoke('etw:get-processes', {}),
    getEvents:      (secs)  => invoke('etw:get-events', { windowSeconds: isInt(secs,1,3600) ? secs : 60 }),
  },

  system: {
    getInfo:     () => invoke('system:get-info'),
    getVersion:  () => invoke('system:get-version'),
    getSession:  () => invoke('system:get-session'),
    getAuditLog: (n)=> invoke('system:get-audit-log', { limit: isInt(n,1,500) ? n : 100 }),
  },

  export: {
    getPreview:  ()        => invoke('export:get-preview'),
    generate:    (payload) => invoke('export:generate', isObj(payload) ? payload : {}),
  },

});
