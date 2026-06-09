import React from 'react';

export function Card({ children, t, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: t.card, border: `1px solid ${t.border}`, borderRadius: 6,
        padding: '12px 14px', transition: 'border-color 0.15s',
        cursor: onClick ? 'pointer' : 'default', ...style,
      }}
      onMouseEnter={onClick ? e => e.currentTarget.style.borderColor = t.borderBright : null}
      onMouseLeave={onClick ? e => e.currentTarget.style.borderColor = t.border : null}
    >
      {children}
    </div>
  );
}

export default function StatCard({ label, value, color, t, sub }) {
  return (
    <Card t={t} style={{ flex: 1 }}>
      <div style={{
        color: t.textDim, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', fontFamily: t.mono, marginBottom: 6,
      }}>{label}</div>
      <div style={{
        color: color || t.accentBright, fontFamily: t.mono,
        fontSize: 24, fontWeight: 700, lineHeight: 1,
      }}>{value}</div>
      {sub && <div style={{ color: t.textDim, fontSize: 10, marginTop: 4, fontFamily: t.mono }}>{sub}</div>}
    </Card>
  );
}
