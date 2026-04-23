'use strict';
const { EventEmitter } = require('events');
const filterLists = require('./filter-lists.service.js');

const emitter = new EventEmitter();
emitter.setMaxListeners(20);

// ─── Domain datasets ──────────────────────────────────────────────────────────
const THREAT_SET = [
  { domain: 'paypa1-secure-login.ru',  verdict: 'BLOCKED', score: 94, trigger: 'Homoglyph',           analyzer: 'Homoglyph/Punycode', abuseType: 'Phishing'      },
  { domain: 'xn--googl-fsa.com',       verdict: 'BLOCKED', score: 88, trigger: 'Punycode IDN',         analyzer: 'Homoglyph/Punycode', abuseType: 'Phishing'      },
  { domain: 'secure-bankverify.xyz',   verdict: 'BLOCKED', score: 91, trigger: 'PhishTank',            analyzer: 'PhishTank API',     abuseType: 'Phishing'      },
  { domain: 'fast-flux-c2.biz',        verdict: 'BLOCKED', score: 96, trigger: 'DGA + Fast-Flux NS',   analyzer: 'DGA Detector',      abuseType: 'Malware C2'    },
  { domain: 'xmrpool.supportxmr.com',  verdict: 'BLOCKED', score: 99, trigger: 'CoinBlockerLists+ETW', analyzer: 'Cryptojacking/ETW', abuseType: 'Cryptojacking' },
  { domain: 'mining-cdn-pool.io',      verdict: 'BLOCKED', score: 82, trigger: 'CoinBlockerLists',     analyzer: 'Cryptojacking/ETW', abuseType: 'Cryptojacking' },
  { domain: 'login-secure-hsbc.top',   verdict: 'BLOCKED', score: 87, trigger: 'OpenPhish',            analyzer: 'OpenPhish Feed',    abuseType: 'Phishing'      },
  { domain: 'dga-c2-ab3kf72.xyz',      verdict: 'BLOCKED', score: 93, trigger: 'Entropy 5.1',          analyzer: 'DGA Detector',      abuseType: 'DGA'           },
  { domain: 'dns-tunnel-exfil.co',     verdict: 'BLOCKED', score: 85, trigger: 'TXT record abuse',     analyzer: 'DGA Detector',      abuseType: 'DNS Tunneling' },
  { domain: 'cache-poison-ns1.net',    verdict: 'BLOCKED', score: 79, trigger: 'NS anomaly',           analyzer: 'DGA Detector',      abuseType: 'Cache Poisoning'},
];

const WARN_SET = [
  { domain: 'bit.ly/3xK9mR2',          verdict: 'WARNING', score: 61, trigger: 'Redirect Chain (4)', analyzer: 'Redirect Chain', abuseType: 'Suspicious' },
  { domain: 'track3r-analytics.net',    verdict: 'WARNING', score: 55, trigger: 'EasyPrivacy',        analyzer: 'Blocklist',      abuseType: 'Tracker'    },
  { domain: 'suspicious-domain.pw',     verdict: 'WARNING', score: 48, trigger: 'Heuristic score',    analyzer: 'ML.NET',         abuseType: 'Suspicious' },
  { domain: 'click-monetize-now.cc',    verdict: 'WARNING', score: 52, trigger: 'Redirect + TLD risk',analyzer: 'ML.NET',         abuseType: 'Suspicious' },
];

const CLEAN_SET = [
  'github.com','stackoverflow.com','npmjs.com','microsoft.com','google.com',
  'cloudflare.com','hdfc.co.in','sbi.co.in','archive.org','wikipedia.org',
  'ubuntu.com','debian.org','nodejs.org','reactjs.org','vitejs.dev',
  'electronjs.org','mozilla.org','w3.org','ietf.org','rfc-editor.org',
];

const DNS_TYPES = ['A','AAAA','MX','TXT','CNAME','NS'];

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  scanned: 0,
  blocked: 0,
  warned:  0,
  startTime: Date.now(),
  rolling: [],  // last 1000 events
};

let _interval = null;
let _db = null;
let _flushCounter = 0;

function init(db) {
  _db = db;
}

function _makeEntry() {
  const r = Math.random();
  const type = DNS_TYPES[Math.floor(Math.random() * 3)];
  const lat  = Math.floor(Math.random() * 22) + 2;
  const now  = new Date().toISOString();

  if (r < 0.10) { // threat
    const t = THREAT_SET[Math.floor(Math.random() * THREAT_SET.length)];
    return { ...t, time: now, type, latency: lat };
  }
  if (r < 0.18) { // warn
    const w = WARN_SET[Math.floor(Math.random() * WARN_SET.length)];
    return { ...w, time: now, type, latency: lat };
  }
  // Check against filter lists for realistic verdicts
  const domain = CLEAN_SET[Math.floor(Math.random() * CLEAN_SET.length)];
  const check  = filterLists.isBlocked(domain);
  if (check.blocked) {
    return { domain, verdict: 'BLOCKED', score: 70 + Math.floor(Math.random()*25), trigger: check.listName, analyzer: 'Blocklist', abuseType: 'Malware', time: now, type, latency: lat };
  }
  return { domain, verdict: 'CLEAN', score: Math.floor(Math.random()*12)+1, trigger: 'None', analyzer: 'Whitelist/Cache', abuseType: 'None', time: now, type: DNS_TYPES[Math.floor(Math.random()*DNS_TYPES.length)], latency: lat };
}

function _persistBatch() {
  if (!_db) return;
  try {
    const recent = state.rolling.slice(0, 10);
    const insert = _db._db?.prepare('INSERT OR IGNORE INTO dns_query_log (domain,verdict,score,trigger,analyzer,abuse_type,latency,query_type) VALUES (?,?,?,?,?,?,?,?)');
    if (!insert) return;
    for (const e of recent) {
      if (e.verdict !== 'CLEAN') {
        insert.run(e.domain, e.verdict, e.score, e.trigger, e.analyzer, e.abuseType, e.latency, e.type);
      }
    }
  } catch {}
}

function start() {
  filterLists.load();
  if (_interval) return;
  _interval = setInterval(() => {
    const count = Math.floor(Math.random() * 3) + 1;
    const entries = [];
    for (let i = 0; i < count; i++) {
      const e = _makeEntry();
      state.scanned++;
      if (e.verdict === 'BLOCKED') state.blocked++;
      if (e.verdict === 'WARNING') state.warned++;
      state.rolling.unshift(e);
      if (state.rolling.length > 1000) state.rolling.pop();
      entries.push(e);
    }
    emitter.emit('entries', entries);
    _flushCounter++;
    if (_flushCounter % 100 === 0) _persistBatch();
  }, 850);
}

function stop() { clearInterval(_interval); _interval = null; }

function getStats() {
  return {
    scanned: state.scanned,
    blocked: state.blocked,
    warned:  state.warned,
    startTime: state.startTime,
    durationSeconds: Math.floor((Date.now() - state.startTime) / 1000),
  };
}

function getFeed(limit = 30) { return state.rolling.slice(0, limit); }

module.exports = { emitter, init, start, stop, getStats, getFeed };
