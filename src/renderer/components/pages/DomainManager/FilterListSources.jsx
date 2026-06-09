import React from 'react';
import { SectionHeader } from '../../shared/primitives.jsx';
import Toggle from '../../shared/Toggle.jsx';
import { Tag } from '../../shared/Tag.jsx';

export default function FilterListSources({ filterLists, totalActive, onToggle, t }) {
  return (
    <>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <SectionHeader t={t}>Filter List Sources</SectionHeader>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filterLists.map(list => (
          <div key={list.id} style={{
            background: t.surface, borderRadius: 3, padding: '8px 10px',
            opacity: list.enabled ? 1 : 0.5,
            border: `1px solid ${list.enabled ? t.borderBright : t.border}`,
            borderLeft: `3px solid ${list.enabled ? t.accent : t.textDim}`,
            transition: 'opacity 0.15s, border-color 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: t.text, fontSize: 11, fontFamily: t.mono, fontWeight: 600 }}>{list.name}</span>
              <Toggle value={list.enabled} onChange={en => onToggle(list.id, en)} t={t} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>{(list.count || 0).toLocaleString()}</span>
              <Tag label={list.category} color={t.info} t={t} small />
            </div>
            <div style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono, marginTop: 2 }}>{list.source}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
        <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>
          TOTAL ACTIVE: <span style={{ color: t.accentBright }}>{totalActive.toLocaleString()}</span>
        </span>
      </div>
    </>
  );
}
