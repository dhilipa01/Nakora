import React from 'react';
import { Card } from '../../shared/primitives.jsx';
import { ScoreBadge, VerdictBadge } from '../../shared/Tag.jsx';
import { verdictColor, verdictBg } from '../../../theme.js';

export default function RecentVerdictsFeed({ feed, onSelectEntry, onViewAll, t }) {
  return (
    <Card t={t} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px 7px', borderBottom: `1px solid ${t.border}`, flexShrink: 0,
      }}>
        <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.1em' }}>RECENT VERDICTS</span>
        <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: t.textMid, fontSize: 9, fontFamily: t.mono, cursor: 'pointer' }}>
          VIEW ALL →
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {feed.slice(0, 50).map((entry, i) => (
          <div
            key={`${entry.domain}-${entry.time}-${i}`}
            onClick={() => onSelectEntry(entry)}
            style={{
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
  );
}
