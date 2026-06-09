import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../../../context/AppState.context.jsx';
import { useDnsFeed } from '../../../hooks/usePolling.js';
import LogControls from './LogControls.jsx';
import LogTable from './LogTable.jsx';

const PAGE_SIZE = 50;

export default function ThreatLog({ t }) {
  const { selectEntry, selectedEntry } = useAppState();
  const feed = useDnsFeed(300);

  const [search,   setSearch]   = useState('');
  const [verdict,  setVerdict]  = useState('ALL');
  const [analyzer, setAnalyzer] = useState('ALL');
  const [sortKey,  setSortKey]  = useState('time');
  const [sortDir,  setSortDir]  = useState('desc');
  const [page,     setPage]     = useState(1);

  useEffect(() => setPage(1), [search, verdict, analyzer]);

  const filtered = useMemo(() => {
    let rows = feed;
    if (verdict  !== 'ALL') rows = rows.filter(e => e.verdict  === verdict);
    if (analyzer !== 'ALL') rows = rows.filter(e => e.analyzer === analyzer);
    if (search)             rows = rows.filter(e => e.domain.toLowerCase().includes(search.toLowerCase()));
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [feed, search, verdict, analyzer, sortKey, sortDir]);

  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
      <LogControls
        total={filtered.length}
        onSearch={setSearch}
        onVerdictChange={setVerdict}
        onAnalyzerChange={setAnalyzer}
        onClear={() => window.nakora?.dns.clearLog().catch(() => {})}
        t={t}
      />
      <LogTable
        rows={pageRows}
        selectedEntry={selectedEntry}
        onSelectEntry={selectEntry}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        t={t}
      />
    </div>
  );
}
