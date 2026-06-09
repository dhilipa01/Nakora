import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../../context/AppState.context.jsx';
import { useDnsFeed, useDnsStats } from '../../../hooks/usePolling.js';
import StatRow from './StatRow.jsx';
import ThreatLevelPanel from './ThreatLevelPanel.jsx';
import FeedSyncPanel from './FeedSyncPanel.jsx';
import RecentVerdictsFeed from './RecentVerdictsFeed.jsx';

const FIRST_TYPES = ['Phishing', 'Malware C2', 'Cryptojacking', 'DNS Tunneling', 'DGA', 'Cache Poisoning'];

export default function Dashboard({ t }) {
  const { selectEntry, navigateTo } = useAppState();
  const feed             = useDnsFeed(60);
  const { data: stats }  = useDnsStats();
  const s = stats || { scanned: 0, blocked: 0, warned: 0 };

  const [filterLists, setFilterLists] = useState([]);
  const [toggles,     setToggles]     = useState({});
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

  const totalActive = filterLists.filter(l => l.enabled).reduce((a, l) => a + (l.count || 0), 0);
  const lastLatency = feed[0]?.latency ?? '--';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
      <StatRow stats={s} scanHist={scanHist.current} blockHist={blockHist.current}
        totalActive={totalActive} lastLatency={lastLatency} t={t} />

      <div style={{ display: 'flex', gap: 10, flexShrink: 0, minHeight: 210 }}>
        <ThreatLevelPanel stats={s} firstCounts={firstCounts} toggles={toggles} t={t} />
        <FeedSyncPanel filterLists={filterLists} t={t} />
      </div>

      <RecentVerdictsFeed feed={feed} onSelectEntry={selectEntry}
        onViewAll={() => navigateTo('threatlog')} t={t} />
    </div>
  );
}
