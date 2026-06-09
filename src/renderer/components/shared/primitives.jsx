import React from 'react';

// Re-exports from individual component files
export { Tag, ScoreBadge, VerdictBadge } from './Tag.jsx';
export { default as Toggle }             from './Toggle.jsx';
export { default as ProgressBar }        from './ProgressBar.jsx';
export { Card }                          from './StatCard.jsx';
export { default as StatCard }           from './StatCard.jsx';
export { default as FeedItem }           from './FeedItem.jsx';
export { default as ConfirmButton }      from './ConfirmButton.jsx';
export { default as AccordionSection }   from './AccordionSection.jsx';
export { default as FilterBar }          from './FilterBar.jsx';

// Inline primitives without individual files

export const StatusDot = ({ active, t, size = 7 }) => {
  const c = active ? t.accent : t.textDim;
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%', background: c,
      boxShadow: active ? `0 0 6px ${c}` : 'none',
      animation: active ? 'pulse 2.5s ease-in-out infinite' : 'none',
      flexShrink: 0,
    }} />
  );
};

export const SectionHeader = ({ children, t }) => (
  <div style={{
    color: t.textMid, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
    textTransform: 'uppercase', fontFamily: t.mono, marginBottom: 10,
    borderBottom: `1px solid ${t.border}`, paddingBottom: 5,
  }}>{children}</div>
);

export const Sparkline = ({ data, color, h = 28, w = 90 }) => {
  if (!data?.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  );
};

export const Input = ({ value, onChange, placeholder, t, password, style = {} }) => (
  <input
    type={password ? 'password' : 'text'}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 3,
      padding: '6px 10px', color: t.text, fontSize: 12, fontFamily: t.mono,
      width: '100%', outline: 'none', transition: 'border-color 0.15s', ...style,
    }}
    onFocus={e => e.target.style.borderColor = t.accent}
    onBlur={e => e.target.style.borderColor = t.border}
  />
);

export const Btn = ({ children, onClick, t, color, danger, disabled, small, style = {} }) => {
  const c = danger ? t.danger : color || t.accent;
  return (
    <button
      type="button"
      onClick={disabled ? null : onClick}
      disabled={disabled}
      style={{
        background: disabled ? t.border : c + '18', color: disabled ? t.textDim : c,
        border: `1px solid ${disabled ? t.border : c + '55'}`, borderRadius: 3,
        padding: small ? '3px 9px' : '6px 14px', fontSize: small ? 10 : 12,
        fontFamily: t.mono, cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap', ...style,
      }}
      onMouseEnter={!disabled ? e => e.currentTarget.style.background = c + '30' : null}
      onMouseLeave={!disabled ? e => e.currentTarget.style.background = c + '18' : null}
    >{children}</button>
  );
};
