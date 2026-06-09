import React from 'react';
import { SectionHeader, Input, Btn } from '../../shared/primitives.jsx';
import { Tag } from '../../shared/Tag.jsx';

export default function BlacklistPanel({ blacklist, totalCount, onAdd, onRemove, t }) {
  const [domain,  setDomain]  = React.useState('');
  const [search,  setSearch]  = React.useState('');

  const filtered = blacklist.filter(e => e.domain.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!domain.trim()) return;
    onAdd(domain.trim());
    setDomain('');
  };

  return (
    <>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <SectionHeader t={t}>Blacklist</SectionHeader>
          <span style={{ color: t.danger, fontSize: 9, fontFamily: t.mono, marginTop: -8 }}>
            {totalCount.toLocaleString()} total
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
          <Input value={domain} onChange={setDomain} placeholder="domain.xyz" t={t} />
          <Btn t={t} danger onClick={handleAdd}>+ BLOCK</Btn>
        </div>
        <Input value={search} onChange={setSearch} placeholder="search..." t={t} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((entry, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
            background: t.dangerDim, border: `1px solid ${t.danger}22`,
            borderLeft: `3px solid ${t.danger}`, borderRadius: 3,
          }}>
            <span style={{ flex: 1, color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {entry.domain}
            </span>
            <Tag label={entry.source || 'MANUAL'} color={t.danger} t={t} small />
            <span style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono }}>{(entry.created_at || entry.added || '').slice(0, 10)}</span>
            <button onClick={() => onRemove(entry.domain)}
              style={{ background: 'none', border: 'none', color: t.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 3px' }}>×</button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: '12px 0', textAlign: 'center' }}>
            --- no manual entries ---
          </div>
        )}
      </div>
    </>
  );
}
