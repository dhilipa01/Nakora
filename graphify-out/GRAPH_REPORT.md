# Graph Report - .  (2026-04-23)

## Corpus Check
- 61 files · ~37,313 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 368 nodes · 373 edges · 85 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `C# .NET 8 Windows Service` - 13 edges
2. `Go Analyzer Microservice` - 13 edges
3. `Electron Main Entry Point` - 11 edges
4. `DnsMonitor Page Component` - 11 edges
5. `Dashboard Page Component` - 10 edges
6. `nakora Project` - 10 edges
7. `IPC Router (registerAll)` - 9 edges
8. `Combined IPC Handler (settings/etw/system/export)` - 9 edges
9. `useAppState Hook` - 9 edges
10. `Audit Log Service` - 8 edges

## Surprising Connections (you probably didn't know these)
- `DnsMonitor Page Component` --shares_data_with--> `CoinBlocker Cryptomining Domains List`  [INFERRED]
  src/renderer/components/pages/DnsMonitor/index.jsx → data/filter-lists/coinblocker-domains.txt
- `Dashboard Page Component` --shares_data_with--> `URLhaus Malware Domains List`  [INFERRED]
  src/renderer/components/pages/Dashboard/index.jsx → data/filter-lists/urlhaus-domains.txt
- `SIGNALS Analyzer Weight Map` --shares_data_with--> `PhishTank Phishing Domains List`  [INFERRED]
  src/renderer/components/shared/DetailDrawer.jsx → data/filter-lists/phishtank-domains.txt
- `build.js Pre-build Script` --references--> `Filter Lists README`  [INFERRED]
  scripts/build.js → data/filter-lists/README.md
- `validate-csp.js Script` --implements--> `Zero Trust Three-Zone Architecture`  [INFERRED]
  scripts/validate-csp.js → SECURITY.md

