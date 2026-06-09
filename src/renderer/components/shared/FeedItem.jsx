import React from 'react';
import { Tag, ScoreBadge, VerdictBadge } from './Tag.jsx';
import { verdictColor, verdictBg } from '../../theme.js';

export default function FeedItem({ time, domain, verdict, score, trigger, analyzer, onClick, t }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      aria-label={`${verdict} — ${domain} — score ${score}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
        background: verdict !== 'CLEAN' ? verdictBg(verdict, t) : 'transparent',
        borderRadius: 3, cursor: 'pointer',
        borderLeft: `2px solid ${verdict !== 'CLEAN' ? verdictColor(verdict, t) : t.border}`,
        animation: 'fadein 0.2s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = t.card}
      onMouseLeave={e => e.currentTarget.style.background = verdict !== 'CLEAN' ? verdictBg(verdict, t) : 'transparent'}
    >
      <span style={{ color: t.textDim, fontSize: 10, fontFamily: t.mono, flexShrink: 0, width: 68 }}>
        {String(time || '').slice(11, 19)}
      </span>
      <span style={{
        flex: 1, color: t.text, fontSize: 11, fontFamily: t.mono,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{domain}</span>
      <ScoreBadge score={score} t={t} />
      <VerdictBadge verdict={verdict} t={t} />
      <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>{analyzer}</span>
    </div>
  );
}
