# Security Policy — nakora

## Reporting a Vulnerability

Report privately to the maintainer before any public disclosure (GitHub Security Advisories preferred — "Report a vulnerability" on this repo).

- Acknowledgement: within 48 hours
- Triage and severity assessment: within 7 days
- Fix or documented mitigation: 90-day coordinated disclosure window

Please do not open public issues for security reports.

## Severity Classification

| Severity | Definition | Example |
|----------|-----------|---------|
| Critical | Code execution or privilege escalation in the service; update/feed channel compromise | Crafted DNS response → code execution |
| High | Protection silently disabled; user DNS history exposed | Blocklist engine bypass class |
| Medium | Single analyzer/heuristic evasion | Homoglyph detector evasion |
| Low | Hardening gap without direct exploit | Missing ACL on non-sensitive file |

## Architecture — Trust Boundaries

**Windows service** (`nakora-service/`, C# .NET 8)
- Runs Windows API surface only: ETW tracing, service host, Credential Manager, SQLite via EF Core (parameterised, LINQ-only)
- `AllowUnsafeBlocks=false`; structured logging; no raw errors over IPC
- Blocklist verdict is local and fail-safe: HashSet match → NXDOMAIN before any analyzer round-trip

**Analyzer microservice** (`nakora-analyzer/`)
- All untrusted external data (URLs, redirect chains, TLS metadata, feed content) is parsed here, isolated from the service process
- Analyzer failures degrade to signals — never errors that block DNS resolution
- Bounded processing: redirect chains capped at 8 hops, timeouts on all network calls

**Electron prototype** (`src/`, reference implementation)
- Three-zone Zero Trust: sandboxed renderer (`nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `connect-src 'none'` CSP), strict 26-channel IPC whitelist with rate limiter → schema validator → audit log, main process with parameterised SQL and OS-keychain key storage

## Current Limitations (pre-release)

- ONNX phishing model not yet bundled (training pipeline pending)
- gRPC service-to-analyzer channel pending (interim HTTP on localhost)
- Release artifacts not yet code-signed (EV signing planned before distribution)
- PQC signing toggled but not cryptographically active

## Supply Chain

- Dependencies pinned; CI gates: secret scanning (gitleaks), `govulncheck`, .NET vulnerable-package audit
- Module checksums verified against the Go checksum database

## Compliance

- GDPR Art. 32 — data minimisation, encryption at rest, opt-in telemetry
- GDPR Art. 17 — right to erasure implemented
- GDPR Art. 20 — data portability export implemented
- Local-first by design: DNS query logs never leave the device
- ISO 27001 — access controls, audit logging referenced in architecture
- WCAG 2.1 AA — keyboard navigation, focus rings, role attributes on interactive elements
