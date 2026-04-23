# Security Policy — nakora prototype

## Zero Trust Architecture

nakora is designed around a three-zone Zero Trust model:

**Zone 1 — Main Process** (Node.js, full OS access)
- All IPC handlers wrapped in: rate limiter → schema validator → audit log
- No raw error messages returned to renderer
- PowerShell called via `execFile` with fixed argument arrays — no string interpolation
- All SQL via parameterised statements — no string concatenation ever
- API keys stored in OS keychain (Windows Credential Manager) via keytar

**Zone 2 — Preload Bridge** (strict channel whitelist)
- 26 named channels only — no dynamic channel access
- Client-side type guards before invoke (defence-in-depth)
- No raw `ipcRenderer` exposure — only named function wrappers

**Zone 3 — Renderer** (sandboxed, no Node.js)
- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`
- `connect-src 'none'` CSP — renderer cannot make any network request
- No `innerHTML`, no `eval()` — enforced by ESLint

## Reporting a Vulnerability

This is a prototype. In production, vulnerabilities should be reported to the project maintainer privately before public disclosure. Please allow 30 days for assessment and fix before public disclosure.

## Known Prototype Limitations

- ETW kernel event tap is simulated (requires Windows service + driver in production)
- DNS interception is simulated (requires Windows DNS API integration in production)
- ML.NET inference is mocked (ONNX model not bundled)
- PQC signing is toggled but not cryptographically active in prototype

## Compliance

- GDPR Art. 32 — data minimisation, encryption at rest, opt-in telemetry
- GDPR Art. 17 — right to erasure implemented
- GDPR Art. 20 — data portability export implemented
- ISO 27001 — access controls, audit logging referenced in architecture
- WCAG 2.1 AA — keyboard navigation, focus rings, role attributes on interactive elements
