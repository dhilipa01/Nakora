import React, { useState, useMemo } from 'react';
import { useAppState } from '../../../context/AppState.context.jsx';
import { useDnsFeed, useEtwMetrics } from '../../../hooks/usePolling.js';
import DnsStatStrip from './DnsStatStrip.jsx';
import AbuseBreakdownPanel from './AbuseBreakdownPanel.jsx';
import EtwMonitorPanel from './EtwMonitorPanel.jsx';
import QueryStream from './QueryStream.jsx';

const FIRST_LABELS = ['Phishing', 'Malware C2', 'Cryptojacking', 'DNS Tunneling', 'DGA', 'Cache Poisoning'];

export default function DnsMonitor({ t }) {
  const { selectEntry } = useAppState();
  const feed = useDnsFeed(300);
  const etw  = useEtwMetrics();

  const [search, setSearch] = useState('');
  const [typeF,  setTypeF]  = useState('ALL');

  const filtered = useMemo(() => {
    let rows = feed;
    if (typeF  !== 'ALL') rows = rows.filter(e => e.abuseType === typeF);
    if (search) rows = rows.filter(e => e.domain.toLowerCase().includes(search.toLowerCase()));
    return rows;
  }, [feed, search, typeF]);

  const firstCounts = useMemo(() => {
    const c = {}; FIRST_LABELS.forEach(k => c[k] = 0);
    feed.forEach(e => { if (c[e.abuseType] !== undefined) c[e.abuseType]++; });
    return c;
  }, [feed]);

  const blocked   = feed.filter(e => e.verdict === 'BLOCKED').length;
  const anomalous = feed.filter(e => e.verdict !== 'CLEAN').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
      <DnsStatStrip total={feed.length} anomalous={anomalous} blocked={blocked} t={t} />

      <div style={{ display: 'flex', gap: 10, flexShrink: 0, minHeight: 220 }}>
        <AbuseBreakdownPanel firstCounts={firstCounts} t={t} />
        <EtwMonitorPanel etw={etw} t={t} />
      </div>

      <QueryStream
        rows={filtered}
        onSelectEntry={selectEntry}
        onSearch={setSearch}
        onTypeFilter={setTypeF}
        t={t}
      />
    </div>
  );
}
