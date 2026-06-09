import React from 'react';

export default function Toggle({ value, onChange, t, color }) {
  const c = color || t.accent;
  return (
    <div
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange(!value)}
      style={{
        width: 38, height: 20, borderRadius: 10, background: value ? c : t.border,
        position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
        boxShadow: value ? `0 0 8px ${c}66` : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 20 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </div>
  );
}
