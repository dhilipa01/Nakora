import React, { useState, useMemo } from 'react';
import { useAppState } from '../../../context/AppState.context.jsx';
import { useDnsFeed, useEtwMetrics } from '../../../hooks/usePolling.js';
import { StatCard, Card, SectionHeader, Tag, VerdictBadge, ProgressBar, Sparkline, FilterBar } from '../../shared/primitives.jsx';
import { verdictBg, abuseColor } from '../../../theme.js';

const FIRST_TYPES = [
  { label: 'Phishing',       desc: 'Deceptive brand-spoofing sites' },
  { label: 'Malware C2',     desc: 'Command & control callbacks'    },
  { label: 'Cryptojacking',  desc: 'Mining pool / coin domains'     },
  { label: 'DNS Tunneling',  desc: 'Data exfil via DNS protocol'    },
  { label: 'DGA',            desc: 'Domain generation algorithms'   },
  { label: 'Cache Poisoning',desc: 'DNS spoofing attempts'          },
];

export default function DnsMonitor({ t }) {
  const { selectEntry } = useAppState();
  const feed = useDnsFeed(300);
  const etw  = useEtwMetrics();

  const [search,  setSearch]  = useState('');
  const [typeF,   setTypeF]   = useState('ALL');

  const filtered = useMemo(() => {
    let rows = feed;
    if (typeF  !== 'ALL') rows = rows.filter(e => e.abuseType === typeF);
    if (search) rows = rows.filter(e => e.domain.toLowerCase().includes(search.toLowerCase()));
    return rows;
  }, [feed, search, typeF]);

  const firstCounts = useMemo(() => {
    const c = {}; FIRST_TYPES.forEach(f => c[f.label] = 0);
    feed.forEach(e => { if (c[e.abuseType] !== undefined) c[e.abuseType]++; });
    return c;
  }, [feed]);
  const maxCount = Math.max(...Object.values(firstCounts), 1);

  const blocked   = feed.filter(e => e.verdict === 'BLOCKED').length;
  const anomalous = feed.filter(e => e.verdict !== 'CLEAN').length;
  const cpuColor  = etw.cpu.usagePercent > 70 ? t.danger : etw.cpu.usagePercent > 40 ? t.warn : t.safe;
  const memColor  = etw.mem.usedPercent  > 80 ? t.danger : t.info;

  const QUERY_GRID = '70px 45px 1fr 75px 100px 40px';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

      {/* Top stat strip */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <StatCard label="Total Queries" value={feed.length.toLocaleString()} color={t.accentBright} t={t} />
        <StatCard label="Anomalous"     value={anomalous}                    color={t.warn}         t={t} />
        <StatCard label="Blocked DNS"   value={blocked}                      color={t.danger}       t={t} />
      </div>

      {/* Middle row: FIRST.org + ETW */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0, minHeight: 220 }}>

        {/* FIRST.org abuse breakdown */}
        <Card t={t} style={{ flex: 1 }}>
          <SectionHeader t={t}>FIRST.org DNS Abuse Matrix</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {FIRST_TYPES.map(({ label, desc }) => {
              const count = firstCounts[label] || 0;
              const c = abuseColor(label, t);
              return (
                <div key={label}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
                    <div>
                      <span style={{ color: t.text, fontSize: 12, fontFamily: t.mono }}>{label}</span>
                      <span style={{ color: t.textDim, fontSize: 9, marginLeft: 8 }}>{desc}</span>
                    </div>
                    <span style={{ color: c, fontSize: 13, fontFamily: t.mono, fontWeight: 700 }}>{count}</span>
                  </div>
                  <ProgressBar value={count} max={maxCount} color={c} t={t} h={4} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* ETW Monitor panel */}
        <Card t={t} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <SectionHeader t={t}>ETW Monitor</SectionHeader>
            <Tag label="PARTIAL — kernel tap in production" color={t.warn} t={t} small />
          </div>

          {/* Real CPU + memory */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexShrink: 0 }}>
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

          {/* Real connections */}
          {etw.conns.length > 0 && (
            <div style={{ marginBottom: 8, flexShrink: 0 }}>
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

          {/* Real top processes */}
          {etw.procs.length > 0 && (
            <div style={{ marginBottom: 8, flexShrink: 0 }}>
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
                <div key={i} style={{ color: c, fontSize: 9, fontFamily: t.mono, padding: '2px 0',
                  borderBottom: `1px solid ${t.border}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {msg}
                </div>
              );
            })}
            {etw.events.length === 0 && (
              <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>awaiting events...</div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom: live query stream */}
      <Card t={t} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0' }}>
        {/* Filter bar */}
        <div style={{ padding: '7px 10px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <FilterBar onSearch={setSearch} t={t}
            analyzers={FIRST_TYPES.map(f => f.label)}
            onAnalyzerChange={setTypeF} />
        </div>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: QUERY_GRID, padding: '5px 10px',
          borderBottom: `1px solid ${t.border}`, gap: 8, flexShrink: 0 }}>
          {['TIME','TYPE','DOMAIN','VERDICT','ANALYZER','MS'].map(h => (
            <span key={h} style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.08em' }}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filtered.map((entry, i) => (
            <div key={i} onClick={() => selectEntry(entry)} style={{
              display: 'grid', gridTemplateColumns: QUERY_GRID, padding: '4px 10px', gap: 8,
              cursor: 'pointer', alignItems: 'center',
              background: entry.verdict !== 'CLEAN' ? verdictBg(entry.verdict, t) : i % 2 === 0 ? t.surface : 'transparent',
              animation: i === 0 ? 'fadein 0.2s ease' : 'none',
            }}
              onMouseEnter={e => e.currentTarget.style.background = t.card}
              onMouseLeave={e => e.currentTarget.style.background = entry.verdict !== 'CLEAN' ? verdictBg(entry.verdict, t) : i % 2 === 0 ? t.surface : 'transparent'}
            >
              <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>{typeof entry.time === 'string' ? entry.time.slice(11, 19) : '--'}</span>
              <Tag label={entry.type || 'A'} color={t.info} t={t} small />
              <span style={{ color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.domain}</span>
              <VerdictBadge verdict={entry.verdict} t={t} />
              <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.analyzer}</span>
              <span style={{ color: t.info, fontSize: 9, fontFamily: t.mono }}>{entry.latency}ms</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: 18, textAlign: 'center' }}>
              --- no queries yet ---
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
