# CLAUDE.md — nakora Project Context

> **Master reference for the nakora project.** Everything decided, discussed, and built across the session is consolidated here. This file is the handover document — any future session (human or Claude) should read this first before making architectural or implementation decisions.

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

**nakora** is a native Windows 11 desktop application — a system-wide DNS Security Shield with on-device ML-based phishing and cryptojacking detection. It sits in a specific market gap: no existing consumer tool combines **on-device inference** (no cloud dependency) + **DNS-level system-wide protection** (covers all apps, not just browsers) + **privacy-preserving local-first storage**.

The project is inspired by and architecturally compatible with the **CISA Protective DNS** model, implemented as an on-device equivalent rather than an enterprise service enrollment.

---

## 2. Project History & Naming

- **Originally named:** SafeSurf
- **Renamed to:** nakora (Oct/Nov 2025 mid-session)
- All references in documentation, code identifiers, and UI branding use **nakora** (lowercase).
- Legacy references to SafeSurf may exist in older documents (main_info_txt.docx, etc.) and represent the same project.
- The app ID is `dev.nakora.prototype` for the current prototype; `dev.nakora.app` for production.

---

## 3. Core Concept

Intercept DNS queries at the Windows system level → run parallel heuristic + ML analyzers against each domain → produce a trust score and verdict → block, warn, or allow based on thresholds → log locally (never transmit) → present the user a WinUI 3 dashboard.

The key architectural decision: **the resolver and the analyzers are separate concerns.** The resolver must be fast (<30ms). The analyzers can be slower (asynchronous, 100–500ms), running in parallel, feeding into a verdict engine that refines the decision over time.

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
- **PQC (Post-Quantum Cryptography)** — BouncyCastle.NET Dilithium3 signatures on outbound API calls (rationale: future-proof API auth, academically credible)
- **Go microservice** — analyzers ported from abhizaik/phishing-detection
- **Three themes:** Original (green/black), Darker, Hacker (scanlines)
- **Localization:** 3–5 locales (EN/HI/DE/JA/ES via Windows .resw files)

