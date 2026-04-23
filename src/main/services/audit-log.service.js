'use strict';
/**
 * audit-log.service.js
 * Logs every IPC call, settings change, domain list modification, export.
 * Never logs domain content, API keys, or user filesystem paths.
 * Rotates at 10,000 entries.
 */

let _db = null;

function init(db) {
  _db = db;
}

function log({ action, channel, success, error = null }) {
  if (!_db) return;
  try {
    _db.run(
      'INSERT INTO audit_log (action, channel, success, error) VALUES (?, ?, ?, ?)',
      [action, channel || '', success ? 1 : 0, error ? String(error).slice(0, 200) : null]
    );
    // Rotate: keep newest 8,000 when over 10,000
    const count = _db.query('SELECT COUNT(*) as c FROM audit_log')[0]?.c ?? 0;
    if (count > 10000) {
      _db.run('DELETE FROM audit_log WHERE id IN (SELECT id FROM audit_log ORDER BY id ASC LIMIT 2000)');
    }
  } catch {}
}

function getRecent(limit = 100) {
  if (!_db) return [];
  try {
    return _db.query(
      'SELECT id, created_at, action, channel, success, error FROM audit_log ORDER BY id DESC LIMIT ?',
      [Math.min(limit, 500)]
    );
  } catch { return []; }
}

module.exports = { init, log, getRecent };
