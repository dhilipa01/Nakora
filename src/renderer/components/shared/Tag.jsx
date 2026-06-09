import React from 'react';
import { scoreColor, verdictColor } from '../../theme.js';

export const Tag = ({ label, color, t, small }) => (
  <span style={{
    background: color + '1a', color, border: `1px solid ${color}44`, borderRadius: 3,
    padding: small ? '1px 5px' : '2px 8px', fontSize: small ? 10 : 11,
    fontFamily: t.mono, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.04em',
  }}>{label}</span>
);

export const ScoreBadge = ({ score, t }) => <Tag label={String(score)} color={scoreColor(score, t)} t={t} />;
export const VerdictBadge = ({ verdict, t }) => <Tag label={verdict} color={verdictColor(verdict, t)} t={t} />;
