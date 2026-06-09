import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, Tag } from '../../shared/primitives.jsx';
import ExportAction from './ExportAction.jsx';
import ExportPreview from './ExportPreview.jsx';

const SECTIONS = [
  { key: 'export_metadata',  desc: 'App version, timestamp, GDPR note' },
  { key: 'system',           desc: 'Hostname (partial), OS, CPU model — real values' },
  { key: 'session',          desc: 'Scanned, blocked, warned — real counters' },
  { key: 'configuration',    desc: 'All toggle states, budgets, API key status' },
  { key: 'domain_lists',     desc: 'User whitelist, manual blacklist entries' },
  { key: 'threat_log',       desc: 'Session threat detections' },
  { key: 'dns_log_sample',   desc: 'Recent DNS query sample' },
  { key: 'etw_snapshot',     desc: 'Real CPU, mem, processes, connections at export' },
];

export default function Export({ t }) {
  const [status,  setStatus]  = useState('idle');
  const [result,  setResult]  = useState(null);
  const [preview, setPreview] = useState(null);
  const [sysInfo, setSysInfo] = useState(null);
  const [session, setSession] = useState(null);
  const [budgets, setBudgets] = useState({ dataRetentionDays: 90 });

  useEffect(() => {
    window.nakora?.export.getPreview().then(r => {
      const d = r?.data ?? r; if (d) setPreview(d);
    }).catch(() => {});
    window.nakora?.system.getInfo().then(r => {
      const d = r?.data ?? r; if (d) setSysInfo(d);
    }).catch(() => {});
    window.nakora?.dns.getStats().then(r => {
      const d = r?.data ?? r; if (d) setSession(d);
    }).catch(() => {});
    window.nakora?.settings.getSettings().then(r => {
      const d = r?.data ?? r; if (d?.budgets) setBudgets(d.budgets);
    }).catch(() => {});
  }, []);

  const handleExport = async () => {
    setStatus('running'); setResult(null);
    const r = await window.nakora?.export.generate({}).catch(e => ({ data: { ok: false, error: e.message } }));
    const d = r?.data ?? r;
    if (!d)         { setStatus('error'); setResult({ error: 'No response from main process. Run in Electron.' }); return; }
    if (d.canceled) { setStatus('idle'); return; }
    if (d.ok)       { setStatus('done');  setResult(d); }
    else            { setStatus('error'); setResult(d); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
      <ExportAction status={status} result={result} onExport={handleExport} t={t} />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, overflow: 'hidden' }}>
        <Card t={t} style={{ overflow: 'auto' }}>
          <SectionHeader t={t}>Export Contents</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SECTIONS.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '7px 8px', background: t.surface, borderRadius: 3, border: `1px solid ${t.border}` }}>
                <span style={{ color: t.accent, fontSize: 10, fontFamily: t.mono, flexShrink: 0, marginTop: 1 }}>▸</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: t.text, fontSize: 11, fontFamily: t.mono }}>{s.key}</div>
                  <div style={{ color: t.textDim, fontSize: 10 }}>{s.desc}</div>
                </div>
                <Tag label="REAL" color={t.safe} t={t} small />
              </div>
            ))}
            <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, marginTop: 3, padding: '0 2px' }}>
              API keys are NEVER exported. Filename: nakora-export-YYYY-MM-DD-HH-MM.json
            </div>
          </div>
        </Card>

        <ExportPreview sysInfo={sysInfo} session={session} preview={preview} t={t} />
      </div>

      <div style={{ background: t.safeDim, border: `1px solid ${t.safe}33`, borderRadius: 3,
        padding: '8px 12px', flexShrink: 0 }}>
        <div style={{ color: t.safe, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.04em', lineHeight: 1.5 }}>
          GDPR NOTE — Locally-generated session data only. No data transmitted to external services without explicit consent.
          Processed under GDPR Art. 32 minimisation. Retention: {budgets.dataRetentionDays} days. API keys: [REDACTED].
        </div>
      </div>
    </div>
  );
}
