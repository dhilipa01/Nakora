# CLAUDE.md — nakora Project Context

> **Master reference for nakora project.** All decisions, discussions, builds consolidated here. Handover doc — any future session reads this first before architectural or implementation decisions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project History & Naming](#2-project-history--naming)
3. [Core Concept](#3-core-concept)
4. [Hard Requirements (Non-Negotiable)](#4-hard-requirements-non-negotiable)
5. [Feature Set](#5-feature-set)
6. [Software Analysis Summary](#6-software-analysis-summary)
7. [Tools, Frameworks & Dependencies](#7-tools-frameworks--dependencies)
8. [Critical Architectural Problem: DoH/DoT](#8-critical-architectural-problem-dohdot)
9. [Scope Risk Assessment](#9-scope-risk-assessment)
10. [Unfulfilled Edge Cases](#10-unfulfilled-edge-cases)
11. [Competitive Landscape](#11-competitive-landscape)
12. [Tools Evaluated and Decided](#12-tools-evaluated-and-decided)
13. [Prototype Build Progression](#13-prototype-build-progression)
14. [Zero Trust Architecture](#14-zero-trust-architecture)
15. [Current Build Status — Real vs Simulated](#15-current-build-status--real-vs-simulated)
16. [Backend Language Evaluation](#16-backend-language-evaluation)
17. [Final Recommended Architecture](#17-final-recommended-architecture)
18. [Phased Roadmap](#18-phased-roadmap)
19. [Compliance Summary](#19-compliance-summary)
20. [Open Questions](#20-open-questions)

---

## 1. Project Overview

**nakora** = native Windows 11 desktop app — system-wide DNS Security Shield with on-device ML phishing + cryptojacking detection. Fills market gap: no existing consumer tool combines **on-device inference** (no cloud) + **DNS-level system-wide protection** (all apps, not browser-only) + **privacy-preserving local-first storage**.

Inspired by + architecturally compatible with **CISA Protective DNS** model — on-device equivalent, not enterprise enrollment.

---

## 2. Project History & Naming

- **Originally:** SafeSurf
- **Renamed:** nakora (Oct/Nov 2025 mid-session)
- All docs, code identifiers, UI branding use **nakora** (lowercase).
- Legacy SafeSurf refs in older docs (main_info_txt.docx etc.) = same project.
- App ID: `dev.nakora.prototype` (prototype); `dev.nakora.app` (production).

---

## 3. Core Concept

Intercept DNS queries at Windows system level → run parallel heuristic + ML analyzers against each domain → produce trust score + verdict → block/warn/allow per thresholds → log locally (never transmit) → present WinUI 3 dashboard.

Key architectural decision: **resolver and analyzers are separate concerns.** Resolver must be fast (<30ms). Analyzers can be slower (async, 100–500ms), run parallel, feed verdict engine that refines over time.

---

## 4. Hard Requirements (Non-Negotiable)

| # | Requirement | Source |
|---|---|---|
| 1 | **<30ms DNS resolution latency** | Non-functional spec |
| 2 | **<5% CPU overhead** continuous monitoring | Non-functional spec |
| 3 | **System-wide** Windows DNS interception (not browser-scoped) | Core differentiation |
| 4 | **Parallel stateless analyzers** (pluggable module pattern) | Software Analysis doc |
| 5 | **On-device ML inference** (ONNX model, no cloud dependency) | GDPR + differentiation |
| 6 | **ETW-based cryptojacking detection** (Windows Event Tracing) | Feature requirement |
| 7 | **SQLite local storage** with DPAPI encryption | GDPR Art. 32 |
| 8 | **GDPR compliance** — Art. 17 (erasure), Art. 20 (portability), Art. 32 (minimization) | Regulatory |
| 9 | **Windows Credential Manager** for API key storage (never plaintext) | Security |
| 10 | **WinUI 3 desktop UI** (native, not Electron in production) | Fluent Design compliance |
| 11 | **Runs as Windows service** with least-privilege AppContainer isolation | Security |
| 12 | **<5% false positive rate**, **<5% false negative rate** on phishing classifier | Accuracy spec |
| 13 | **ISO 27001 alignment** (audit logging, access controls) | Regulatory |
| 14 | **WCAG 2.2 AA** accessibility on all 3 themes | UX spec |

---

## 5. Feature Set

### Phase 1 (Core — MUST ship)
- DNS interception with local protective DNS resolver
- HTTPS/certificate transparency checks
- Domain age/reputation via WHOIS/RDAP
- PhishTank + OpenPhish feed integration
- Whitelist/blacklist with precedence rules (whitelist always wins)
- WinUI 3 dashboard with real-time verdict feed
- Windows Toast notifications for blocked domains
- MSIX installer with EV code signing

### Phase 2 (Advanced Detection)
- Homoglyph / Punycode / Cyrillic detector
- Redirect chain analyzer (up to 8 hops, short-URL expansion)
- Basic ML.NET inference with ONNX model (XGBoost-trained on 71k PhishTank samples from Detection-Chrome-Extension dataset)

### Phase 3 (Advanced Threats)
- DGA/DNS tunneling detection (FIRST.org DNS Abuse Matrix)
- Cryptojacking detection via ETW (CPU + DNS correlation)
- English language irregularity NLP analyzer
- DoH/DoT detection with user warning

### Stretch / Optional
- **PQC (Post-Quantum Cryptography)** — BouncyCastle.NET Dilithium3 signatures on outbound API calls (rationale: future-proof API auth, academically credible — keep, academic play relevant)
- **Rust analyzer microservice** — replaces Go; all untrusted data (DNS packets, HTTP responses) parsed in memory-safe Rust. See §16 and §17 for rationale.
- **Three themes:** Original (green/black), Darker, Hacker (scanlines)
- **Localization:** 3–5 locales (EN/HI/DE/JA/ES via Windows .resw files)
- **Pi-hole integration** — deferred to multi-OS phase (last). Linux/network-wide; only relevant once nakora expands beyond Windows.

### Cut from scope (discussed and rejected)
- Chinese/Russian commercial site whitelist ("janky and discriminatory" per project's own notes; high false-positive + legal/reputational risk)

---

## 6. Software Analysis Summary

### Cohesion & Coupling
- **High cohesion:** Each analyzer has one job. Homoglyph, redirect chain, cert transparency, domain age, URL patterns, content signals — separate modules, single responsibility.
- **Low coupling:** Analyzers stateless, take only `(url, context, dnsQuery)`, return independent signals. No shared state. No analyzer calls another.
- **Orchestrator:** Windows service wires resolver, fans out to analyzers via `Task.WhenAll` / `Parallel.ForEach`, feeds signals into aggregator.
- **Scoring/verdict engine:** Weight matrix for combining signals. **Must be data-driven** — weights in versioned policy file with automated regression tests against labeled holdout set.

### Function Point Estimate
- **UFP:** 65–95
- **VAF:** 1.05–1.20 (performance-critical, security-critical, moderate-high complexity)
- **Adjusted FP:** 70–115
- **Honest reassessment:** real scope ~3x this estimate. Phased approach mandatory.

### FMEA Top Risks (RPN = Severity × Occurrence × Detection)

| Failure Mode | RPN | Priority |
|---|---|---|
| AV false positive on installer/service | **240** | Critical |
| False negative on DGA/tunneling | **216** | Critical |
| Cryptojacking detection failure | **200** | High |
| False positive on intranet/banking | **120** | Medium |
| Unauthorized DNS redirection / privilege escalation | **120** | Medium |
| Privacy breach (unintended data collection) | **100** | Medium |
| Scoring logic regression | **96** | Medium |
| Performance degradation | **84** | Low |
| API dependency failure (PhishTank/VirusTotal) | **56** | Low |

### Code Quality Infrastructure (Decided)
- ESLint + `eslint-plugin-security` + `eslint-plugin-no-unsanitized` (JS/Node prototype)
- SecurityCodeScan + `dotnet format` (C# production)
- OWASP Dependency-Check
- GitHub Dependabot
- **Mutation testing via Stryker.NET** (added after review — missing from original spec)
- Serilog structured JSON logging (error + info levels)
- Application Insights for production perf monitoring

---

## 7. Tools, Frameworks & Dependencies

### Production stack (decided)
- **Frontend UI:** WinUI 3 + XAML + C# with Fluent Design System; React + shadcn/ui (Electron prototype + Tauri WebView layers)
- **Backend core:** C# / .NET 8 Windows service (Windows-required APIs only — ETW, ML.NET, Credential Manager, WinUI IPC)
- **Analyzer microservice:** **Rust** / tokio (replaces Go — see §16, §17). All untrusted data flows through Rust.
- **DNS library:** ARSoft.Tools.Net (Apache 2.0) — replaces Technitium DNS embed (GPL-3.0 killed). Full C# DNS server + client.
- **Database (ops):** SQLite via Microsoft.Data.Sqlite / EF Core with DPAPI encryption — logs, audit, blocklist, whitelist, settings
- **Database (analytics/ML):** DuckDB (MIT) — feature vectors, model metadata, threat analytics, training data queries. 20-50x faster than SQLite on aggregations.
- **ML:** Python (Scikit-learn, XGBoost, Jupyter) for training → ONNX export → ML.NET for inference
- **Security/Network:** ARSoft.Tools.Net, RDAP (preferred over WHOIS)
- **ETW:** `Microsoft.Diagnostics.Tracing.TraceEvent` NuGet (C# only — no Rust/Go equivalent)
- **IPC (service↔analyzer):** gRPC — `tonic` (Rust) ↔ `protobuf-net.Grpc` (C#). HTTP/JSON rejected.
- **PQC:** BouncyCastle.NET (Dilithium3 signatures)
- **Packaging:** NSIS installer (primary distribution); MSIX for Microsoft Store (Phase 3/stretch)
- **Initial distribution:** GitHub Releases (free, CI/CD via GitHub Actions)

### APIs & Feeds (decided)
- **PhishTank** — community-verified phishing DB (hash URLs with SHA-256 before querying for GDPR)
- **OpenPhish** — daily feed download, parse, cache in SQLite (complements PhishTank, different source → different coverage)
- **VirusTotal** — multi-engine URL reputation (optional, requires API key)
- **CoinBlockerLists** — known mining pool domains for ETW correlation
- **CISA PDNS Fact Sheet** — architectural reference + indicator feeds
- **FIRST.org DNS Abuse Techniques Matrix** — methodology authority for DGA/tunneling/poisoning detection

### Testing
- xUnit / NUnit (unit)
- Windows Application Driver / Appium (WinUI flows)
- Postman (API)
- Windows Performance Monitor + Application Insights (perf)

### Observability
- **Sentry** (approved — has .NET SDK, essential for crash reporting in background service)
- **PostHog** self-hosted — **confirmed, use this** (MIT license except `ee/` dir; free up to 100k events/mo self-hosted; 1M/mo cloud free tier). Drop Application Insights — redundant.

---

## 8. Critical Architectural Problem: DoH/DoT

Most important gap to address in documentation and design.

### Why DoH exists
DNS queries were historically plaintext over UDP port 53 — anyone in network path (ISP, coffee shop router, govt) could see every domain visited even with HTTPS pages. DoH wraps DNS queries inside HTTPS on port 443, indistinguishable from normal web traffic. Chrome/Firefox/Edge enable DoH by default to bypass ISP DNS manipulation.

### The problem for nakora
When Chrome uses DoH, it opens HTTPS connection directly to `dns.google` or `cloudflare-dns.com`. Windows' system DNS stack never sees query. **nakora's DNS interception layer completely bypassed for that browser.**

### Mitigation options (ranked by complexity)

1. **Detect and notify** *(recommended as Phase 1)*
   - Monitor for known DoH resolver IPs (8.8.8.8, 1.1.1.1, etc.) on port 443
   - Warn user via dashboard + Toast that browser-level DNS protection is reduced
   - Transparent, achievable, no UX violation

2. **Group Policy / Registry enforcement** *(Phase 2)*
   - Disable DoH in Chrome/Edge via documented registry keys (enterprise-standard pattern)
   - Installer offers as opt-in with clear consent dialog

3. **Network-level interception via WFP driver** *(Phase 3+ or never)*
   - Windows Filtering Platform kernel-mode driver
   - Intercepts + decrypts DoH traffic
   - Requires kernel-level code signing, massively increases AV flagging risk
   - **NOT realistic scope** for this project

### For project approval
Frame as: *"Scope includes detection of DoH bypasses with user notification; registry-based opt-in enforcement for supported browsers is a Phase 2 feature."*

---

## 9. Scope Risk Assessment

Original spec honest: this is **3–4 substantial projects stitched together**. Initial FP estimate 70–115 undercounts significantly.

Each individually is weeks of work:
- System-level DNS resolver + interceptor
- Parallel ML inference pipeline with ONNX
- WinUI 3 desktop app with 3 themes
- WCAG 2.2 compliance + 3–5 locales
- English language irregularity NLP detector
- Cryptojacking via ETW
- PQC for API calls
- GDPR data pipeline with export/deletion
- Optional Go microservice
- Python ML training pipeline with MLflow

**Practical risk:** building 60% of each feature instead of 100% of core ones. For hackathon or academic evaluator, focused vertical slice (DNS resolver + core heuristics + clean UI + solid testing) scores higher than ambitious incomplete full system.

**Phased approach mandatory** — see §18.

---

## 10. Unfulfilled Edge Cases

Architecturally significant, not minor oversights:

### DoH/DoT bypass
Addressed in §8.

### VPN interference
VPN takes over DNS routing when active. Protective DNS resolver may be bypassed, or conflict with VPN's DNS causing resolution failures. **Mitigation:** detect VPN activation via Windows WMI (`MSFT_NetAdapter`), gracefully degrade, notify user.

### Captive portals
Hotel Wi-Fi, airports, corporate captive auth pages intercept DNS, return fake responses. Heuristics flag these as malicious (wrong domain, cert mismatch, redirect chain) — FPs at exactly the moment users need internet. **Mitigation:** captive portal detection via `http://www.msftconnecttest.com/connecttest.txt` probing, relaxed rules when detected.

### CDN-hosted phishing
Phishing pages on Cloudflare / CloudFront / GitHub Pages have clean trusted old parent domains. DNS-level analysis passes them through. **Mitigation:** content-level analysis (forms, scripts, visual similarity) must integrate with DNS resolver — needs explicit latency budget (see below).

### <30ms target conflict with real-time API checks
PhishTank/VirusTotal API calls are 50–200ms. Cannot be inline. **Resolution:** two latency budgets:
- **Initial DNS resolution:** <30ms, local cache + fast heuristics only
- **Full scan:** async, several hundred ms, updates dashboard after-the-fact, may show brief interstitial

### Multi-user Windows
Resolver runs per-user or system-wide? Per-user whitelists when service runs as SYSTEM? **Resolution:** service runs system-wide; per-user preferences in user profile SQLite; shared blocklist cached globally.

### English Language Irregularity Detector — highest FP risk
Detector must handle:
- Major English variants: British, Irish, Indian, Canadian, American, Singaporean, **Australian, South African, Nigerian, Kenyan** (last four missing from original spec)
- Non-native speaker legitimate sites
- Machine-translated legitimate sites (e.g., small e-commerce from non-English-first countries)
- Regional dialects
- WordPress / Squarespace / Wix / Shopify storefronts with imperfect copy
- E-commerce with user-generated reviews

**Mitigation:** treat as auxiliary signal with low weight, not primary trigger. Exception list driven by site platform detection (WordPress, Shopify headers) + TLD-based regional rules.

---

## 11. Competitive Landscape

| Product | What it does | Gap nakora fills |
|---|---|---|
| Windows Defender SmartScreen | URL reputation at browser/OS level | No DNS-level system-wide, no ML |
| Chrome Safe Browsing / Edge SmartScreen | Browser-level phishing detection | Browser-only, not system-wide |
| Pi-hole | DNS-level network-wide blocking | Requires separate device, Linux-only |
| NextDNS, Cloudflare for Families | Protective DNS as service (cloud) | Cloud-dependent, privacy compromise |
| Cisco Umbrella | Enterprise PDNS | Not consumer-grade |
| Quad9 | Free privacy-preserving PDNS resolver | Single service, no local ML |

**Genuine differentiation:**
1. On-device ML inference (no cloud for core detection)
2. DNS-level system-wide (all apps, not browser-scoped)
3. FIRST.org DNS Abuse Matrix integration (DGA, tunneling, cache poisoning)
4. Privacy-preserving (no third-party DNS routing)
5. Consumer Windows 11 target (not enterprise-only)

### Adoption barriers
- **EV code signing cost:** several hundred USD/year, identity verification required — **without this, AV tools flag installer**
- **Microsoft Store certification** for safe distribution
- **UAC prompt fatigue:** MSIX installer needs clear plain-language explanation of why system-level access required. Research shows significant abandonment at UAC prompts without clear framing.

---

## 12. Tools Evaluated and Decided

### KEPT (each earns its place)

| Tool | Role | Why |
|---|---|---|
| **ARSoft.Tools.Net** | C# DNS server + client library | **Apache 2.0** — commercial safe, embeddable. Replaces Technitium (GPL-3.0). Full DNS server + client + SPF. NuGet: `ARSoft.Tools.Net`. |
| **Technitium DNS Server** | Architecture reference only — do NOT embed | GPL-3.0 kills commercial/Store path. Study their DNS resolver impl but write own layer via ARSoft. |
| **abhizaik/phishing-detection** | Analyzer logic reference (port to Rust) | Production-grade analyzer logic — RDAP, redirect chain, cert anomaly, homoglyph, TLD scoring. Port logic to Rust microservice. |
| **Phishing-Detection-System/Detection-Chrome-Extension** | ML training data + XGBoost baseline | 71,677-URL labeled dataset + `phishing_classifier.pkl`. Export to ONNX for ML.NET consumption. |
| **dnscrypt-proxy** | Windows service + DoH handling reference | Mature Go DNS proxy. Windows installer patterns, AV-friendly code signing, DoH interception design. |
| **OpenPhish** | Secondary phishing feed | Free, updated 2x daily, ~1,500–2,500 URLs. Complements PhishTank (different source → low coverage overlap). |
| **FIRST.org DNS Abuse Matrix** | Methodology authority | Not software — citable technical reference for DGA/tunneling/cache-poisoning detection. Credibility marker. |
| **uBlock filter lists** | Curated blocklist sources | EasyList, urlhaus-filter. MIT/CC licensing permits redistribution. Study uBlock's Bloom filter approach for O(1) lookup. |
| **Sentry** | Crash reporting | .NET SDK works for desktop. Essential for background service running at 2am when user has no console. |
| **PostHog** (self-hosted) | Product analytics / observability | MIT license (except `ee/` dir). Free ≤100k events/mo self-hosted. Replaces Application Insights. |
| **shadcn/ui** | React component library (Electron + Tauri WebView layers) | Tailwind + Radix primitives, MIT. For non-WinUI3 React surfaces (Electron prototype renderer, future Tauri WebView). |
| **DuckDB** | Embedded analytics / ML data layer | MIT. Columnar, in-process, zero server overhead. 20-50x faster than SQLite on aggregations. For feature vectors, model metadata, threat analytics. |
| **hickory-dns** (Rust) | DNS packet parsing in Rust microservice | MIT/Apache 2.0. Formerly trust-dns. Handles raw UDP DNS packets in memory-safe Rust — highest security value. |
| **tonic** (Rust) | gRPC server in Rust microservice | Apache 2.0. Production-grade Rust gRPC. Pairs with `protobuf-net.Grpc` on C# side. |
| **krabsetw** | Alternative ETW binding (evaluate Phase 3) | MIT, Microsoft OSS. Lower memory than TraceEvent. Native C++ + .NET API. Evaluate if TraceEvent footprint exceeds <5% CPU budget. |

### CUT (wrong scope, redundant, or incompatible)

| Tool | Why cut |
|---|---|
| **Pi-hole** | Network-wide, Linux-only. Deferred to multi-OS phase (last). No usable code for Windows phase. |
| **Cloudflare for Families** / **NextDNS** | Cloud DNS services, not OSS tools. Competitor reference only. |
| **Quad9** | Cloud resolver. Market context only. |
| **MISP Project** | Enterprise SOC. Needs separate MISP server, STIX/TAXII integration. Marginal benefit over PhishTank+OpenPhish+CISA. Removed. |
| **Supabase** | Cloud PostgreSQL. Contradicts local-first SQLite architecture. |
| **Clerk** | Web auth middleware. WinUI 3 uses Windows Credential Manager + Windows Hello. |
| **Pinecone** | Cloud vector DB. Contradicts on-device ML design. |
| **NanoClaw** | Personal AI agent for WhatsApp/Telegram. macOS/Linux. Node.js. Zero overlap. |
| **OpenClaw** | Same category as NanoClaw. Cut. |
| **HTTP/JSON for IPC** | Replaced by gRPC. Type-safe, lower latency, streaming capable. |

### OPTIONAL
- **Claude API** — could power NLP features but adds API cost + cloud dependency. Evaluate carefully.

---

## 13. Prototype Build Progression

Three iterations built during session:

### Iteration 1: React Artifact Mock UI
- Single React component with simulated data
- Three themes (Dark, Hacker, Light)
- Five sections (Dashboard, Alerts, Analyzers, Lists, Settings)
- Purpose: demonstrate aesthetic direction + feature set for approval
- **Artifact: `SafeSurf_UI_Prototype.jsx`** (legacy name pre-rename)

### Iteration 2: Electron v1 (`nakora.zip`)
- Full Electron app with main process + preload + React renderer
- Real OS metrics via `os.cpus()` / `os.freemem()` / PowerShell / netstat
- Real JSON export via native save dialog
- Zustand state + localStorage persistence
- Six pages (Dashboard, Threat Log, DNS Monitor, Domain Manager, Settings, Export)
- Purpose: demonstrate full UX + real data integration

### Iteration 3: Electron v2 (`nakora-v2.zip`) — Architecture-compliant
Matches full architecture spec in `protoype_Architecture.txt`:
- **Zone 1 (Main):** `csp.js`, `window.js`, `tray.js`, `protocol.js`, IPC router with rate limiter + validators + handlers, services (dns-simulator, etw-monitor, filter-lists, system-metrics, audit-log), storage (database, store, keychain)
- **Zone 2 (Preload):** strict 26-channel whitelist, client-side type guards
- **Zone 3 (Renderer):** React + context providers + hooks + 6 pages + layout + shared primitives
- Real `better-sqlite3` with WAL mode + migrations + in-memory fallback
- Real `keytar` → Windows Credential Manager
- Real `electron-store` AES-256 encryption with machine-derived key
- Real bundled filter-list files actually loaded + used
- Tray icon changes green/amber/red based on blocked/scanned ratio
- System tray with 15-minute pause toggle
- CSP enforced via `onHeadersReceived` + meta tag defence-in-depth

**Architecture completion:** ~52% of spec files built (39 of 74). Logic fully present; file granularity consolidated (e.g., `combined.handler.js` merges four spec handler files).

---

## 14. Zero Trust Architecture

Electron runs two processes. In nakora's design:

- **Main process** — full Node.js / OS access. Trusted.
- **Renderer process** — treated as untrusted. Like webpage from internet. No direct Node, no filesystem, no OS.
- **Preload script** — only bridge. Locked, schema-validated, minimum-surface API exposed via `contextBridge.exposeInMainWorld('nakora', api)`.

### Hard rules enforced

1. `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`
2. CSP `connect-src 'none'` — **renderer cannot make any network request.** All external calls routed through main process.
3. No `innerHTML`, no `eval()`, no `new Function()`, no dynamic `require()` — enforced by ESLint rules `no-eval`, `no-unsanitized/property`
4. No `remote` module, no `webview` tag, new-window handler denies all
5. Every IPC handler wrapped in: rate limiter → schema validator → sanitiser → audit logger → dispatch
6. Structured response envelope: `{ success, data, error }` — never throws raw errors to renderer
7. API keys stored in Windows Credential Manager via `keytar`, never in `electron-store` or plaintext files
8. All SQL queries use parameterised statements — no string concatenation ever
9. `execFile` with fixed argument arrays — no string interpolation of user input into PowerShell

### IPC channel whitelist (26 channels)
```
dns:get-stats, dns:get-feed, dns:get-query-log, dns:clear-log
domains:get-whitelist, domains:get-blacklist, domains:add-whitelist,
  domains:remove-whitelist, domains:add-blacklist, domains:remove-blacklist,
  domains:get-filter-lists, domains:toggle-filter-list
settings:get-settings, settings:save-settings, settings:test-connection,
  settings:reset-to-defaults, settings:set-api-key, settings:get-api-key-status
etw:get-cpu, etw:get-memory, etw:get-connections, etw:get-processes, etw:get-events
system:get-info, system:get-version, system:get-session, system:get-audit-log
export:get-preview, export:generate
```

### Rate limits (token bucket per channel)
- `dns:get-stats`: 10/sec
- `domains:add-whitelist`: 5/sec
- `settings:save-settings`: 2/sec
- `export:generate`: 1/10sec
- `settings:reset-to-defaults`: 1/10sec

---

## 15. Current Build Status — Real vs Simulated

### ✅ Genuinely real (works with live data)

| Feature | Implementation |
|---|---|
| CPU usage per-core | `os.cpus()` delta between two samples |
| Memory used/free/total | `os.totalmem()` / `os.freemem()` |
| Active network connections | `netstat -n` (Windows) / `ss -nt` (Linux) |
| Top processes by CPU | PowerShell `Get-Process` fixed-arg / `ps` fallback |
| SQLite with WAL mode + migrations | `better-sqlite3` + in-memory mock fallback |
| Filter list loading + O(1) blocklist lookup | `fs.readFileSync` of bundled `.txt`/`.json` → in-memory `Set` per list |
| Keychain API key storage | `keytar` → Windows Credential Manager |
| AES-256 settings encryption | `electron-store` with machine-derived key |
| JSON export via native save dialog | `dialog.showSaveDialog` + real `fs.writeFileSync` |
| System tray icon colour based on threat ratio | Green <5%, amber 5–15%, red >15% blocked |
| CSP enforcement | `onHeadersReceived` + meta tag |
| IPC rate limiter + validators + audit log | Fully enforced on every call |

### ⚠️ Simulated (clearly labelled in code)

| Feature | Status | What's needed for real |
|---|---|---|
| DNS query stream | Randomised from hardcoded threat/clean lists | Windows DNS API integration (DnsClient.NET in C# production) |
| ETW kernel events | Templated messages triggered by DNS simulator | `Microsoft.Diagnostics.Tracing.TraceEvent` NuGet (C# only — not Go) |
| DNS-level blocking | Not implemented — no actual DNS redirect | Local DNS resolver on port 53/5353 OR HOSTS file manipulation OR WFP driver |
| ML.NET / ONNX inference | Toggle exists, label appears on verdicts | ONNX model bundled + ML.NET runtime (C# component) |
| PhishTank / VirusTotal API | Keys stored correctly, test-connection mocked | HTTP client with SHA-256 URL hashing, retry logic, cache layer |
| Homoglyph / DGA / Redirect / NLP analyzers | Labels only | Real regex/entropy/HTTP-follow logic (natural fit for Go microservice) |
| Go microservice | Endpoint configurable, test mocked | The abhizaik port — exists as reference, needs wiring |
| PQC signing | Toggle only | BouncyCastle.NET Dilithium3 in C# outbound HttpClient |

**Summary: infrastructure (security, storage, OS integration, UI) is production-grade. Detection engine is prototype-grade — architecture correct, signal-generating code absent or mocked.**

---

## 16. Backend Language Evaluation

Detailed analysis in `nakora_backend_eval.jsx` artifact. **Updated summary table (session 2 decisions):**

| Language | Verdict | Role |
|---|---|---|
| **C# / .NET 8** | ✅ **STRONG YES** — Windows-required components | ETW, WinUI 3, ML.NET, Credential Manager, MSIX, ARSoft DNS layer |
| **Rust** | ✅ **STRONG YES** — untrusted data boundary | DNS packet parsing, analyzer microservice, feed HTTP clients, filter engine, gRPC server |
| **Go** | ❌ **Replaced by Rust** | Go's security story weaker than Rust for parsing untrusted network data. CGO dependency issues. |
| **Node.js / Electron** | ❌ Prototype only | V8 GC pauses risk <30ms target; ETW via N-API fragile; 150MB binary |

### The core philosophy: Windows as telescope, not foundation

nakora's security model is **Windows-skeptical and network-skeptical**. OS treated as passive lens — used only where Windows APIs strictly required, never trusted as security foundation. Clear language boundary:

- **C# = Windows API caller** — ETW, WinUI, ML.NET, Credential Manager. Microsoft maintains deps. Mature, stable.
- **Rust = external data parser** — DNS packets, HTTP responses, feed JSON. All untrusted. Memory safety = provable attack surface reduction. `#![forbid(unsafe_code)]` on analyzer modules.

Every `unsafe {}` block in Rust is explicit, auditable OS trust boundary crossing. Not possible in C# or Go.

### Industry validation for Rust shift

- **Linus Torvalds 2025:** Rust permanent in Linux kernel. *"I'm going to merge Rust code over a maintainer's objection."* Linux 6.13 = tipping point.
- **Microsoft 2025:** Goal eliminate ALL C/C++ by 2030. Azure CTO banned new C/C++ projects. 36,000 lines Windows kernel + 152,000 lines DirectWrite already rewritten in Rust.
- **NSA:** Formal recommendation to migrate from C/C++ to memory-safe languages.

### C# stays (Windows-required — no alternative)

| Component | Why C# required |
|-----------|----------------|
| ETW (`TraceEvent`) | Microsoft's own lib. No mature Rust/Go equivalent. |
| WinUI 3 shell | XAML + C# only. Period. |
| ML.NET / OnnxRuntime | C# first-class. `ort` Rust crate thinner. |
| Windows Credential Manager | WinRT API = native C#. |
| ARSoft DNS layer | C# library, integrates with .NET service. |
| MSIX packaging | C# toolchain first-class. |

### Rust moves (no Windows dep, handles untrusted data)

| Component | Crate | Security gain |
|-----------|-------|--------------|
| DNS packet parsing | `hickory-dns` (MIT/Apache) | Raw UDP from internet → highest attack surface |
| gRPC server | `tonic` (Apache 2.0) | Type-safe IPC to C# service |
| Feed HTTP clients | `reqwest` + `serde_json` | Untrusted JSON deserialization |
| All analyzers | custom + `regex` | `#![forbid(unsafe_code)]` on entire module |
| Filter list engine | `std::collections::HashSet` | Pure logic, zero OS deps |
| DuckDB interface | `duckdb` crate | ML analytics layer |

### Why Go replaced by Rust

- CGO breaks single-binary deployment (Go's entire value proposition)
- `go-etw` experimental + CGO = Windows-only CI builds, no Linux containers
- Rust memory safety stronger than Go for parsing untrusted network data (actual use case)
- `tokio` async runtime = goroutines equivalent
- `tonic` gRPC = production-grade, widely used
- abhizaik analyzer logic = port to Rust (same logic, safer execution)

### Why not embed Technitium DNS
- **GPL-3.0** — entire project must be GPL. Kills Microsoft Store / commercial path.
- **Replaced by ARSoft.Tools.Net** (Apache 2.0) — full C# DNS server + client, commercial safe.
- Use Technitium as architecture reference only.

### Why OpenPhish stays in
- Free daily feed (~1,500-2,500 URLs)
- Complements PhishTank (different source, low coverage overlap)
- Integration: ~50-line HTTP client + SQLite upsert
- Always include. No reason not to.

---

## 17. Final Recommended Architecture

**Option F (session 2 update):** C# Windows Core + Rust Analyzer Microservice.

> Design principle: **Windows as telescope, not foundation.** C# only where Windows APIs require it. Rust everywhere external/untrusted data is parsed.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        nakora  (Windows 11)                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐    ┌─────────────────────────────────────┐ │
│  │    WinUI 3 Shell     │    │        NaKora.Service.exe           │ │
│  │    (C# / XAML)       │    │        (C# / .NET 8 Windows svc)   │ │
│  │                      │    │                                     │ │
│  │  Dashboard           │◄──►│  ARSoft.Tools.Net  (UDP :5353)     │ │
│  │  Threat Log          │    │  Scoring Engine                     │ │
│  │  DNS Monitor         │    │  ML.NET ONNX Inference  (Ph.2)     │ │
│  │  Domain Manager      │    │  Credential Manager  (WinRT)       │ │
│  │  Settings / Export   │    │  Captive portal probe               │ │
│  └──────────────────────┘    │  DoH Group Policy opt-in  (Ph.2)   │ │
│   named pipe (session-scoped)│                                     │ │
│                              │  ETW  (TraceEvent — Ph.1):          │ │
│                              │   DNS-Client ──► resolver feed      │ │
│                              │   NetworkProfile ──► VPN detect     │ │
│                              │   TCPIP ──► DoH IP alert            │ │
│                              │   Kernel-Process ──► PID log (Ph.3) │ │
│                              │                                     │ │
│                              │  SQLite  (EF Core + DPAPI)          │ │
│                              │   global.db  ← SYSTEM  (blocklist)  │ │
│                              │   user.db×N  ← DPAPI/user (wlist)  │ │
│                              │                                     │ │
│                              │  Sentry  ·  PostHog (self-hosted)   │ │
│                              └─────────────────┬───────────────────┘ │
│                                                │                     │
│                    localhost gRPC  (tonic ↔ protobuf-net.Grpc)      │
│                                                │                     │
│                              ┌─────────────────▼───────────────────┐ │
│                              │   nakora-analyzer  (Rust / tokio)   │ │
│                              │   :8080   #![forbid(unsafe_code)]   │ │
│                              │                                     │ │
│                              │  ├─ hickory-dns  (packet parser)    │ │
│                              │  ├─ homoglyph / Punycode            │ │
│                              │  ├─ dga_entropy  (n-gram, Ph.1.5)  │ │
│                              │  ├─ redirect_chain  (8 hops)        │ │
│                              │  ├─ certificate anomaly             │ │
│                              │  ├─ nlp_irregularity  (Ph.3)        │ │
│                              │  ├─ cdn_content_pass  (async, Ph.3) │ │
│                              │  ├─ filter_list  (HashSet  O(1))    │ │
│                              │  ├─ PhishTank · OpenPhish · VT      │ │
│                              │  └─ DuckDB  (Ph.3 — cryptojacking)  │ │
│                              └─────────────────────────────────────┘ │
│                                                                      │
│  ┌── ETW event sources  (Windows OS — telescope, do not trust) ───┐ │
│  │  DNS-Client  │  TCPIP  │  NetworkProfile  │  Kernel-Process    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌── External data  (Rust zero-trust boundary) ───────────────────┐ │
│  │  PhishTank API · OpenPhish feed · VirusTotal · CoinBlockerList │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌── Distribution ────────────────────────────────────────────────┐ │
│  │  GitHub Releases (Ph.1)  ·  NSIS installer (Ph.1)             │ │
│  │  MSIX + EV cert (Ph.3.5)  ·  Microsoft Store (Ph.3.5)         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Trust boundary map

| Zone | Language | Trust level | What crosses here |
|------|----------|-------------|------------------|
| WinUI 3 shell | C# | UI-trusted | Named pipe to service |
| NaKora.Service | C# | Windows-trusted | ETW events, WinRT calls, ML inference |
| nakora-analyzer | Rust | **Zero-trust** | Raw DNS packets, HTTP responses, feed JSON |
| Windows OS | — | Lens only | Raw bytes, events observed passively |

### Why this split

| Responsibility | Technology | Reason |
|---|---|---|
| DNS layer | C# (ARSoft.Tools.Net) | Apache 2.0, .NET-native, replaces Technitium GPL |
| ETW monitoring | C# (TraceEvent) | Only language with mature ETW — Microsoft's own library |
| ML inference | C# (ML.NET + ONNX) | Microsoft.ML.OnnxRuntime is production-grade |
| WinUI 3 shell | C# + XAML | Native Fluent Design — Fyne/Wails non-native, fail WCAG req |
| Credential Manager | C# (Windows.Security.Credentials) | WinRT API — native C#, no friction |
| Analyzer pipeline | **Rust / tokio** | Memory-safe parsing of untrusted data; `#![forbid(unsafe_code)]` |
| Feed clients | **Rust / reqwest** | Untrusted JSON deserialization, no buffer overflows |
| gRPC server | **Rust / tonic** | Apache 2.0, production-grade, type-safe |
| Filter list engine | **Rust** | Pure logic, zero OS deps, single static binary |

### IPC
- **gRPC only** (HTTP/JSON rejected)
- Localhost gRPC: ~0.3–1ms per call
- Async — DNS resolution path never blocks on analyzer calls
- Analyzers run parallel with DNS resolution, update verdict after-the-fact

### Multi-user architecture
- Service runs as SYSTEM (system-wide blocklist authority)
- Per-user whitelist = `%APPDATA%\nakora\user.db` — DPAPI encrypted with USER token (not SYSTEM)
- Named pipe scoped per Windows session ID
- Service resolves identity via `WindowsIdentity.GetCurrent()` on each IPC call
- No SYSTEM process ever touches user's whitelist

### ETW providers — phased consumption

| Provider | GUID | Phase | Use |
|----------|------|-------|-----|
| `Microsoft-Windows-DNS-Client` | `1C95126E-7EEA-49A9-A3FE-A378B03DDB4D` | **1** — fully consumed | DNS query/response → fed into ARSoft resolver pipeline |
| `Microsoft-Windows-NetworkProfile` | `9EB3D32F-B52B-4425-B694-E57B825D3C5A` | **1** — fully consumed | Adapter changes → VPN detection + graceful degrade |
| `Microsoft-Windows-TCPIP` | `2F07E2EE-15DB-40F1-90EF-9D7BA282188A` | **1** — subscribe + log; DoH IP check active | TCP connections; DoH resolver IP match → Toast warning |
| `Microsoft-Windows-Kernel-Process` | `22FB2CD6-0E7B-422B-A0C7-2FAD1FD0E716` | **1** subscribe+log only → **3** full correlation | Process CPU — cryptojacking PID correlation (Phase 3, needs DuckDB) |

Phase 1: all four providers subscribed + logging. Three fully consumed. Kernel-Process logged only.
Phase 3 cryptojacking: `Kernel-Process` CPU spike (PID X) + `DNS-Client` query to CoinBlockerList domain (PID X) cross-correlated via DuckDB time-series = cryptojacking verdict.

### Alternative paths previously discussed
- **Option A (Pure C#):** single-language simplicity. Still valid for solo dev with no Rust exp.
- **Option B (C# + Go):** superseded by Option F. Go replaced by Rust for security reasons.
- **Option C (Pure Go):** rejected — CGO breaks single-binary, no WinUI 3.
- **Option D (Technitium + C# layer):** rejected — GPL-3.0 kills commercial path. ARSoft replaces.
- **Option E (Rust hot path only):** superseded — Rust scope expanded to full analyzer microservice, not just hot path.

---

## 18. Phased Roadmap

| Phase | Deliverable | Timeline | Status |
|---|---|---|---|
| **0** | React artifact mock UI — feature demo for approval | 1 week | ✅ Done |
| **0.5** | Electron prototype — UX + real OS metrics | 2 weeks | ✅ Done |
| **0.75** | Architecture-compliant Electron v2 — Zero Trust, SQLite, audit log | 2 weeks | ✅ Done |
| **1** | C#/.NET 8 Windows service — ARSoft DNS layer, SQLite, core heuristics, WinUI 3 skeleton; ETW all 4 providers subscribed; DNS-Client fully consumed → resolver; DoH detect-and-notify (TCPIP ETW); captive portal detection; VPN detection (NetworkProfile); NSIS installer + GitHub Releases pipeline | 4–6 weeks | ⏳ Next |
| **1.5** | **Rust** analyzer microservice — homoglyph, redirect chain, cert, domain age, DGA/DNS tunneling entropy, gRPC server | 3–4 weeks | ⏳ |
| **2** | ML.NET + ONNX inference; DoH Group Policy opt-in (registry + consent dialog); multi-user whitelist isolation (DPAPI user token + named pipe per session) | 3–4 weeks | ⏳ |
| **3** | WinUI 3 full parity; DuckDB analytics layer; ETW Kernel-Process + CPU/DNS PID correlation (cryptojacking); language NLP; CDN async content pass | 4–5 weeks | ⏳ |
| **3.5** | MSIX packaging; EV code signing; Microsoft Store submission | 2–3 weeks | ⏳ |
| **Stretch** | PQC (BouncyCastle Dilithium3); EV code signing; MSIX + Microsoft Store; Pi-hole (multi-OS) | 3–4 weeks | ⏳ |

**Total realistic timeline: 23–35 weeks** focused development — ~6–8 months solo or 3–5 months small team.

---

## 19. Compliance Summary

### GDPR
- **Art. 5(1)(e) — storage limitation:** retention window configurable (default 90 days), auto-purge
- **Art. 17 — right to erasure:** Delete All Data button with two-step confirmation, wipes SQLite + electron-store + keychain
- **Art. 20 — right to portability:** Export produces real JSON file via native save dialog
- **Art. 25 — data protection by design:** SHA-256 URL hashing before external API queries by default
- **Art. 32 — security of processing:** AES-256 at rest (DPAPI + electron-store), TLS for APIs, access controls, audit logging

### ISO 27001 (aligned, not certified)
- Access controls: Windows AppContainer isolation
- Audit logging: every IPC call, every settings change, every domain list modification logged to `audit_log` SQLite table
- Incident detection: FMEA-driven risk matrix, structured Serilog JSON logs
- Rotating audit log at 10,000 entries

### WCAG 2.2 AA (target)
- Keyboard navigation on all interactive elements (burger button, toggles, nav items)
- `role="switch"`, `aria-checked`, `tabIndex` on toggles
- Focus rings (1px solid accent colour, 2px offset)
- Contrast ratios meet AA on all 3 themes

### Regulatory references
- **CISA Protective DNS Fact Sheet 2024** — architectural inspiration
- **FIRST.org DNS Abuse Techniques Matrix** — DGA/tunneling/poisoning detection methodology

---

## 20. Open Questions

### Resolved (session 2)

| # | Question | Decision |
|---|----------|----------|
| DNS library | Technitium (GPL) vs custom? | **ARSoft.Tools.Net** (Apache 2.0). Commercial safe. |
| IPC protocol | gRPC vs HTTP/JSON? | **gRPC** (`tonic` ↔ `protobuf-net.Grpc`). HTTP/JSON removed. |
| Analyzer language | Go vs Rust? | **Rust**. Security philosophy + CGO issues in Go. |
| Observability | PostHog vs Application Insights? | **PostHog** self-hosted. MIT, free tier, drop Application Insights. |
| Analytics/ML DB | SQLite only? | **Hybrid**: SQLite (ops) + DuckDB (ML analytics). |
| React UI lib | shadcn vs native only? | **shadcn/ui** for non-WinUI3 React surfaces. |
| Distribution | Store vs installer? | **NSIS** primary. GitHub Releases for initial distribution. MSIX stretch. |
| ETW providers | Which minimum set? | See §17 ETW table. Four providers confirmed. |
| DoH strategy | Phase 1 approach? | Detect-and-notify (see §8 — **PINNED, read before Phase 2 work**). |
| MISP | Include? | **Removed**. Marginal benefit, enterprise complexity. |

### Still open

1. **EV code signing budget.** Several hundred USD/year + identity verification. Without it, AV tools flag NSIS installer. Required before wide distribution.

2. **Weight matrix policy.** Starting values for analyzer signals. Needs labeled holdout set + regression tests.

3. **ML model refresh cadence.** Concept drift is real. → Quarterly with automated drift monitoring (decided direction, tooling not built).

4. **False positive feedback loop.** When user whitelists blocked domain, train model? → Yes, with explicit consent + privacy-preserving aggregation (decided direction, impl not built).

5. **Team size / Rust experience.** Solo dev with no Rust exp: Option A (pure C#) remains valid. Rust microservice adds 3–4 weeks if learning from scratch.

6. **DoH Group Policy enforcement (Phase 2).** Registry keys per browser. Read §8 before starting. Confirmed Phase 2, not Phase 1.

---

## File Locations (session outputs)

| File | Purpose |
|---|---|
| `SafeSurf_UI_Prototype.jsx` | Iteration 1 — React mock UI (legacy name) |
| `nakora.zip` | Iteration 2 — Electron v1 prototype |
| `nakora-v2.zip` | Iteration 3 — Architecture-compliant Electron v2 |
| `nakora_backend_eval.jsx` | Backend language evaluation (interactive React report) |
| `CLAUDE.md` | This document — master context |

---

## Quick Start (current prototype)

```bash
# Extract nakora-v2.zip
cd nakora2
npm install
npm run rebuild     # rebuilds better-sqlite3 for Electron
npm start           # launches Vite + Electron
```

Build distributable (requires icons in `assets/icons/` and `assets/tray/`):
```bash
npm run dist        # validates → builds → packages → dist-electron/
```

---

## Philosophy

Three design sources shape every decision:

- **Splunk (50%)** — dense purposeful information display, always-visible search, drill-down navigation, severity colour coding, summary→detail pattern
- **Metasploit (30%)** — terminal-adjacent aesthetic that feels earned, structured component listings, context-sensitive panels, system feel
- **Apple HIG (20%)** — clarity of purpose, progressive disclosure, forgiveness (confirmations), feedback (visible response), generous whitespace

Four colours total. Nothing else:
- Green family for normal state
- Red for blocked / critical
- Amber for warning / suspicious
- Blue for informational

Instant state changes. No animations. No tooltips (descriptions always visible). No modal dialogs except Delete confirmation. No loading spinners (show `---` until data arrives).

---

*End of CLAUDE.md. Update at each major architectural decision or phase completion.*

---

## 21. Sources & References

### Language / Architecture decisions

| Source | Used for |
|--------|----------|
| [Microsoft to replace C/C++ with Rust by 2030 — Thurrott](https://www.thurrott.com/dev/330980/microsoft-to-replace-all-c-c-code-with-rust-by-2030) | Rust industry validation |
| [Microsoft building team to eliminate C/C++ — Windows Latest](https://www.windowslatest.com/2025/12/24/microsoft-confirms-eliminate-c-and-c-plan-translate-code-to-rust-using-ai-as-windows-11-adopts-rust-and-webview2/) | Rust in Windows kernel context |
| [Microsoft's Bold Goal: Replace 1B Lines — The New Stack](https://thenewstack.io/microsofts-bold-goal-replace-1b-lines-of-c-c-with-rust/) | Scale of Rust migration |
| [Linux Kernel adopts Rust permanently 2025 — WebProNews](https://www.webpronews.com/linux-kernel-adopts-rust-as-permanent-core-language-in-2025/) | Linus Torvalds + Rust |
| [Torvalds on Rust in Linux — The Register](https://www.theregister.com/2024/09/19/torvalds_talks_rust_in_linux/) | Torvalds direct quote |
| [Rust in Linux Kernel 2026 — BordenCastle](https://www.bordencastle.com/development/security/linux/2026/02/27/rust-in-linux-kernel-2026.html) | Current state of Rust in kernel |

### Libraries & tools

| Source | Used for |
|--------|----------|
| [ARSoft.Tools.Net GitHub (Apache 2.0)](https://github.com/alexreinert/ARSoft.Tools.Net) | DNS library replacement for Technitium |
| [ARSoft.Tools.Net NuGet](https://www.nuget.org/packages/ARSoft.Tools.Net) | Package reference |
| [PostHog GitHub (MIT)](https://github.com/PostHog/posthog) | License confirmation |
| [PostHog self-host docs](https://posthog.com/docs/self-host) | Self-hosted deployment |
| [PostHog pricing](https://posthog.com/pricing) | Free tier confirmation |

### Database decisions

| Source | Used for |
|--------|----------|
| [DuckDB vs SQLite 2026 — Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/01/duckdb-vs-sqlite/) | DuckDB for ML workflows |
| [Embedded Databases 2026 — Kestra](https://kestra.io/blogs/embedded-databases) | DuckDB vs SQLite vs Polars |
| [DuckDB vs SQLite — DataCamp](https://www.datacamp.com/blog/duckdb-vs-sqlite-complete-database-comparison) | Performance comparison |

### ETW

| Source | Used for |
|--------|----------|
| [ETW Provider GUIDs — GitHub Gist](https://gist.github.com/guitarrapc/35a94b908bad677a7310) | Provider GUID reference |
| [ETW Intrusion Detection — Microsoft Learn](https://learn.microsoft.com/en-us/archive/blogs/office365security/hidden-treasure-intrusion-detection-with-etw-part-2) | ETW for security monitoring |
| [TraceEvent NuGet 3.2.3](https://www.nuget.org/packages/Microsoft.Diagnostics.Tracing.TraceEvent) | Current package version |

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current