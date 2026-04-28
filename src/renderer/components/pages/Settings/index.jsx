import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../context/AppState.context.jsx';
import { useSettings } from '../../../hooks/usePolling.js';
import { AccordionSection, Toggle, Btn, Input, Tag, ConfirmButton } from '../../shared/primitives.jsx';
import { THEMES } from '../../../theme.js';

function ToggleRow({ label, desc, note, value, onChange, t, color }) {
  const c = color || t.accent;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '9px 0', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ flex: 1, paddingRight: 14 }}>
        <div style={{ color: t.text, fontSize: 12, fontFamily: t.mono, marginBottom: 2 }}>{label}</div>
        <div style={{ color: t.textDim, fontSize: 11 }}>{desc}</div>
        {value && note && <div style={{ color: c + 'aa', fontSize: 10, marginTop: 2, fontFamily: t.mono }}>{note}</div>}
      </div>
      <Toggle value={!!value} onChange={onChange} t={t} color={c} />
    </div>
  );
}

export default function Settings({ t }) {
  const { themeName, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();
  const tog = settings?.toggles  || {};
  const bud = settings?.budgets  || { dnsLatencyTarget: 30, cpuBudget: 5, dataRetentionDays: 90 };
  const api = settings?.apiConfig || { goEndpoint: 'http://localhost:8080' };

  const [apiKeyStatus, setApiKeyStatus] = useState({ phishtank: false, virustotal: false });
  const [apiTests,     setApiTests]     = useState({});
  const [goEndpoint,   setGoEndpoint]   = useState(api.goEndpoint || 'http://localhost:8080');
  const [ptKey,        setPtKey]        = useState('');
  const [vtKey,        setVtKey]        = useState('');

  useEffect(() => {
    ['phishtank','virustotal'].forEach(async name => {
      const r = await window.nakora?.settings.getApiKeyStatus(name).catch(() => null);
      const d = r?.data ?? r;
      if (d) setApiKeyStatus(p => ({ ...p, [name]: d.configured }));
    });
  }, []);

  useEffect(() => { if (api.goEndpoint) setGoEndpoint(api.goEndpoint); }, [api.goEndpoint]);

  const setToggle = useCallback((key, val) => {
    updateSetting({ toggles: { [key]: val } });
  }, [updateSetting]);

  const setBudget = useCallback((key, val) => {
    updateSetting({ budgets: { [key]: val } });
  }, [updateSetting]);

  const testApi = async (key) => {
    setApiTests(p => ({ ...p, [key]: 'testing' }));
    const ep = key === 'go' ? goEndpoint : `https://${key}.api.check`;
    const r = await window.nakora?.settings.testConnection(ep).catch(() => null);
    const d = r?.data ?? r;
    setApiTests(p => ({ ...p, [key]: (d?.ok) ? 'ok' : 'fail' }));
  };

  const saveGoEndpoint = async () => {
    updateSetting({ apiConfig: { goEndpoint } });
  };

  const saveApiKey = async (name, value) => {
    if (!value.trim()) return;
    await window.nakora?.settings.setApiKey(name, value.trim()).catch(() => {});
    setApiKeyStatus(p => ({ ...p, [name]: true }));
    if (name === 'phishtank') setPtKey('');
    if (name === 'virustotal') setVtKey('');
  };

  const testIcon = (k) => {
    if (apiTests[k] === 'testing') return <span style={{ color: t.warn, fontSize: 9, fontFamily: t.mono }}>...</span>;
    if (apiTests[k] === 'ok')      return <Tag label="OK"   color={t.safe}   t={t} small />;
    if (apiTests[k] === 'fail')    return <Tag label="FAIL" color={t.danger} t={t} small />;
    return null;
  };

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', paddingBottom: 20 }}>

        <AccordionSection title="CORE FEATURES" t={t} defaultOpen>
          <ToggleRow label="DNS Resolver" desc="System-wide CISA PDNS-inspired protective DNS resolver"
            note="currently protecting against: all DNS-layer threats"
            value={tog.dnsResolver} onChange={v => setToggle('dnsResolver', v)} t={t} />
          <ToggleRow label="PhishTank Feed" desc="Community-verified phishing URL database"
            note="currently protecting against: verified phishing domains"
            value={tog.phishtank} onChange={v => setToggle('phishtank', v)} t={t} />
          <ToggleRow label="OpenPhish Feed" desc="Secondary phishing URL feed — updated 3× daily"
            value={tog.openphish} onChange={v => setToggle('openphish', v)} t={t} />
          <ToggleRow label="VirusTotal API" desc="Multi-engine URL reputation checking (requires API key)"
            value={tog.virustotal} onChange={v => setToggle('virustotal', v)} t={t} />
          <ToggleRow label="Toast Alerts" desc="Windows notifications for high-severity blocked domains"
            value={tog.toastAlerts} onChange={v => setToggle('toastAlerts', v)} t={t} />
          <ToggleRow label="DoH Detection Warning" desc="Alert when browser bypasses system DNS via DNS-over-HTTPS"
            note="detecting: Chrome/Edge DoH bypass via port-443 HTTPS to known resolvers"
            value={tog.dohDetection} onChange={v => setToggle('dohDetection', v)} t={t} color={t.warn} />
        </AccordionSection>

        <AccordionSection title="ADVANCED DETECTION" t={t} defaultOpen={false}>
          <ToggleRow label="ETW Cryptojacking Monitor" desc="Real CPU/memory correlation + CoinBlockerLists domain matching"
            note="currently protecting against: xmrpool, coinhive, and 40+ mining pool domains"
            value={tog.etwCryptojack} onChange={v => setToggle('etwCryptojack', v)} t={t} color={t.warn} />
          <ToggleRow label="PQC API Signing (BETA)" desc="BouncyCastle Dilithium3 post-quantum signatures on outbound API calls"
            note="signing: PhishTank + VirusTotal API requests with NIST-standardised Dilithium3"
            value={tog.pqcSigning} onChange={v => setToggle('pqcSigning', v)} t={t} color={t.warn} />
          <ToggleRow label="ML.NET On-Device Inference" desc="ONNX classifier (XGBoost-trained, 71k PhishTank samples)"
            note="classifying: URL structure, TLD risk, entropy, subdomain depth"
            value={tog.mlNet} onChange={v => setToggle('mlNet', v)} t={t} />
          <ToggleRow label="Language Irregularity Analyzer"
            desc="NLP English irregularity detection — excl. blogs, regional variants, Shopify, Wix, user-generated"
            note="exceptions: British, Irish, Indian, Canadian, American, Singaporean, Australian, South African"
            value={tog.langIrregularity} onChange={v => setToggle('langIrregularity', v)} t={t} />
          <ToggleRow label="Homoglyph / Cyrillic Detector" desc="Unicode lookalike chars, Punycode decode, hidden ASCII, Cyrillic substitution"
            note="currently protecting against: paypa1, xn-- domains, Cyrillic substitution"
            value={tog.homoglyph} onChange={v => setToggle('homoglyph', v)} t={t} />
          <ToggleRow label="DGA Detector" desc="FIRST.org matrix — DGA + DNS tunneling + cache poisoning detection"
            note="currently protecting against: entropy > 4.2, fast-flux NS, TXT record abuse"
            value={tog.dgaDetector} onChange={v => setToggle('dgaDetector', v)} t={t} color={t.danger} />
          <ToggleRow label="Redirect Chain Analyzer" desc="Follows up to 8 redirect hops, detects final-domain mismatch + short URL origins"
            value={tog.redirectChain} onChange={v => setToggle('redirectChain', v)} t={t} />
        </AccordionSection>

        <AccordionSection title="API CONFIGURATION" t={t} defaultOpen={false}>
          {/* Go microservice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ width: 170, color: t.textMid, fontSize: 11, fontFamily: t.mono, flexShrink: 0 }}>Go Microservice URL</span>
            <Input value={goEndpoint} onChange={setGoEndpoint} placeholder="http://localhost:8080" t={t} />
            <Btn t={t} small onClick={saveGoEndpoint}>SAVE</Btn>
            <Btn t={t} small onClick={() => testApi('go')}>TEST</Btn>
            <div style={{ width: 32 }}>{testIcon('go')}</div>
          </div>
          {/* PhishTank */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ width: 170, color: t.textMid, fontSize: 11, fontFamily: t.mono, flexShrink: 0 }}>PhishTank API Key</span>
            <Input value={ptKey} onChange={setPtKey} placeholder={apiKeyStatus.phishtank ? '●●●●●● configured' : 'pk_...'} t={t} password />
            <Btn t={t} small onClick={() => saveApiKey('phishtank', ptKey)}>SAVE</Btn>
            <Btn t={t} small onClick={() => testApi('pt')}>TEST</Btn>
            <div style={{ width: 32 }}>{testIcon('pt') || (apiKeyStatus.phishtank && <Tag label="SET" color={t.safe} t={t} small />)}</div>
          </div>
          {/* VirusTotal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <span style={{ width: 170, color: t.textMid, fontSize: 11, fontFamily: t.mono, flexShrink: 0 }}>VirusTotal API Key</span>
            <Input value={vtKey} onChange={setVtKey} placeholder={apiKeyStatus.virustotal ? '●●●●●● configured' : 'vt_...'} t={t} password />
            <Btn t={t} small onClick={() => saveApiKey('virustotal', vtKey)}>SAVE</Btn>
            <Btn t={t} small onClick={() => testApi('vt')}>TEST</Btn>
            <div style={{ width: 32 }}>{testIcon('vt') || (apiKeyStatus.virustotal && <Tag label="SET" color={t.safe} t={t} small />)}</div>
          </div>
          <div style={{ color: t.textDim, fontSize: 10, fontFamily: t.mono, marginTop: 8 }}>
            API keys stored in Windows Credential Manager (keytar) — never in plaintext files.
          </div>
        </AccordionSection>

        <AccordionSection title="PERFORMANCE BUDGETS" t={t} defaultOpen={false}>
          {[
            { key: 'dnsLatencyTarget', label: 'DNS Latency Target', min: 10, max: 200, unit: 'ms',
              note: v => `at ${v}ms — ${v < 20 ? '~99%' : v < 35 ? '~95%' : '~85%'} of queries resolve before perceptible delay` },
            { key: 'cpuBudget', label: 'Max CPU Overhead', min: 1, max: 30, unit: '%',
              note: v => `at ${v}% — ${v < 3 ? 'minimal footprint' : v < 7 ? 'balanced detection/perf' : 'maximum coverage'}` },
            { key: 'dataRetentionDays', label: 'Data Retention', min: 7, max: 365, unit: ' days',
              note: v => `logs purged after ${v} days — GDPR Art. 5(1)(e) storage limitation` },
          ].map(({ key, label, min, max, unit, note }) => (
            <div key={key} style={{ padding: '9px 0', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label htmlFor={`range-${key}`} style={{ color: t.text, fontSize: 12, fontFamily: t.mono }}>{label}</label>
                <span aria-hidden="true" style={{ color: t.accentBright, fontSize: 12, fontFamily: t.mono }}>{bud[key]}{unit}</span>
              </div>
              <input id={`range-${key}`} type="range" min={min} max={max} value={bud[key] ?? 0}
                aria-label={label} aria-valuetext={`${bud[key] ?? 0}${unit}`}
                onChange={e => setBudget(key, +e.target.value)}
                style={{ width: '100%', accentColor: t.accent, cursor: 'pointer' }} />
              <div style={{ color: t.textDim, fontSize: 10, marginTop: 3 }}>{note(bud[key] ?? 0)}</div>
            </div>
          ))}
        </AccordionSection>

        <AccordionSection title="GDPR & PRIVACY — ART. 32 COMPLIANT" t={t} defaultOpen={false}>
          <ToggleRow label="URL Hashing (SHA-256)"
            desc="Hash URLs before external API queries — plaintext domain never sent to third parties"
            note="GDPR Art. 25 — data protection by design and by default"
            value={tog.urlHashing} onChange={v => setToggle('urlHashing', v)} t={t} color={t.safe} />
          <ToggleRow label="Local-Only Mode"
            desc="Disable all outbound API calls — heuristics and ML.NET only"
            value={tog.localOnly} onChange={v => setToggle('localOnly', v)} t={t} color={t.warn} />
          <ToggleRow label="Opt-In Telemetry"
            desc="Anonymous aggregate scan metrics — no domains, no URLs, no IPs transmitted"
            value={tog.telemetry} onChange={v => setToggle('telemetry', v)} t={t} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <Btn t={t} style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={async () => {
                const r = await window.nakora?.settings.getSettings().catch(() => null);
                const days = r?.data?.budgets?.dataRetentionDays ?? r?.budgets?.dataRetentionDays ?? 90;
                alert(`Retention Policy: DNS logs and audit entries are purged after ${days} days. No data is sent externally without consent. GDPR Art. 5(1)(e).`);
              }}>View Retention Policy</Btn>
            <Btn t={t} style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={async () => {
                const r = await window.nakora?.system.getAuditLog(50).catch(() => null);
                const entries = r?.data ?? r ?? [];
                const text = Array.isArray(entries) && entries.length
                  ? entries.map(e => `[${e.timestamp ?? ''}] ${e.action ?? ''} — ${e.detail ?? ''}`).join('\n')
                  : 'No audit log entries.';
                alert(`Audit Data Access Log (last 50):\n\n${text}`);
              }}>Audit Data Access Log</Btn>
            <Btn t={t} style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => {
                updateSetting({ toggles: { phishtank: false, virustotal: false, telemetry: false } });
                setToggle('localOnly', true);
              }}>Opt Out of All APIs</Btn>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
            <ConfirmButton
              t={t} danger
              label="DELETE ALL LOCAL DATA"
              confirmLabel="CONFIRM DELETE — CLICK AGAIN (3s)"
              onConfirm={async () => {
                await window.nakora?.settings.resetToDefaults().catch(() => {});
                localStorage.clear();
              }}
              timeout={3000}
            />
            <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, marginTop: 5 }}>
              Wipes SQLite, localStorage, session state. Irreversible. GDPR Art. 17 right to erasure.
            </div>
          </div>
        </AccordionSection>

        <AccordionSection title="APPEARANCE" t={t} defaultOpen={false}>
          <div role="radiogroup" aria-label="Theme selection" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {Object.entries(THEMES).map(([k, th]) => {
              const label = k === 'original' ? 'ORIGINAL' : k === 'darker' ? 'DARKER' : 'HACKER';
              return (
                <div key={k} role="radio" aria-checked={themeName === k} tabIndex={0}
                  onClick={() => setTheme(k)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setTheme(k)}
                  aria-label={`${label} theme${themeName === k ? ', currently active' : ''}`}
                  style={{
                    flex: 1, background: th.card, border: `2px solid ${themeName === k ? th.accentBright : th.border}`,
                    borderRadius: 5, padding: '12px 8px', cursor: 'pointer', textAlign: 'center',
                    boxShadow: themeName === k ? `0 0 12px ${th.accent}44` : 'none', transition: 'all 0.15s',
                  }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: th.accentBright,
                    margin: '0 auto 7px', boxShadow: `0 0 8px ${th.accent}` }} />
                  <div style={{ color: th.text, fontSize: 11, fontFamily: th.mono }}>{label}</div>
                  {themeName === k && <div aria-hidden="true" style={{ color: th.accent, fontSize: 9, fontFamily: th.mono, marginTop: 3 }}>ACTIVE</div>}
                </div>
              );
            })}
          </div>
          {themeName === 'hacker' && (
            <ToggleRow label="Scanlines Overlay" desc="Retro CRT scanline texture overlay"
              value={!!tog.scanlines} onChange={v => setToggle('scanlines', v)} t={t} />
          )}
          <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, marginTop: 6 }}>
            Themes applied via CSS custom properties. Preference persisted to electron-store.
          </div>
        </AccordionSection>

      </div>
    </div>
  );
}
