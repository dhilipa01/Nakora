import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, Tag, Btn } from '../../shared/primitives.jsx';

const SECTIONS = [
  { key: 'export_metadata',  label: 'Export Metadata',    desc: 'App version, timestamp, GDPR note',                real: true  },
  { key: 'system',           label: 'System Info',         desc: 'Hostname (partial), OS, CPU model — real values',  real: true  },
  { key: 'session',          label: 'Session Stats',        desc: 'Scanned, blocked, warned — real counters',         real: true  },
  { key: 'configuration',    label: 'Configuration',        desc: 'All toggle states, budgets, API key status',       real: true  },
  { key: 'domain_lists',     label: 'Domain Lists',         desc: 'User whitelist, manual blacklist entries',         real: true  },
  { key: 'threat_log',       label: 'Threat Log (50)',      desc: 'Session threat detections',                        real: true  },
  { key: 'dns_log_sample',   label: 'DNS Log Sample (30)', desc: 'Recent DNS query sample',                           real: true  },
  { key: 'etw_snapshot',     label: 'ETW Snapshot',         desc: 'Real CPU, mem, processes, connections at export',  real: true  },
];

export default function Export({ t }) {
  const [status,   setStatus]  = useState('idle');
  const [result,   setResult]  = useState(null);
  const [preview,  setPreview] = useState(null);
  const [sysInfo,  setSysInfo] = useState(null);
  const [session,  setSession] = useState(null);
  const [budgets,  setBudgets] = useState({ dataRetentionDays: 90 });

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
    if (!d)                  { setStatus('error'); setResult({ error: 'No response from main process. Run in Electron.' }); return; }
    if (d.canceled)          { setStatus('idle'); return; }
    if (d.ok)                { setStatus('done');  setResult(d); }
    else                     { setStatus('error'); setResult(d); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

      {/* Header + action */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
        <div>
          <div style={{ color: t.text, fontSize: 14, fontFamily: t.mono, fontWeight: 700, marginBottom: 3 }}>DATA EXPORT</div>
          <div style={{ color: t.textDim, fontSize: 12 }}>
            Opens a native Windows save dialog. Writes real JSON — system data, session counters, config, domain lists.
          </div>
          <div style={{ color: t.textDim, fontSize: 10, marginTop: 3, fontFamily: t.mono }}>
            GDPR Art. 20 — right to data portability · Art. 17 — right to erasure (Delete in Settings)
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <Btn t={t} onClick={handleExport} disabled={status === 'running'} style={{ minWidth: 260 }}>
            {status === 'running' ? 'WRITING FILE...' : status === 'done' ? 'EXPORT AGAIN' : 'EXPORT DATA — OPEN SAVE DIALOG'}
          </Btn>
          {status === 'done' && result?.path && (
            <div style={{ color: t.safe, fontSize: 10, fontFamily: t.mono }}>✓ saved: {result.path}</div>
          )}
          {status === 'error' && (
            <div style={{ color: t.danger, fontSize: 10, fontFamily: t.mono }}>✗ {result?.error || 'export failed'}</div>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, overflow: 'hidden' }}>

        {/* Left: export manifest */}
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

        {/* Right: live preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

          {/* System snapshot */}
          <Card t={t} style={{ flexShrink: 0 }}>
            <SectionHeader t={t}>System Snapshot (Live)</SectionHeader>
            {sysInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  ['hostname_partial', sysInfo.hostnamePartial],
                  ['platform',         sysInfo.platform],
                  ['os_release',       sysInfo.release],
                  ['cpu_model',        (sysInfo.cpuModel || '').slice(0, 38)],
                  ['cpu_cores',        sysInfo.cpuCores],
                  ['total_memory_gb',  sysInfo.totalMemGb + ' GB'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 10, padding: '2px 0', borderBottom: `1px solid ${t.border}` }}>
                    <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, width: 130, flexShrink: 0 }}>{k}</span>
                    <span style={{ color: t.text, fontSize: 9, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(v ?? '--')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono }}>loading...</div>
            )}
          </Card>

          {/* Session stats */}
          <Card t={t} style={{ flexShrink: 0 }}>
            <SectionHeader t={t}>Session Stats (Live)</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['domains_scanned',  session?.scanned  ?? 0, t.accentBright],
                ['threats_blocked',  session?.blocked  ?? 0, t.danger],
                ['warnings_issued',  session?.warned   ?? 0, t.warn],
                ['duration_sec',     session?.durationSeconds ?? 0, t.info],
              ].map(([k, v, c]) => (
                <div key={k} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 3, padding: '7px 9px' }}>
                  <div style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono, marginBottom: 2 }}>{k}</div>
                  <div style={{ color: c, fontSize: 18, fontFamily: t.mono, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Config preview */}
          <Card t={t} style={{ flex: 1, overflow: 'auto' }}>
            <SectionHeader t={t}>Config Preview</SectionHeader>
            {preview?.systemInfo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, marginBottom: 4 }}>
                  {SECTIONS.length} sections · {preview.fields?.length || SECTIONS.length} top-level keys
                </div>
                <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>
                  Export will include: {SECTIONS.map(s => s.key).join(', ')}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* GDPR footer */}
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
