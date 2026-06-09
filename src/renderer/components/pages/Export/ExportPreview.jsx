import React from 'react';
import { Card, SectionHeader } from '../../shared/primitives.jsx';

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

export default function ExportPreview({ sysInfo, session, preview, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
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

      <Card t={t} style={{ flexShrink: 0 }}>
        <SectionHeader t={t}>Session Stats (Live)</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['domains_scanned', session?.scanned  ?? 0, t.accentBright],
            ['threats_blocked', session?.blocked  ?? 0, t.danger],
            ['warnings_issued', session?.warned   ?? 0, t.warn],
            ['duration_sec',    session?.durationSeconds ?? 0, t.info],
          ].map(([k, v, c]) => (
            <div key={k} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 3, padding: '7px 9px' }}>
              <div style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono, marginBottom: 2 }}>{k}</div>
              <div style={{ color: c, fontSize: 18, fontFamily: t.mono, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

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
  );
}