## Hyperedges (group relationships)
- **DNS Threat Detection → Tray Threat Indicator Event Loop** — dnssim_emitter, mainindex_threatlevelsync, tray_threatlevel, etwmon_correlatedtrigger [EXTRACTED 0.92]
- **Renderer Isolation Stack (sandbox + CSP + navigation block + protocol)** — window_sandboxed, csp_csp, window_navigationblock, protocol_pathtraversal, preload_allowedchannels [INFERRED 0.88]
- **IPC Security Pipeline (whitelist + rate-limit + validate + audit)** — preload_allowedchannels, ratelimiter_ratelimiter, domainvalidator_domainvalidator, router_register, auditlog_auditlogservice [EXTRACTED 0.95]
- **Theme Color Helpers Used by All Pages** — theme_verdictColor, theme_verdictBg, theme_scoreColor, theme_abuseColor, dashboard_dashboard, dnsmonitor_dnsMonitor, threatlog_threatLog [INFERRED 0.85]
- **DNS Feed Data Consumer Pattern** — usepolling_useDnsFeed, dashboard_dashboard, threatlog_threatLog, dnsmonitor_dnsMonitor [EXTRACTED 0.95]
- **GDPR Compliance Feature Set** — export_export, settings_settings, security_compliancePolicy, readme_projectOverview [INFERRED 0.80]
- **nakora Core Architecture (C# Service + Go Microservice + WinUI3)** — claudemd_csharp_service, claudemd_go_microservice, claudemd_winui3_shell, claudemd_dns_resolver, claudemd_scoring_engine [EXTRACTED 1.00]
- **Go Analyzer Microservice Pipeline** — claudemd_homoglyph_analyzer, claudemd_dga_entropy_analyzer, claudemd_redirect_chain_analyzer, claudemd_certificate_analyzer, claudemd_nlp_irregularity, claudemd_phishtank_client, claudemd_openphish_fetcher, claudemd_virustotal_client [EXTRACTED 1.00]
- **Regulatory Compliance Requirements** — claudemd_gdpr_compliance, claudemd_iso27001_alignment, claudemd_wcag22_aa [EXTRACTED 1.00]
- **Prototype Build Progression** — claudemd_react_mock_ui, claudemd_electron_v1, claudemd_electron_v2 [EXTRACTED 1.00]
- **Security Infrastructure** — claudemd_zero_trust_arch, claudemd_ipc_whitelist, claudemd_credential_manager, claudemd_dpapi_encryption, claudemd_appcontainer_isolation [EXTRACTED 0.95]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (36): AppShell Layout Component, BurgerButton Component, Header Component, NAV_ITEMS Navigation Config, Sidebar Component, StatusBar Component, AppStateProvider Context, ThemeProvider Context (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (43): abhizaik/phishing-detection Go Analyzer, Windows AppContainer Isolation, Backend Language Evaluation, Certificate Transparency Analyzer, CISA Protective DNS Model, Competitive Landscape Analysis, Windows Credential Manager, C# .NET 8 Windows Service (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (29): Audit Log Service, Combined IPC Handler (settings/etw/system/export), SQLite Database (better-sqlite3), SQL Migration Runner, Parameterised Query Wrapper (security), DNS IPC Handler, DNS Simulator Service, DNS Batch Persist to SQLite (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (5): EtwMonitor, IEtwMonitor, IDisposable, IDnsResolver, LocalDnsResolver

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (6): AnalyzeRequest, AnalyzeResponse, extractDomain(), Server, verdictFromScore(), weightedScore()

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (9): build.js Pre-build Script, CoinBlocker Cryptomining Domains List, Filter Lists README, EasyPrivacy Tracker Blocklist, OpenPhish Phishing Feed, Peter Lowe Ad Server Blocklist, PhishTank Phishing Domains List, Bundled Filter Lists Overview (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.36
Nodes (2): IScoringEngine, ScoringEngine

### Community 7 - "Community 7"
Cohesion: 0.28
Nodes (3): IAsyncDisposable, IIpcServer, NamedPipeIpcServer

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (2): OpenPhishFeed, extractHostname()

### Community 9 - "Community 9"
Cohesion: 0.32
Nodes (4): PhishTankClient, phishtankEntry, phishtankResponse, sha256Hash()

### Community 10 - "Community 10"
Cohesion: 0.39
Nodes (4): Analyzer, consonantRatio(), registeredLabel(), shannonEntropy()

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (6): DbContext, AuditLogEntity, DnsEventEntity, DomainListEntry, NakoraDbContext, SettingEntity

### Community 12 - "Community 12"
Cohesion: 0.32
Nodes (4): IOnnxInferenceService, OnnxInferenceService, OnnxInput, OnnxOutput

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (8): DNS Resolver, dnscrypt-proxy Reference, DoH/DoT Bypass Problem, Rationale: DoH Detect-and-Notify over WFP Driver, Rationale: Reject Embedding Technitium DNS, Rationale: Two Latency Budgets (DNS vs Full Scan), Technitium DNS Server (Reference), uBlock Filter Lists

### Community 14 - "Community 14"
Cohesion: 0.43
Nodes (2): Analyzer, tld()

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (1): BlocklistCache

### Community 16 - "Community 16"
Cohesion: 0.43
Nodes (2): GoAnalyzerClient, IGoAnalyzerClient

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (2): Analyzer, dialTLS()

### Community 18 - "Community 18"
Cohesion: 0.47
Nodes (2): Analyzer, confidenceFor()

### Community 19 - "Community 19"
Cohesion: 0.47
Nodes (2): Analyzer, hasMixedScripts()

### Community 20 - "Community 20"
Cohesion: 0.47
Nodes (3): createMainWindow(), getWindowBounds(), isWindows11()

### Community 21 - "Community 21"
Cohesion: 0.4
Nodes (5): DNS EventEmitter (entries event), ETW Correlated DNS Event Trigger, DNS Threat Level Tray Sync, Pause Protection (15 min) Feature, Tray Threat Level Indicator

### Community 22 - "Community 22"
Cohesion: 0.4
Nodes (5): Nakora Architecture Map, Nakora Project Overview, Nakora Security Compliance Policy, Zero Trust Three-Zone Architecture, validate-csp.js Script

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (5): Electron v1 Prototype, Electron v2 Prototype (Architecture-Compliant), IPC Channel Whitelist (26 channels), React Mock UI (Iteration 1), Zero Trust Architecture

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (3): Analyzer, Request, Signal

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (2): BackgroundService, DnsWorker

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (2): envOr(), main()

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (3): IPC Channel Whitelist (ALLOWED set), Per-Channel Rate Limit Config, Structured Response Envelope {success,data,error}

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (3): Renderer App Root (React), AppStateProvider Context, ThemeProvider Context

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (1): IDnsResolver

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (3): Phased Development Roadmap, Real vs Simulated Feature Table, Prototype Known Limitations

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (3): Zero Trust Three-Zone Architecture, Nakora Architecture Map, Nakora Security Compliance Policy

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): Audit Log Rotation (10k cap), Rolling DNS Event Buffer (1000 entries)

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (2): In-Memory Domain Sets (O(1) lookup), isBlocked Domain Lookup

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (2): In-Memory SQLite Mock Fallback, In-Memory Store Fallback

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (2): Export GDPR Note (Art.32 / Art.20), Hostname Partial Anonymisation

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): Preload IPC Bridge

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): Path Traversal Prevention

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): Renderer File Extension Allowlist

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Single Instance Lock

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): Window Open Deny Policy

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): Threat Domain Dataset

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (1): ETW Rolling State (cpu/mem/proc/conn/events)

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): Settings Defaults (DEFAULTS object)

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): Page Registry (PAGES map)

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): useSettings Hook

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): Graph Report - Nakora

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): UI Layout & Navigation

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): Security & IPC Infrastructure

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): Renderer Context & Pages

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): IPC Handler Functions

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): Filter List Parsing

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): System Metrics Service

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): React Data Hooks

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): Keychain Storage

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): SQLite Database Layer

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Window Management

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): System Tray

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Encrypted Store

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): DNS IPC Handler

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): DNS-ETW-Tray Event Loop

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): Architecture & Compliance Docs

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): Audit Log Service

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): App Bootstrap

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (1): IPC Security Contracts

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (1): Dev Roadmap & Limitations

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (1): Rolling Data Buffers

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (1): Domain Set Lookups

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (1): In-Memory Fallbacks

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (1): GDPR Privacy Features

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (1): CoinBlocker Cryptomining Domains List

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (1): URLhaus Malware Domains List

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (1): Filter Lists README

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (1): PhishTank Phishing Domains List

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (1): Phased Development Roadmap

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (1): Real vs Simulated Feature Table

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (1): Prototype Known Limitations

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): Export GDPR Note (Art.32 / Art.20)

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): Nakora Project Overview

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): Threat Domain Dataset

