'use strict';
const filterLists = require('../../services/filter-lists.service.js');
const auditLog    = require('../../services/audit-log.service.js');
let _db = null;

// In-memory cache, invalidated on write
let _wlCache = null;
let _blCache = null;

function init(db) { _db = db; }

async function getWhitelist() {
  if (_wlCache) return _wlCache;
  const rows = _db.query('SELECT domain, reason, source, created_at FROM whitelist ORDER BY created_at DESC');
  _wlCache = rows;
  return rows;
}

async function getBlacklist() {
  if (_blCache) return _blCache;
  const rows = _db.query('SELECT domain, source, created_at FROM blacklist ORDER BY created_at DESC');
  _blCache = rows;
  return rows;
}

async function addToWhitelist({ domain, reason }) {
  _db.run('INSERT OR IGNORE INTO whitelist (domain, reason, source, added_by) VALUES (?, ?, ?, ?)',
    [domain.toLowerCase(), reason || '', 'USER', 'USER']);
  _wlCache = null;
  auditLog.log({ action: 'whitelist:add', channel: 'domains', success: true });
  return true;
}

async function removeFromWhitelist({ domain }) {
  _db.run('DELETE FROM whitelist WHERE domain = ?', [domain.toLowerCase()]);
  _wlCache = null;
  auditLog.log({ action: 'whitelist:remove', channel: 'domains', success: true });
  return true;
}

async function addToBlacklist({ domain }) {
  _db.run('INSERT OR IGNORE INTO blacklist (domain, source, added_by) VALUES (?, ?, ?)',
    [domain.toLowerCase(), 'USER', 'USER']);
  _blCache = null;
  auditLog.log({ action: 'blacklist:add', channel: 'domains', success: true });
  return true;
}

async function removeFromBlacklist({ domain }) {
  _db.run('DELETE FROM blacklist WHERE domain = ?', [domain.toLowerCase()]);
  _blCache = null;
  auditLog.log({ action: 'blacklist:remove', channel: 'domains', success: true });
  return true;
}

async function getFilterLists()           { return filterLists.getListsMeta(); }
async function toggleFilterList({ listId, enabled }) {
  filterLists.toggleList(listId, enabled);
  auditLog.log({ action: 'filter-list:toggle', channel: listId, success: true });
  return true;
}

module.exports = { init, getWhitelist, getBlacklist, addToWhitelist, removeFromWhitelist, addToBlacklist, removeFromBlacklist, getFilterLists, toggleFilterList };
