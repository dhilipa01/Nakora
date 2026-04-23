# nakora

**System-wide DNS Security Shield — on-device, privacy-first, CISA PDNS-inspired**

Prototype v0.1.0 | Electron + React | Zero Trust IPC | .NET 8 / WinUI 3 architecture target

---

## Quick Start

```bash
# Prerequisites: Node.js 18+
npm install
npm run rebuild        # rebuilds better-sqlite3 for your Electron version
npm start              # launches Electron (starts Vite dev server + Electron together)
```

Browser-only preview (no real OS data, IPC disabled):
```bash
npx vite src/renderer  # opens http://localhost:5173
```

Build distributable installer:
```bash
npm run dist           # validates → builds → packages → dist-electron/
```

---

## Architecture Map

```
nakora/
├── src/
│   ├── main/                          ZONE 1 — Main Process (Node.js, full OS access)
│   │   ├── index.js                   Entry: single-instance, tray, protocol, services, IPC
│   │   ├── window.js                  BrowserWindow factory — hardened webPreferences
│   │   ├── tray.js                    System tray — green/amber/red threat-level icon
│   │   ├── protocol.js                Custom app:// protocol — path-traversal prevention
│   │   ├── csp.js                     CSP single source of truth (connect-src 'none')
│   │   ├── ipc/
│   │   │   ├── router.js              Master IPC: rate-limit → validate → audit → dispatch
│   │   │   ├── rate-limiter.js        Token bucket per channel
│   │   │   ├── validators/            domain, settings, threat, export, etw validators
│   │   │   └── handlers/              dns, domains, settings, etw, system, export handlers
│   │   ├── services/
│   │   │   ├── dns-simulator.service.js    EventEmitter DNS feed, filter-list integrated
│   │   │   ├── etw-monitor.service.js      Real CPU/mem/procs/conns + simulated ETW events
│   │   │   ├── filter-lists.service.js     In-memory Sets, O(1) isBlocked() lookup
│   │   │   ├── system-metrics.service.js   os module wrapper, PowerShell for processes
│   │   │   └── audit-log.service.js        Structured log → SQLite, rotates at 10k entries
│   │   └── storage/
│   │       ├── database.js            better-sqlite3 + WAL + migrations + in-memory fallback
│   │       ├── store.js               AES-256 electron-store, machine-derived key
│   │       ├── keychain.js            keytar — OS Credential Manager for API keys
│   │       └── migrations/001.sql     Schema with CHECK constraints, seeded whitelist
│   │
│   ├── preload/
│   │   └── index.js                   ZONE 2 — 26-channel strict whitelist, type guards
│   │
│   └── renderer/                      ZONE 3 — React UI (sandboxed, no Node.js)
│       ├── index.html / index.jsx     Entry, CSP meta defence-in-depth
│       ├── App.jsx                    Root, context providers
│       ├── theme.js                   3 themes: original / darker / hacker
│       ├── styles/all.css             CSS tokens, reset, layout grid, matrix aesthetic
│       ├── context/                   AppState + Theme contexts
│       ├── hooks/                     usePolling, useDnsStats, useDnsFeed, useEtwMetrics, useSettings
│       ├── components/
│       │   ├── layout/                AppShell, Header, Sidebar, StatusBar, BurgerButton
│       │   └── shared/                StatCard, Toggle, Tag, ProgressBar, FeedItem,
│       │                              DetailDrawer, ConfirmButton, AccordionSection, FilterBar
│       └── components/pages/
│           ├── Dashboard/             3-zone: stat tiles / threat+health / verdicts feed
│           ├── ThreatLog/             Filterable sortable paginated table
│           ├── DnsMonitor/            Stat strip + FIRST.org bars + ETW panel + query stream
│           ├── DomainManager/         3-col: filter lists / blacklist / whitelist
│           ├── Settings/              Accordion: core/advanced/API/budgets/GDPR/themes
│           └── Export/                Real JSON export via native save dialog
│
├── data/filter-lists/                 7 bundled blocklist files (coinblocker, urlhaus, etc.)
├── scripts/
│   ├── build.js                       Pre-build: validates filter files, writes buildMeta
│   └── validate-csp.js               Post-build: verifies CSP in dist/index.html
├── SECURITY.md                        Zero Trust model, vulnerability policy
└── electron-builder.yml               NSIS + portable targets, asar packing
```

---

## What Is Real vs Simulated

| Feature | Real | Notes |
|---|---|---|
| CPU usage | ✅ | `os.cpus()` delta per core |
| Memory used/free | ✅ | `os.totalmem()` / `os.freemem()` |
| Network connections | ✅ | `netstat -n` / `ss -nt` |
| Top processes by CPU | ✅ | PowerShell `Get-Process` (Windows) / `ps` (Linux/macOS) |
| Export JSON | ✅ | Real save dialog, real system/session/config data |
| SQLite storage | ✅ | better-sqlite3, WAL mode, migrations |
| API key storage | ✅ | keytar → Windows Credential Manager |
| Filter list lookup | ✅ | In-memory Set per list file |
| DNS query stream | ⚠️ | Simulated — no kernel DNS tap |
| ETW kernel events | ⚠️ | Simulated — labelled in UI |
| ML.NET inference | ⚠️ | Toggle present, ONNX not bundled |
| PQC signing | ⚠️ | Toggle present, not cryptographically active |

---

## Bundled Filter Lists

| List | Source | Entries (prototype) |
|---|---|---|
| uBlock urlhaus-filter | gitlab.com/malware-filter | ~20 (full: 500k+) |
| EasyPrivacy | easylist.to | ~10 |
| Peter Lowe's Blocklist | pgl.yoyo.org | ~10 |
| OpenPhish Feed | openphish.com | ~15 |
| PhishTank DB | phishtank.org | ~10 |
| CoinBlockerLists | zerodot1.gitlab.io | ~44 |
| CISA Known-Bad Indicators | cisa.gov | ~7 |

Production fetches all weekly. Prototype uses static bundled snapshots.

---

## Compliance

- **GDPR** Art. 32 (minimisation), Art. 17 (erasure), Art. 20 (portability), Art. 25 (privacy by design)
- **ISO 27001** — access controls, audit logging, incident detection architecture
- **FIRST.org DNS Abuse Techniques Matrix** — DGA, tunneling, cache poisoning detection categories
- **CISA PDNS** model — on-device equivalent of government Protective DNS

---

## Phased Roadmap

| Phase | Scope |
|---|---|
| 1 (this prototype) | Architecture, UI, real OS metrics, SQLite, filter lists, export |
| 2 | DNS interception (Windows DNS API), homoglyph, redirect chain, ML.NET ONNX |
| 3 | DGA/tunneling detection, language irregularity NLP, MSIX packaging |
| Stretch | PQC (BouncyCastle Dilithium3), Go microservice (abhizaik port), Microsoft Store |
