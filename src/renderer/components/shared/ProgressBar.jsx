import React from 'react';

export default function ProgressBar({ value, max = 100, color, t, h = 4, label, showVal }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      {(label || showVal) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          {label   && <span style={{ color: t.textMid, fontSize: 10, fontFamily: t.mono }}>{label}</span>}
          {showVal && <span style={{ color, fontSize: 10, fontFamily: t.mono }}>{value}</span>}
        </div>
      )}
      <div style={{ height: h, background: t.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          transition: 'width 0.4s ease', boxShadow: `0 0 6px ${color}88`,
        }} />
      </div>
    </div>
  );
}
