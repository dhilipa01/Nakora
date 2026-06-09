import React from 'react';
import { Card, SectionHeader, Sparkline } from '../../shared/primitives.jsx';
import ProgressBar from '../../shared/ProgressBar.jsx';
import { Tag } from '../../shared/Tag.jsx';

export default function EtwMonitorPanel({ etw, t }) {
  const cpuColor = etw.cpu.usagePercent > 70 ? t.danger : etw.cpu.usagePercent > 40 ? t.warn : t.safe;
  const memColor = etw.mem.usedPercent  > 80 ? t.danger : t.info;

  return (
    <Card t={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionHeader t={t}>
        ETW Monitor
        <span style={{ color: t.warn, fontSize: 9, fontFamily: t.mono, marginLeft: 8 }}>PARTIAL — kernel events Phase 2</span>
      </SectionHeader>

      {/* CPU + Memory */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>CPU</span>
            <span style={{ color: cpuColor, fontSize: 9, fontFamily: t.mono }}>{etw.cpu.usagePercent}%</span>
          </div>
          <ProgressBar value={etw.cpu.usagePercent} max={100} color={cpuColor} t={t} h={7} />
          <div style={{ marginTop: 3 }}>
            <Sparkline data={etw.cpu.history || []} color={t.accent} w="100%" h={22} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>MEM</span>
            <span style={{ color: memColor, fontSize: 9, fontFamily: t.mono }}>{etw.mem.usedPercent}%</span>
          </div>
          <ProgressBar value={etw.mem.usedPercent} max={100} color={memColor} t={t} h={7} />
          <div style={{ marginTop: 3 }}>
            <Sparkline data={etw.mem.history || []} color={t.info} w="100%" h={22} />
          </div>
        </div>
      </div>

      {/* Active connections */}
      {etw.conns.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.08em', marginBottom: 4 }}>
            ACTIVE CONNECTIONS ({etw.conns.length}) — REAL
          </div>
          <div style={{ maxHeight: 68, overflow: 'auto' }}>
            {etw.conns.slice(0, 6).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '2px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.foreign}</span>
                <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono }}>{c.state}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top processes */}
      {etw.procs.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.08em', marginBottom: 4 }}>
            TOP PROCESSES — REAL
          </div>
          {etw.procs.slice(0, 4).map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '2px 0', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ color: t.text, fontSize: 9, fontFamily: t.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.Name || p.name}</span>
              <span style={{ color: t.warn, fontSize: 9, fontFamily: t.mono }}>{p.CPU ?? p.cpu ?? 0}%</span>
              <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>{p.WS_MB ?? ''}MB</span>
            </div>
          ))}
        </div>
      )}

      {/* Simulated ETW events */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.08em', marginBottom: 4 }}>
          ETW EVENT STREAM <Tag label="SIMULATED" color={t.warn} t={t} small />
        </div>
        {etw.events.slice(0, 10).map((evt, i) => {
          const msg = typeof evt === 'string' ? evt : (evt?.message ?? String(evt));
          const c = msg.includes('CRYPTO') || msg.includes('CPU') ? t.warn : t.textMid;
          return (
            <div key={i} style={{ color: c, fontSize: 9, fontFamily: t.mono, padding: '2px 0', borderBottom: `1px solid ${t.border}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {msg}
            </div>
          );
        })}
        {etw.events.length === 0 && (
          <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>awaiting events...</div>
        )}
      </div>
    </Card>
  );
}
