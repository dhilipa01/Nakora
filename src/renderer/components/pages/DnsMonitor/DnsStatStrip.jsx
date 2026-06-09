import React from 'react';
import StatCard from '../../shared/StatCard.jsx';

export default function DnsStatStrip({ total, anomalous, blocked, t }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
      <StatCard label="Total Queries" value={total.toLocaleString()} color={t.accentBright} t={t} />
      <StatCard label="Anomalous"     value={anomalous}             color={t.warn}         t={t} />
      <StatCard label="Blocked DNS"   value={blocked}               color={t.danger}       t={t} />
    </div>
  );
}
