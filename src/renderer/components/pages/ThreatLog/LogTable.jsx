import React from 'react';
import { Card } from '../../shared/primitives.jsx';
import { VerdictBadge, ScoreBadge } from '../../shared/Tag.jsx';
import { verdictBg } from '../../../theme.js';

const COL_HEADERS = [
  { key: 'time',     label: 'TIME',     w: '75px'  },
  { key: 'domain',   label: 'DOMAIN',   w: '1fr'   },
  { key: 'verdict',  label: 'VERDICT',  w: '85px'  },
  { key: 'score',    label: 'SCORE',    w: '55px'  },
  { key: 'trigger',  label: 'TRIGGER',  w: '130px' },
  { key: 'analyzer', label: 'ANALYZER', w: '130px' },
  { key: 'latency',  label: 'MS',       w: '45px'  },
];
const GRID = COL_HEADERS.map(c => c.w).join(' ');

export default function LogTable({ rows, selectedEntry, onSelectEntry, sortKey, sortDir, onSort, page, totalPages, onPageChange, t }) {
  const thStyle = key => ({
    color: sortKey === key ? t.accentBright : t.textDim,
    fontSize: 9, fontFamily: t.mono, letterSpacing: '0.1em',
    cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 3,
  });

  return (
    <Card t={t} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '7px 12px', borderBottom: `1px solid ${t.border}`, gap: 8, flexShrink: 0 }}>
        {COL_HEADERS.map(col => (
          <div key={col.key} style={thStyle(col.key)} onClick={() => onSort(col.key)}>
            {col.label}
            {sortKey === col.key && <span style={{ fontSize: 8 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {rows.map((entry, i) => {
          const isSelected = selectedEntry?.domain === entry.domain && selectedEntry?.time === entry.time;
          return (
            <div
              key={i}
              onClick={() => onSelectEntry(isSelected ? null : entry)}
              style={{
                display: 'grid', gridTemplateColumns: GRID, padding: '5px 12px', gap: 8,
                cursor: 'pointer', alignItems: 'center', transition: 'background 0.1s',
                background: isSelected ? t.accentDim : entry.verdict !== 'CLEAN' ? verdictBg(entry.verdict, t) : 'transparent',
                borderLeft: isSelected ? `2px solid ${t.accent}` : '2px solid transparent',
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
              <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.trigger}</span>
              <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.analyzer}</span>
              <span style={{ color: t.info, fontSize: 9, fontFamily: t.mono }}>{entry.latency}ms</span>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: 20, textAlign: 'center' }}>
            --- no entries match filter ---
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            style={{ background: 'none', border: `1px solid ${t.border}`, color: page <= 1 ? t.textDim : t.accent, fontFamily: t.mono, fontSize: 10, padding: '2px 8px', borderRadius: 3, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
            ← PREV
          </button>
          <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, flex: 1, textAlign: 'center' }}>
            PAGE {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            style={{ background: 'none', border: `1px solid ${t.border}`, color: page >= totalPages ? t.textDim : t.accent, fontFamily: t.mono, fontSize: 10, padding: '2px 8px', borderRadius: 3, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
            NEXT →
          </button>
        </div>
      )}
    </Card>
  );
}
