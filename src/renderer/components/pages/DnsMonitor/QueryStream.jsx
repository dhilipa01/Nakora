import React from 'react';
import { Card } from '../../shared/primitives.jsx';
import { VerdictBadge } from '../../shared/Tag.jsx';
import FilterBar from '../../shared/FilterBar.jsx';
import { Tag } from '../../shared/Tag.jsx';
import { verdictBg } from '../../../theme.js';

const FIRST_LABELS = ['Phishing', 'Malware C2', 'Cryptojacking', 'DNS Tunneling', 'DGA', 'Cache Poisoning'];
const GRID = '70px 45px 1fr 75px 100px 40px';

export default function QueryStream({ rows, onSelectEntry, onSearch, onTypeFilter, t }) {
  return (
    <Card t={t} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ padding: '7px 10px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <FilterBar onSearch={onSearch} t={t} analyzers={FIRST_LABELS} onAnalyzerChange={onTypeFilter} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '5px 10px', borderBottom: `1px solid ${t.border}`, gap: 8, flexShrink: 0 }}>
        {['TIME', 'TYPE', 'DOMAIN', 'VERDICT', 'ANALYZER', 'MS'].map(h => (
          <span key={h} style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.08em' }}>{h}</span>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {rows.map((entry, i) => (
          <div
            key={i}
            onClick={() => onSelectEntry(entry)}
            style={{
              display: 'grid', gridTemplateColumns: GRID, padding: '4px 10px', gap: 8,
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
        {rows.length === 0 && (
          <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: 18, textAlign: 'center' }}>
            --- no queries yet ---
          </div>
        )}
      </div>
    </Card>
  );
}
