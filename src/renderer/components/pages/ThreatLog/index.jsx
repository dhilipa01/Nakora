import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../../../context/AppState.context.jsx';
import { useDnsFeed } from '../../../hooks/usePolling.js';
import { Card, ScoreBadge, VerdictBadge, Tag, FilterBar, ConfirmButton } from '../../shared/primitives.jsx';
import { verdictColor, verdictBg } from '../../../theme.js';

const ANALYZERS = ['Homoglyph/Punycode','PhishTank API','DGA Detector','Cryptojacking/ETW','Redirect Chain','ML.NET','Blocklist','OpenPhish Feed','Whitelist/Cache'];
const COL_HEADERS = [
  { key: 'time',     label: 'TIME',     w: '75px' },
  { key: 'domain',   label: 'DOMAIN',   w: '1fr'  },
  { key: 'verdict',  label: 'VERDICT',  w: '85px' },
  { key: 'score',    label: 'SCORE',    w: '55px' },
  { key: 'trigger',  label: 'TRIGGER',  w: '130px'},
  { key: 'analyzer', label: 'ANALYZER', w: '130px'},
  { key: 'latency',  label: 'MS',       w: '45px' },
];
const GRID = COL_HEADERS.map(c => c.w).join(' ');
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

  // Reset page on filter change
  useEffect(() => setPage(1), [search, verdict, analyzer]);

  const filtered = useMemo(() => {
    let rows = feed;
    if (verdict  !== 'ALL') rows = rows.filter(e => e.verdict  === verdict);
    if (analyzer !== 'ALL') rows = rows.filter(e => e.analyzer === analyzer);
    if (search)             rows = rows.filter(e => e.domain.toLowerCase().includes(search.toLowerCase()));
    rows = [...rows].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [feed, search, verdict, analyzer, sortKey, sortDir]);

  const pageRows  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const thStyle = (key) => ({
    color: sortKey === key ? t.accentBright : t.textDim,
    fontSize: 9, fontFamily: t.mono, letterSpacing: '0.1em', cursor: 'pointer',
    userSelect: 'none', display: 'flex', alignItems: 'center', gap: 3,
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <FilterBar
            onSearch={setSearch}
            onVerdictChange={setVerdict}
            onAnalyzerChange={setAnalyzer}
            t={t}
            analyzers={ANALYZERS}
          />
        </div>
        <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, whiteSpace: 'nowrap' }}>
          {filtered.length} entries
        </span>
        <ConfirmButton
          t={t}
          label="CLEAR LOG"
          confirmLabel="CONFIRM CLEAR"
          onConfirm={() => window.nakora?.dns.clearLog().catch(() => {})}
          timeout={3000}
        />
      </div>

      {/* Table */}
      <Card t={t} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '7px 12px',
          borderBottom: `1px solid ${t.border}`, gap: 8, flexShrink: 0 }}>
          {COL_HEADERS.map(col => (
            <div key={col.key} style={thStyle(col.key)} onClick={() => toggleSort(col.key)}>
              {col.label}
              {sortKey === col.key && <span style={{ fontSize: 8 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {pageRows.map((entry, i) => {
            const isSelected = selectedEntry?.domain === entry.domain && selectedEntry?.time === entry.time;
            return (
              <div key={i} onClick={() => selectEntry(isSelected ? null : entry)} style={{
                display: 'grid', gridTemplateColumns: GRID, padding: '5px 12px', gap: 8, cursor: 'pointer',
                alignItems: 'center', transition: 'background 0.1s',
                background: isSelected ? t.accentDim : entry.verdict !== 'CLEAN' ? verdictBg(entry.verdict, t) : 'transparent',
                borderLeft: isSelected ? `2px solid ${t.accent}` : `2px solid transparent`,
              }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.card; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = entry.verdict !== 'CLEAN' ? verdictBg(entry.verdict, t) : 'transparent'; }}
              >
                <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>
                  {typeof entry.time === 'string' ? entry.time.slice(11, 19) : '--'}
                </span>
                <span style={{ color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.domain}
                </span>
                <div><VerdictBadge verdict={entry.verdict} t={t} /></div>
                <div><ScoreBadge score={entry.score} t={t} /></div>
                <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.trigger}
                </span>
                <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.analyzer}
                </span>
                <span style={{ color: t.info, fontSize: 9, fontFamily: t.mono }}>{entry.latency}ms</span>
              </div>
            );
          })}
          {pageRows.length === 0 && (
            <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: 20, textAlign: 'center' }}>
              --- no entries match filter ---
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
            borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ background: 'none', border: `1px solid ${t.border}`, color: page <= 1 ? t.textDim : t.accent,
                fontFamily: t.mono, fontSize: 10, padding: '2px 8px', borderRadius: 3, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
              ← PREV
            </button>
            <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, flex: 1, textAlign: 'center' }}>
              PAGE {page} / {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ background: 'none', border: `1px solid ${t.border}`, color: page >= totalPages ? t.textDim : t.accent,
                fontFamily: t.mono, fontSize: 10, padding: '2px 8px', borderRadius: 3, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
              NEXT →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
