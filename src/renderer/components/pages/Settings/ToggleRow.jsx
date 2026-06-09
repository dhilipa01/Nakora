import React from 'react';
import { Toggle } from '../../shared/primitives.jsx';

export default function ToggleRow({ label, desc, note, value, onChange, t, color }) {
  const c = color || t.accent;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '9px 0', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ flex: 1, paddingRight: 14 }}>
        <div style={{ color: t.text, fontSize: 12, fontFamily: t.mono, marginBottom: 2 }}>{label}</div>
        <div style={{ color: t.textDim, fontSize: 11 }}>{desc}</div>
        {value && note && <div style={{ color: c + 'aa', fontSize: 10, marginTop: 2, fontFamily: t.mono }}>{note}</div>}
      </div>
      <Toggle value={!!value} onChange={onChange} t={t} color={c} />
    </div>
  );
}