### Cut from scope (discussed and rejected)
- Chinese/Russian commercial site whitelist ("janky and discriminatory" per project's own notes; high false-positive + legal/reputational risk)

---

## 6. Software Analysis Summary

### Cohesion & Coupling
- **High cohesion:** Each analyzer has one job. Homoglyph, redirect chain, cert transparency, domain age, URL patterns, content signals — all separate modules with single responsibility.
- **Low coupling:** Analyzers are stateless, take only `(url, context, dnsQuery)` as input, return independent signals. No shared state. No analyzer calls another analyzer directly.
- **Orchestrator:** The Windows service wires the resolver, fans out to analyzers via `Task.WhenAll` / `Parallel.ForEach`, feeds signals into the aggregator.
- **Scoring/verdict engine:** Weight matrix for combining signals. **Must be data-driven** — weights in a versioned policy file with automated regression tests against a labeled holdout set.

### Function Point Estimate
- **UFP:** 65–95
- **VAF:** 1.05–1.20 (performance-critical, security-critical, moderate-high complexity)
- **Adjusted FP:** 70–115
- **Honest reassessment:** the real scope is closer to 3x this estimate. A phased approach is necessary.

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
- **Frontend UI:** WinUI 3 + XAML + C# with Fluent Design System
- **Backend core:** C# / .NET 8 Windows service
- **Analyzer microservice:** Go (see §17)
- **Database:** Local SQLite via Microsoft.Data.Sqlite / EF Core with DPAPI encryption
- **ML:** Python (Scikit-learn, XGBoost, Jupyter) for training → ONNX export → ML.NET for inference
- **Security/Network:** DnsClient.NET, System.Net.Dns, RDAP (preferred over WHOIS)
- **ETW:** `Microsoft.Diagnostics.Tracing.TraceEvent` NuGet
- **PQC:** BouncyCastle.NET (Dilithium3 signatures)
- **Packaging:** MSIX for Microsoft Store; NSIS for direct download

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
- **PostHog** self-hosted OR Application Insights (optional, pick one — both = redundant)

---

## 8. Critical Architectural Problem: DoH/DoT

This is the single most important gap to address in documentation and design.

### Why DoH exists
Historically, DNS queries were sent plaintext over UDP port 53 — anyone in the network path (ISP, coffee shop router, govt) could see every domain you visited even if the page itself used HTTPS. DoH wraps DNS queries inside regular HTTPS traffic on port 443, making them indistinguishable from normal web traffic. Chrome/Firefox/Edge enable DoH by default to bypass ISP DNS manipulation.

### The problem for nakora
When Chrome uses DoH, it opens an HTTPS connection directly to `dns.google` or `cloudflare-dns.com`. Windows' system DNS stack never sees the query. **nakora's DNS interception layer is completely bypassed for that browser.**

### Mitigation options (ranked by complexity)

1. **Detect and notify** *(recommended as Phase 1)*
   - Monitor for known DoH resolver IPs (8.8.8.8, 1.1.1.1, etc.) accessed on port 443
   - Warn user via dashboard + Toast notification that browser-level DNS protection is reduced
   - Transparent, achievable, no UX violation

2. **Group Policy / Registry enforcement** *(Phase 2)*
   - Disable DoH in Chrome/Edge via documented registry keys (enterprise-standard pattern)
   - Installer offers this as opt-in with clear consent dialog

3. **Network-level interception via WFP driver** *(Phase 3+ or never)*
   - Windows Filtering Platform kernel-mode driver
   - Intercepts and decrypts DoH traffic
   - Requires kernel-level code signing, massively increases AV flagging risk
   - **NOT realistic scope** for this project

### For project approval
Frame as: *"Scope includes detection of DoH bypasses with user notification; registry-based opt-in enforcement for supported browsers is a Phase 2 feature."*

---

## 9. Scope Risk Assessment

The original specification was honest: this is **3–4 substantial projects stitched together**, and the initial FP estimate of 70–115 undercounts significantly.

Individually, each of these is weeks of work:
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

**Practical risk:** building 60% of each feature rather than 100% of the core ones. For a hackathon or academic evaluator, a focused vertical slice (DNS resolver + core heuristics + clean UI + solid testing) scores higher than an ambitious but incomplete full system.

**Phased approach is mandatory** — see §18.

---

## 10. Unfulfilled Edge Cases

These are architecturally significant, not minor oversights:

### DoH/DoT bypass
Addressed in §8.

### VPN interference
When a VPN is active, it takes over DNS routing. Protective DNS resolver may be bypassed, or worse, conflict with the VPN's DNS causing resolution failures. **Mitigation:** detect VPN activation via Windows WMI (`MSFT_NetAdapter`), gracefully degrade, notify user.

### Captive portals
Hotel Wi-Fi, airport networks, corporate captive auth pages intercept DNS and return fake responses. Heuristics would flag these as malicious (wrong domain, cert mismatch, redirect chain) generating FPs at exactly the moment users need internet access. **Mitigation:** captive portal detection mode via `http://www.msftconnecttest.com/connecttest.txt` probing, relaxed rules when detected.

### CDN-hosted phishing
Phishing pages hosted on Cloudflare / CloudFront / GitHub Pages have clean, trusted, old parent domains. DNS-level analysis passes them through. **Mitigation:** content-level analysis (forms, scripts, visual similarity) must integrate with DNS resolver — needs explicit latency budget (see below).

### <30ms target conflict with real-time API checks
PhishTank/VirusTotal API calls are 50–200ms. Cannot be inline. **Resolution:** two latency budgets:
- **Initial DNS resolution:** <30ms, local cache + fast heuristics only
- **Full scan:** async, several hundred ms, updates dashboard after the fact, may show brief interstitial

### Multi-user Windows
Does the resolver run per-user or system-wide? Per-user whitelists when service runs as system? **Resolution:** service runs system-wide; per-user preferences stored in user profile SQLite; shared blocklist cached globally.

### English Language Irregularity Detector — highest FP risk
The detector must handle:
- Major English variants: British, Irish, Indian, Canadian, American, Singaporean, **Australian, South African, Nigerian, Kenyan** (the last four are missing from the original spec)
- Non-native speaker legitimate sites
- Machine-translated legitimate sites (e.g., small e-commerce from non-English-first countries)
- Regional dialects
- WordPress / Squarespace / Wix / Shopify storefronts with imperfect copy
- E-commerce with user-generated reviews

**Mitigation:** treat as an auxiliary signal with low weight, not a primary trigger. Exception list driven by site platform detection (WordPress, Shopify headers) + TLD-based regional rules.

---

## 11. Competitive Landscape

| Product | What it does | Gap nakora fills |
|---|---|---|
| Windows Defender SmartScreen | URL reputation at browser/OS level | No DNS-level system-wide, no ML |
| Chrome Safe Browsing / Edge SmartScreen | Browser-level phishing detection | Only browser, not system-wide |
| Pi-hole | DNS-level network-wide blocking | Requires separate device, Linux-only |
| NextDNS, Cloudflare for Families | Protective DNS as a service (cloud) | Cloud-dependent, privacy compromise |
| Cisco Umbrella | Enterprise PDNS | Not consumer-grade |
| Quad9 | Free privacy-preserving PDNS resolver | Single service, not local ML |

**Genuine differentiation:**
1. On-device ML inference (no cloud for core detection)
2. DNS-level system-wide (covers all apps, not browser-scoped)
3. FIRST.org DNS Abuse Matrix integration (DGA, tunneling, cache poisoning)
4. Privacy-preserving (no third-party DNS routing)
5. Consumer Windows 11 target (not enterprise-only)

### Adoption barriers
- **EV code signing cost:** several hundred USD/year, identity verification required — **without this, AV tools will flag the installer**
- **Microsoft Store certification** for safe distribution
- **UAC prompt fatigue:** MSIX installer needs extremely clear plain-language explanation of why system-level access is required. Research shows significant abandonment at UAC prompts without clear framing.

---

## 12. Tools Evaluated and Decided

### KEPT (each earns its place)

| Tool | Role | Why |
|---|---|---|
| **Technitium DNS Server** | .NET DNS resolver architecture reference (or embed) | Only production-grade open-source .NET DNS server for Windows. Irreplaceable reference. GPL-3.0 note — see §16. |
| **abhizaik/phishing-detection** | Go analyzer engine (runs as microservice) | Production-grade Go analyzers — RDAP, redirect chain, cert anomaly, homoglyph, subdomain, URL patterns, TLD scoring, MX/NS validation. Structured JSON output. |
| **Phishing-Detection-System/Detection-Chrome-Extension** | ML training data + XGBoost baseline | 71,677-URL labeled dataset + `phishing_classifier.pkl`. Export to ONNX for ML.NET consumption. |
| **dnscrypt-proxy** | Windows service + DoH handling reference | Mature Go DNS proxy. Windows installer patterns, AV-friendly code signing, DoH interception design. |
| **OpenPhish** | Secondary phishing feed | Free, updated 2x daily, ~1,500–2,500 URLs. Complements PhishTank (different source → low coverage overlap). |
| **FIRST.org DNS Abuse Matrix** | Methodology authority | Not software — citable technical reference for DGA/tunneling/cache-poisoning detection. Credibility marker. |
| **uBlock filter lists** | Curated blocklist sources | EasyList, urlhaus-filter. MIT/CC licensing permits redistribution. Study uBlock's Bloom filter approach for O(1) lookup. |
| **Sentry** | Crash reporting | .NET SDK works for desktop. Essential for background service running at 2am when user has no console. |

### CUT (wrong scope, redundant, or incompatible)

| Tool | Why cut |
|---|---|
| **Pi-hole** | Network-wide, Linux-only, requires separate device. nakora is per-device Windows. No usable code. |
| **Cloudflare for Families** / **NextDNS** | Cloud DNS services, not open source tools. Competitor reference only. |
| **Quad9** | Cloud resolver, not a dev resource. Mention as market context, nothing else. |
| **MISP Project** | Enterprise SOC tool. Integration complexity (MISP server, STIX/TAXII) vs marginal benefit over PhishTank+OpenPhish+CISA. |
| **Supabase** | Cloud PostgreSQL. Contradicts local-first SQLite architecture. |
| **Clerk** | Web auth middleware. WinUI 3 uses Windows Credential Manager + Windows Hello. |
| **Pinecone** | Cloud vector DB. Contradicts on-device ML design. |
| **Shadcn/ui** | React components. WinUI 3 uses XAML + CommunityToolkit. Incompatible. |
| **NanoClaw** | Personal AI agent for WhatsApp/Telegram. macOS/Linux. Node.js. Zero overlap with Windows DNS security. |
| **OpenClaw** | Same category as NanoClaw. Cut. |

### OPTIONAL
- **PostHog** (self-hosted) — only if replacing Application Insights. Don't run both.
- **Claude API** — could power NLP features but adds API cost and cloud dependency. Evaluate carefully.

---

## 13. Prototype Build Progression

Three iterations built during the session:

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
- Purpose: demonstrate full UX and real data integration

### Iteration 3: Electron v2 (`nakora-v2.zip`) — Architecture-compliant
Matches the full architecture specification in `protoype_Architecture.txt`:
- **Zone 1 (Main):** `csp.js`, `window.js`, `tray.js`, `protocol.js`, IPC router with rate limiter + validators + handlers, services (dns-simulator, etw-monitor, filter-lists, system-metrics, audit-log), storage (database, store, keychain)
- **Zone 2 (Preload):** strict 26-channel whitelist, client-side type guards
- **Zone 3 (Renderer):** React + context providers + hooks + 6 pages + layout + shared primitives
- Real `better-sqlite3` with WAL mode + migrations + in-memory fallback
- Real `keytar` → Windows Credential Manager
- Real `electron-store` AES-256 encryption with machine-derived key
- Real bundled filter-list files actually loaded and used
- Tray icon changes green/amber/red based on blocked/scanned ratio
- System tray with 15-minute pause toggle
- CSP enforced via `onHeadersReceived` + meta tag defence-in-depth

**Architecture completion:** ~52% of spec files built (39 of 74). Logic fully present; file granularity consolidated (e.g., `combined.handler.js` merges four spec handler files).

---

## 14. Zero Trust Architecture

Electron runs two processes. In nakora's design:

- **Main process** — full Node.js / OS access. Trusted.
- **Renderer process** — treated as untrusted. Like a webpage from the internet. No direct Node, no filesystem, no OS.
- **Preload script** — the only bridge. Locked, schema-validated, minimum-surface API exposed via `contextBridge.exposeInMainWorld('nakora', api)`.

### Hard rules enforced

1. `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`
2. CSP `connect-src 'none'` — **renderer cannot make any network request.** All external calls routed through main process.
3. No `innerHTML`, no `eval()`, no `new Function()`, no dynamic `require()` — enforced by ESLint rules `no-eval`, `no-unsanitized/property`
4. No `remote` module, no `webview` tag, new-window handler denies all
5. Every IPC handler is wrapped in: rate limiter → schema validator → sanitiser → audit logger → dispatch
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

### ⚠️ Simulated (clearly labelled in the code)

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

Detailed analysis completed in `nakora_backend_eval.jsx` artifact. Summary table:

| Language | Verdict | Best suited for |
|---|---|---|
| **C# / .NET 8** | ✅ **STRONG YES** for Windows core | DNS interception, ETW, ML.NET, WinUI 3, Credential Manager, MSIX |
| **Go** | ✅ **STRONG YES** for analyzer microservice only | Parallel stateless analyzers, threat feed HTTP, abhizaik port |
| **Rust** | ⚠️ CONDITIONAL | DNS hot path if sub-ms matters. Only with existing Rust experience. Timeline risk. |
| **Node.js / Electron** | ❌ Prototype only | V8 GC pauses risk <30ms target; ETW via N-API fragile; 150MB binary |

### Why not pure Go
- No stable ETW Go bindings. `go-etw` is experimental. Requires CGO.
- No WinUI 3 for Go. Fyne/Wails produce non-native-looking apps.
- ONNX bindings are CGO-backed and less maintained than Microsoft's ML.NET.
- Windows Credential Manager via CGO is painful.
- **CGO breaks Go's single-binary deployment advantage** — the main reason to choose Go.

### Why not pure Rust
- Performance advantage over C# is real but marginal. `.NET 8` async DNS hits <5ms cached — there's 25ms of headroom before the 30ms limit.
- `windows-rs` ETW bindings functional but less mature than `TraceEvent`.
- Borrow checker cost on velocity is concrete and large. 2-3 months timeline risk if team has no Rust experience.
- `ort` ONNX crate works but has less community momentum than Microsoft's runtime.
- Revisit only if Phase 3 latency profiling shows .NET as the bottleneck. Almost certainly won't.

### Why not embed Technitium DNS
- **GPL-3.0.** Your entire project must be GPL if distributed. Kills Microsoft Store / commercial path.
- Tight coupling to Technitium's release cycle.
- Their Web UI replaces your WinUI dashboard unless bypassed entirely.
- Block-list-only — no per-query heuristic scoring without deep fork.
- **Use as architecture reference** (study their .NET DNS resolver implementation) but write your own DNS layer using DnsClient.NET for licensing freedom.

### Why OpenPhish stays in
- Free daily feed (~1,500-2,500 URLs)
- Complements PhishTank (different source, low coverage overlap)
- Integration is trivial: ~50-line HTTP client + SQLite upsert
- **Always include. No reason not to.**

---

## 17. Final Recommended Architecture

**Option B from evaluation:** C# Core Service + Go Analyzer Microservice.

```
┌────────────────────────────────────────────────────────────────┐
│                    nakora (Windows 11)                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────┐    ┌─────────────────────────────┐   │
│  │   WinUI 3 Shell     │    │   NaKora.Service.exe        │   │
│  │   (C# / XAML)       │    │   (C# / .NET 8 service)     │   │
│  │                     │    │                             │   │
│  │  Dashboard          │◄──►│  DNS Resolver               │   │
│  │  Threat Log         │IPC │  ETW Monitor                │   │
│  │  DNS Monitor        │    │  ML.NET ONNX Inference      │   │
│  │  Domain Manager     │    │  Credential Manager         │   │
│  │  Settings / Export  │    │  SQLite (EF Core + DPAPI)   │   │
│  └─────────────────────┘    │  Scoring Engine             │   │
│                             └──────────────┬──────────────┘   │
│                                            │                   │
│                                    localhost gRPC/HTTP         │
│                                            │                   │
│                             ┌──────────────▼──────────────┐   │
│                             │  nakora-analyzer (Go)       │   │
│                             │  (microservice :8080)       │   │
│                             │                             │   │
│                             │  ├─ homoglyph analyzer      │   │
│                             │  ├─ dga_entropy analyzer    │   │
│                             │  ├─ redirect_chain analyzer │   │
│                             │  ├─ certificate analyzer    │   │
│                             │  ├─ nlp_irregularity        │   │
│                             │  ├─ PhishTank HTTP client   │   │
│                             │  ├─ OpenPhish feed fetcher  │   │
│                             │  └─ VirusTotal HTTP client  │   │
│                             └─────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Why this split

| Responsibility | Technology | Reason |
|---|---|---|
| DNS interception | C# (DnsClient.NET) | Windows DNS APIs are first-class in .NET |
| ETW monitoring | C# (TraceEvent) | Only language with mature ETW — Microsoft's own library |
| ML inference | C# (ML.NET + ONNX) | Microsoft.ML.OnnxRuntime is the production-grade binding |
| WinUI 3 shell | C# + XAML | Native Fluent Design, no Electron 150MB tax |
| Credential Manager | C# (Windows.Security.Credentials) | Native Windows Runtime API, zero friction |
| Analyzer pipeline | Go | goroutines = perfect fit for parallel stateless analyzers |
| Feed fetcher | Go | Simple, concurrent, abhizaik pattern |
| Pluggable modules | Go interfaces | Drop-in new analyzer = one `.go` file |

### Why C# core is right even with Go advantages
- C# is the natural home for every integration requirement (ETW, WinUI, ML.NET, Credential Manager, DnsClient.NET)
- .NET 8 async DNS resolution achieves <5ms cached → comfortably under the 30ms limit
- Microsoft maintains every critical dependency → long-term stability
- MSIX packaging for Microsoft Store is first-class
- Windows AppContainer isolation works natively

### Why Go microservice is right for analyzers
- abhizaik codebase already Go — direct reuse
- goroutines map cleanly to fan-out/fan-in analyzer pattern
- Interface-based plugin registration: `type Analyzer interface { Analyze(ctx, url) Signal }`
- Adding analyzer = one file. Hot-reloadable independently of C# service.
- Fault isolation: analyzer crash doesn't kill DNS service
- Tiny self-contained binary (~10MB)

### IPC latency cost
- Localhost gRPC: ~0.3–1ms per call
- Localhost HTTP: ~1–5ms per call
- **Must be async** — don't block DNS resolution path on analyzer calls
- Analyzers run in parallel with DNS resolution, update verdict after-the-fact

### Alternative paths discussed
- **Option A (Pure C#):** single-language simplicity, recommended for solo dev
- **Option C (Pure Go):** rejected — CGO costs kill Go's advantages
- **Option D (Technitium + C# layer):** viable if GPL-3.0 is acceptable, saves 6+ weeks of DNS plumbing
- **Option E (Rust hot path + C# service):** rejected — complexity not justified

---

## 18. Phased Roadmap

| Phase | Deliverable | Timeline | Status |
|---|---|---|---|
| **0** | React artifact mock UI — feature demo for approval | 1 week | ✅ Done |
| **0.5** | Electron prototype — UX + real OS metrics | 2 weeks | ✅ Done |
| **0.75** | Architecture-compliant Electron v2 — Zero Trust, SQLite, audit log | 2 weeks | ✅ Done |
| **1** | C#/.NET 8 Windows service — DNS interception, SQLite, core heuristics, WinUI 3 skeleton | 4–6 weeks | ⏳ Next |
| **1.5** | Go analyzer microservice — homoglyph, redirect chain, cert, domain age | 2–3 weeks | ⏳ |
| **2** | ML.NET + ONNX inference integrated; DoH detection + warning | 3–4 weeks | ⏳ |
| **2.5** | WinUI 3 full feature parity with Electron v2 | 2–3 weeks | ⏳ |
| **3** | DGA/tunneling detection; language irregularity NLP; MSIX packaging | 4 weeks | ⏳ |
| **Stretch** | PQC (BouncyCastle Dilithium3); EV code signing; Microsoft Store submission | 2–3 weeks | ⏳ |

**Total realistic timeline: 20–30 weeks** of focused development — roughly 5–7 months solo or 3–4 months with a small team.

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

Questions that need answers before Phase 1 implementation begins:

1. **DoH handling strategy.** Detect-and-notify (recommended) vs Group Policy enforcement (Phase 2) vs WFP driver (never)? → Recommended: detect-and-notify for Phase 1, document Phase 2 policy approach.

2. **Technitium or custom DNS layer?** GPL-3.0 acceptable? → If commercial distribution matters: custom. If academic/open-source: embed Technitium.

3. **EV code signing budget** for Phase 1.5+ distribution. → Several hundred USD/year + identity verification. Without it, AV tools flag installer.

4. **Microsoft Store submission path** vs direct download via NSIS installer.

5. **Team size / language skills.** If solo dev: pure C# (Option A) over C# + Go (Option B). If team of 2+ with Go experience: Option B.

6. **Weight matrix policy.** Starting values for analyzer signals. Needs labeled holdout set + regression tests.

7. **Go microservice IPC protocol:** gRPC (type-safe, faster) vs HTTP/JSON (simpler, abhizaik compatible). → Recommend HTTP/JSON for Phase 1, migrate to gRPC if throughput demands it.

8. **ETW event categorisation** — which ETW providers to subscribe to at minimum? → `Microsoft-Windows-TCPIP` (network), `Microsoft-Windows-Kernel-Process` (CPU).

9. **ML model refresh cadence.** Concept drift is real. Monthly retraining? Quarterly? → Quarterly with automated drift monitoring.

10. **False positive feedback loop.** When user whitelists a blocked domain, does this train the model? → Yes, with explicit user consent and privacy-preserving aggregation.

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

*End of CLAUDE.md. This file should be updated at each major architectural decision or phase completion.*

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