## Knowledge Gaps
- **135 isolated node(s):** `Signal`, `Request`, `Analyzer`, `phishtankEntry`, `phishtankResponse` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 33`** (2 nodes): `Audit Log Rotation (10k cap)`, `Rolling DNS Event Buffer (1000 entries)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `In-Memory Domain Sets (O(1) lookup)`, `isBlocked Domain Lookup`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `In-Memory SQLite Mock Fallback`, `In-Memory Store Fallback`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `Export GDPR Note (Art.32 / Art.20)`, `Hostname Partial Anonymisation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `Preload IPC Bridge`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `Path Traversal Prevention`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `Renderer File Extension Allowlist`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Single Instance Lock`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `Window Open Deny Policy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `csp.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `Threat Domain Dataset`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `ETW Rolling State (cpu/mem/proc/conn/events)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Settings Defaults (DEFAULTS object)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `Page Registry (PAGES map)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `useSettings Hook`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `Program.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `Verdict.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `Graph Report - Nakora`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `UI Layout & Navigation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `Security & IPC Infrastructure`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `Renderer Context & Pages`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `IPC Handler Functions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `Filter List Parsing`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `System Metrics Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `React Data Hooks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `Keychain Storage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `SQLite Database Layer`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `Window Management`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `System Tray`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Encrypted Store`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `DNS IPC Handler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `DNS-ETW-Tray Event Loop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `Architecture & Compliance Docs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `Audit Log Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `App Bootstrap`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `IPC Security Contracts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `Dev Roadmap & Limitations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `Rolling Data Buffers`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `Domain Set Lookups`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `In-Memory Fallbacks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `GDPR Privacy Features`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `CoinBlocker Cryptomining Domains List`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `URLhaus Malware Domains List`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `Filter Lists README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `PhishTank Phishing Domains List`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `Phased Development Roadmap`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `Real vs Simulated Feature Table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `Prototype Known Limitations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `Export GDPR Note (Art.32 / Art.20)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `Nakora Project Overview`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `Threat Domain Dataset`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `C# .NET 8 Windows Service` connect `Community 1` to `Community 13`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `C# .NET 8 Windows Service` (e.g. with `Post-Quantum Cryptography Signing (Dilithium3)` and `Sentry Crash Reporting`) actually correct?**
  _`C# .NET 8 Windows Service` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `DnsMonitor Page Component` (e.g. with `useDnsFeed Hook` and `useEtwMetrics Hook`) actually correct?**
  _`DnsMonitor Page Component` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Dashboard Page Component` (e.g. with `useDnsFeed Hook` and `DnsMonitor Page Component`) actually correct?**
  _`Dashboard Page Component` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Signal`, `Request`, `Analyzer` to the rest of the system?**
  _135 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._