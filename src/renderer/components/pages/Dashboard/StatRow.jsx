import React from 'react';
import StatCard from '../../shared/StatCard.jsx';
import { Sparkline } from '../../shared/primitives.jsx';

export default function StatRow({ stats, scanHist, blockHist, totalActive, lastLatency, t }) {
  const s = stats || { scanned: 0, blocked: 0, warned: 0 };
  return (
    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
      <StatCard label="Domains Scanned" value={s.scanned.toLocaleString()} color={t.accentBright} t={t}
        sub={<Sparkline data={scanHist} color={t.accent} w={70} h={18} />} />
      <StatCard label="Threats Blocked" value={s.blocked} color={t.danger} t={t}
        sub={<Sparkline data={blockHist} color={t.danger} w={70} h={18} />} />
      <StatCard label="Warnings" value={s.warned} color={t.warn} t={t} />
      <StatCard label="DNS Latency" value={`${lastLatency}ms`}
        color={lastLatency !== '--' && lastLatency > 30 ? t.warn : t.safe} t={t}
        sub={<span style={{ color: t.textDim, fontSize: 10, fontFamily: t.mono }}>target &lt;30ms</span>} />
      <StatCard label="Active Blocklist" value={totalActive.toLocaleString()} color={t.info} t={t} />
    </div>
  );
}
