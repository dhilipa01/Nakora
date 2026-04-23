'use strict';
const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data/filter-lists');

// In-memory domain Sets per list (O(1) lookup)
const _sets = new Map();

// Catalogue metadata
const CATALOGUE = [
  { id: 'urlhaus',     file: 'urlhaus-domains.txt',      format: 'plain',  name: 'uBlock urlhaus-filter',     category: 'Malware',      source: 'gitlab.com/malware-filter' },
  { id: 'easyprivacy', file: 'easyprivacy-domains.txt',  format: 'plain',  name: 'EasyPrivacy',               category: 'Tracker',      source: 'easylist.to' },
  { id: 'peterLowe',   file: 'peter-lowe-adservers.txt', format: 'hosts',  name: "Peter Lowe's Blocklist",    category: 'Ad/Malware',   source: 'pgl.yoyo.org' },
  { id: 'openphish',   file: 'openphish-feed.txt',       format: 'url',    name: 'OpenPhish Feed',            category: 'Phishing',     source: 'openphish.com' },
  { id: 'phishtank',   file: 'phishtank-domains.txt',    format: 'plain',  name: 'PhishTank DB',              category: 'Phishing',     source: 'phishtank.org' },
  { id: 'coinblocker', file: 'coinblocker-domains.txt',  format: 'plain',  name: 'CoinBlockerLists',          category: 'Cryptojacking',source: 'zerodot1.gitlab.io' },
  { id: 'cisa',        file: 'cisa-indicators.json',     format: 'json',   name: 'CISA Known-Bad Indicators', category: 'Gov Intel',    source: 'cisa.gov' },
];

let _loaded = false;
let _state = new Map(); // id -> { enabled: bool }

function _parsePlain(text) {
  return text.split('\n')
    .map(l => l.trim().toLowerCase())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('!'));
}

function _parseHosts(text) {
  return text.split('\n')
    .map(l => { const p = l.trim().split(/\s+/); return p[1]; })
    .filter(d => d && !d.startsWith('#') && d !== 'localhost' && d !== '0.0.0.0' && d !== '127.0.0.1');
}

function _parseUrl(text) {
  return text.split('\n')
    .map(l => {
      try { return new URL(l.trim()).hostname; } catch { return l.trim(); }
    })
    .filter(d => d && !d.startsWith('#'));
}

function _parseJson(text) {
  try {
    const arr = JSON.parse(text);
    return (Array.isArray(arr) ? arr : []).map(e => e.domain || e).filter(Boolean);
  } catch { return []; }
}

function load() {
  if (_loaded) return;
  for (const entry of CATALOGUE) {
    const filePath = path.join(DATA_DIR, entry.file);
    let domains = [];
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, 'utf8');
      if (entry.format === 'plain')  domains = _parsePlain(text);
      if (entry.format === 'hosts')  domains = _parseHosts(text);
      if (entry.format === 'url')    domains = _parseUrl(text);
      if (entry.format === 'json')   domains = _parseJson(text);
    }
    _sets.set(entry.id, new Set(domains));
    if (!_state.has(entry.id)) _state.set(entry.id, { enabled: true });
  }
  _loaded = true;
}

function getListsMeta() {
  load();
  return CATALOGUE.map(entry => ({
    id:      entry.id,
    name:    entry.name,
    source:  entry.source,
    count:   _sets.get(entry.id)?.size ?? 0,
    enabled: _state.get(entry.id)?.enabled ?? true,
    category: entry.category,
  }));
}

function toggleList(id, enabled) {
  if (_state.has(id)) _state.set(id, { enabled });
}

function isBlocked(domain) {
  if (!domain) return { blocked: false, listName: null };
  const d = domain.toLowerCase().replace(/^www\./, '');
  for (const [id, set] of _sets.entries()) {
    const meta = _state.get(id);
    if (!meta?.enabled) continue;
    if (set.has(d) || set.has('www.' + d)) {
      const entry = CATALOGUE.find(e => e.id === id);
      return { blocked: true, listName: entry?.name ?? id };
    }
  }
  return { blocked: false, listName: null };
}

module.exports = { load, getListsMeta, toggleList, isBlocked };
