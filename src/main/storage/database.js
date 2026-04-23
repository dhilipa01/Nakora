'use strict';
const path = require('path');
const fs   = require('fs');

let _db  = null;
let _app = null;

function init(app) {
  _app = app;
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch {
    // Fallback: in-memory mock when better-sqlite3 not built/available
    console.warn('[nakora] better-sqlite3 not available — using in-memory mock');
    _db = _makeMock();
    return _db;
  }

  const dbPath = path.join(app.getPath('userData'), 'nakora.db');
  _db = new Database(dbPath);

  // Wrap in proxy exposing .query(), .run(), .transaction()
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _runMigrations();
  return _wrapDb(_db);
}

function _runMigrations() {
  const migrDir = path.join(__dirname, 'migrations');
  const files   = fs.readdirSync(migrDir).filter(f => f.endsWith('.sql')).sort();

  _db.prepare('CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, filename TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\')))').run();

  for (const file of files) {
    const applied = _db.prepare('SELECT 1 FROM schema_migrations WHERE filename = ?').get(file);
    if (applied) continue;
    const sql = fs.readFileSync(path.join(migrDir, file), 'utf8');
    _db.exec(sql);
    _db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(file);
    console.log(`[db] migration applied: ${file}`);
  }
}

// Public API — thin wrapper ensuring parameterised queries only
function _wrapDb(db) {
  return {
    _db: db,
    query(sql, params = []) {
      return db.prepare(sql).all(params);
    },
    run(sql, params = []) {
      return db.prepare(sql).run(params);
    },
    get(sql, params = []) {
      return db.prepare(sql).get(params);
    },
    transaction(fn) {
      return db.transaction(fn)();
    },
  };
}

// ─── In-memory mock for environments without better-sqlite3 ──────────────────
function _makeMock() {
  const tables = { whitelist: [], blacklist: [], audit_log: [], threat_log: [], dns_query_log: [] };
  // Seed whitelist defaults
  tables.whitelist = [
    { id:1, domain:'hdfc.co.in',       reason:'Indian banking', source:'USER', added_by:'USER', created_at:new Date().toISOString() },
    { id:2, domain:'sbi.co.in',        reason:'Indian banking', source:'USER', added_by:'USER', created_at:new Date().toISOString() },
    { id:3, domain:'icicibank.com',     reason:'Indian banking', source:'USER', added_by:'USER', created_at:new Date().toISOString() },
    { id:4, domain:'github.com',        reason:'Dev tools',     source:'USER', added_by:'USER', created_at:new Date().toISOString() },
    { id:5, domain:'stackoverflow.com', reason:'Dev tools',     source:'USER', added_by:'USER', created_at:new Date().toISOString() },
  ];
  return {
    _db: null,
    query(sql, params=[]) {
      if (sql.includes('FROM whitelist')) return tables.whitelist;
      if (sql.includes('FROM blacklist')) return tables.blacklist;
      if (sql.includes('FROM audit_log')) return tables.audit_log.slice(0,100);
      if (sql.includes('FROM dns_query_log')) return tables.dns_query_log.slice(0,200);
      if (sql.includes('FROM threat_log')) return tables.threat_log.slice(0,100);
      if (sql.includes('COUNT(*)')) return [{ c: 0 }];
      return [];
    },
    run(sql, params=[]) {
      if (sql.includes('INSERT') && sql.includes('whitelist'))  { tables.whitelist.unshift({ id: Date.now(), domain: params[0], reason: params[1] || '', source:'USER', added_by:'USER', created_at: new Date().toISOString() }); }
      if (sql.includes('DELETE') && sql.includes('whitelist'))  { tables.whitelist = tables.whitelist.filter(e => e.domain !== params[0]); }
      if (sql.includes('INSERT') && sql.includes('blacklist'))  { tables.blacklist.unshift({ id: Date.now(), domain: params[0], source:'USER', added_by:'USER', created_at: new Date().toISOString() }); }
      if (sql.includes('DELETE') && sql.includes('blacklist'))  { tables.blacklist = tables.blacklist.filter(e => e.domain !== params[0]); }
      if (sql.includes('INSERT') && sql.includes('audit_log'))  { tables.audit_log.unshift({ id: Date.now(), action: params[0], channel: params[1], success: params[2], error: params[3], created_at: new Date().toISOString() }); }
      return { changes: 1 };
    },
    get(sql, params=[]) { return null; },
    transaction(fn) { return fn(); },
  };
}

function getDb() { return _db; }

module.exports = { init, getDb };
