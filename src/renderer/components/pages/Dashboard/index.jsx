import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../../context/AppState.context.jsx';
import { useDnsFeed, useDnsStats } from '../../../hooks/usePolling.js';
import { StatCard, Card, SectionHeader, Tag, ScoreBadge, VerdictBadge, ProgressBar, Sparkline, StatusDot } from '../../shared/primitives.jsx';
import { verdictColor, verdictBg } from '../../../theme.js';

const FIRST_TYPES = ['Phishing','Malware C2','Cryptojacking','DNS Tunneling','DGA','Cache Poisoning'];
const COMPONENTS  = [
  { label: 'DNS Resolver (CISA PDNS)',   key: 'dnsResolver' },
  { label: 'ETW Cryptojacking Monitor',  key: 'etwCryptojack' },
  { label: 'ML.NET On-Device Inference', key: 'mlNet' },
  { label: 'Go Microservice :8080',      key: 'go', alwaysOn: true },
  { label: 'PQC API Layer (BETA)',        key: 'pqcSigning' },
  { label: 'PhishTank Feed',             key: 'phishtank' },
  { label: 'OpenPhish Feed',             key: 'openphish' },
];

export default function Dashboard({ t }) {
  const { selectEntry, navigateTo } = useAppState();
  const feed           = useDnsFeed(60);
  const { data: stats } = useDnsStats();
  const s = stats || { scanned: 0, blocked: 0, warned: 0 };

  const [filterLists, setFilterLists] = useState([]);
  const [toggles, setToggles]         = useState({});
  const scanHist  = useRef(Array(20).fill(0));
  const blockHist = useRef(Array(20).fill(0));
  const [, forceRender] = useState(0);

  useEffect(() => {
    window.nakora?.settings.getSettings().then(r => {
      const d = r?.data ?? r; if (d?.toggles) setToggles(d.toggles);
    }).catch(() => {});
    window.nakora?.domains.getFilterLists().then(r => {
      const d = r?.data ?? r; if (Array.isArray(d)) setFilterLists(d);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    scanHist.current  = [...scanHist.current.slice(1),  s.scanned];
    blockHist.current = [...blockHist.current.slice(1), s.blocked];
    forceRender(n => n + 1);
  }, [s.scanned]);

  const firstCounts = useMemo(() => {
    const c = {}; FIRST_TYPES.forEach(k => c[k] = 0);
    feed.forEach(e => { if (e.abuseType && c[e.abuseType] !== undefined) c[e.abuseType]++; });
    return c;
  }, [feed]);

  const maxFirst    = Math.max(...Object.values(firstCounts), 1);
  const totalActive = filterLists.filter(l => l.enabled).reduce((a, l) => a + (l.count || 0), 0);
  const lastLatency = feed[0]?.latency ?? '--';
  const level       = s.blocked > 8 ? 'HIGH' : s.warned > 5 ? 'MEDIUM' : 'LOW';
  const levelColor  = level === 'HIGH' ? t.danger : level === 'MEDIUM' ? t.warn : t.safe;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

      {/* Zone 1 — stat row */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <StatCard label="Domains Scanned" value={s.scanned.toLocaleString()} color={t.accentBright} t={t}
          sub={<Sparkline data={scanHist.current} color={t.accent} w={70} h={18} />} />
        <StatCard label="Threats Blocked" value={s.blocked} color={t.danger} t={t}
          sub={<Sparkline data={blockHist.current} color={t.danger} w={70} h={18} />} />
        <StatCard label="Warnings" value={s.warned} color={t.warn} t={t} />
        <StatCard label="DNS Latency" value={`${lastLatency}ms`}
          color={lastLatency !== '--' && lastLatency > 30 ? t.warn : t.safe} t={t}
          sub={<span style={{ color: t.textDim, fontSize: 10, fontFamily: t.mono }}>target &lt;30ms</span>} />
        <StatCard label="Active Blocklist" value={totalActive.toLocaleString()} color={t.info} t={t} />
      </div>

      {/* Zone 2 — middle row */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0, minHeight: 210 }}>

        {/* Left: threat level + FIRST.org + health */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card t={t}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div>
                <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.1em', marginBottom: 3 }}>THREAT LEVEL</div>
                <div style={{ color: levelColor, fontFamily: t.mono, fontSize: 28, fontWeight: 700,
                  textShadow: `0 0 10px ${levelColor}66` }}>{level}</div>
              </div>
              <div style={{ width: 1, height: 40, background: t.border }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.08em', marginBottom: 7 }}>
                  FIRST.ORG DNS ABUSE MATRIX
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px 12px' }}>
                  {FIRST_TYPES.map(type => {
                    const c = (type.includes('Phishing')||type.includes('Malware')||type==='DGA'||type.includes('Poison')) ? t.danger : t.warn;
                    return (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono }}>{type.slice(0,12).toUpperCase()}</span>
                          <span style={{ color: c, fontSize: 9, fontFamily: t.mono }}>{firstCounts[type] || 0}</span>
                        </div>
                        <ProgressBar value={firstCounts[type] || 0} max={maxFirst} color={c} t={t} h={3} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card t={t} style={{ flex: 1 }}>
            <SectionHeader t={t}>System Health</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {COMPONENTS.map(comp => {
                const on = comp.alwaysOn || !!toggles[comp.key];
                return (
                  <div key={comp.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusDot active={on} t={t} />
                    <span style={{ flex: 1, color: on ? t.text : t.textDim, fontSize: 12, fontFamily: t.mono }}>{comp.label}</span>
                    <Tag label={on ? 'ACTIVE' : 'OFF'} color={on ? t.accent : t.textDim} t={t} small />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: threat intel feeds */}
        <Card t={t} style={{ flex: 2, overflow: 'auto' }}>
          <SectionHeader t={t}>Threat Intelligence Sources</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {filterLists.filter(l => l.id !== 'manual').map(list => (
              <div key={list.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                background: t.surface, borderRadius: 3, opacity: list.enabled ? 1 : 0.45,
                border: `1px solid ${list.enabled ? t.border : t.textDim + '22'}`,
              }}>
                <StatusDot active={list.enabled} t={t} size={6} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.name}</div>
                  <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>{(list.count || 0).toLocaleString()} entries</div>
                </div>
                <Tag label={list.category} color={t.info} t={t} small />
              </div>
            ))}
            {filterLists.length === 0 && <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono }}>loading...</div>}
          </div>
        </Card>
      </div>

      {/* Zone 3 — scrolling verdict feed */}
      <Card t={t} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px 7px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.1em' }}>RECENT VERDICTS</span>
          <button onClick={() => navigateTo('threatlog')} style={{ background: 'none', border: 'none', color: t.textMid, fontSize: 9, fontFamily: t.mono, cursor: 'pointer' }}>
            VIEW ALL →
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {feed.slice(0, 50).map((entry, i) => (
            <div key={`${entry.domain}-${entry.time}-${i}`} onClick={() => selectEntry(entry)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px',
              background: entry.verdict !== 'CLEAN' ? verdictBg(entry.verdict, t) : i % 2 === 0 ? t.surface : 'transparent',
              borderLeft: entry.verdict !== 'CLEAN' ? `2px solid ${verdictColor(entry.verdict, t)}` : '2px solid transparent',
              cursor: 'pointer', animation: i === 0 ? 'fadein 0.2s ease' : 'none',
            }}
              onMouseEnter={e => e.currentTarget.style.background = t.card}
              onMouseLeave={e => e.currentTarget.style.background = entry.verdict !== 'CLEAN' ? verdictBg(entry.verdict, t) : i % 2 === 0 ? t.surface : 'transparent'}
            >
              <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, width: 68, flexShrink: 0 }}>
                {typeof entry.time === 'string' ? entry.time.slice(11, 19) : '--'}
              </span>
              <span style={{ flex: 1, color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.domain}
              </span>
              <ScoreBadge score={entry.score} t={t} />
              <VerdictBadge verdict={entry.verdict} t={t} />
              <span style={{ color: t.info, fontSize: 9, fontFamily: t.mono, width: 32, textAlign: 'right' }}>{entry.latency}ms</span>
            </div>
          ))}
          {feed.length === 0 && (
            <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: 16, textAlign: 'center' }}>
              --- awaiting DNS queries ---
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
