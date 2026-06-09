import React from 'react';

export default function BurgerButton({ t, onClick }) {
  return (
    <button
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      title="Toggle sidebar"
      style={{
        background: 'none', border: 'none', color: t.textMid, cursor: 'pointer',
        fontSize: 16, fontFamily: t.mono, padding: '0 4px', lineHeight: 1,
        WebkitAppRegion: 'no-drag',
      }}
    >≡</button>
  );
}
