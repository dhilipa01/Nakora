import React from 'react';
import { SectionHeader, Input, Btn } from '../../shared/primitives.jsx';

export default function WhitelistPanel({ whitelist, onAdd, onRemove, t }) {
  const [domain, setDomain] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [search, setSearch] = React.useState('');

  const filtered = whitelist.filter(e => e.domain.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!domain.trim()) return;
    onAdd(domain.trim(), reason.trim());
    setDomain(''); setReason('');
  };

  return (
    <>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <SectionHeader t={t}>Whitelist</SectionHeader>
        <div style={{
          background: t.safeDim, border: `1px solid ${t.safe}44`, borderRadius: 3,
          padding: '4px 8px', color: t.safe, fontSize: 8, fontFamily: t.mono,
          letterSpacing: '0.06em', marginBottom: 7,
        }}>
          ▲ WHITELIST TAKES PRECEDENCE OVER ALL BLOCKLISTS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
          <Input value={domain} onChange={setDomain} placeholder="domain.com or 192.168.0.0/24" t={t} />
          <div style={{ display: 'flex', gap: 6 }}>
            <Input value={reason} onChange={setReason} placeholder="reason (optional)" t={t} />
            <Btn t={t} onClick={handleAdd}>+ ALLOW</Btn>
          </div>
        </div>
        <Input value={search} onChange={setSearch} placeholder="search..." t={t} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((entry, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 8px',
            background: t.safeDim, border: `1px solid ${t.safe}22`,
            borderLeft: `3px solid ${t.safe}`, borderRadius: 3,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {entry.domain}
              </div>
              {entry.reason && <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>{entry.reason}</div>}
            </div>
            <span style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono, flexShrink: 0 }}>
              {(entry.created_at || entry.added || '').slice(0, 10)}
            </span>
            <button onClick={() => onRemove(entry.domain)}
              style={{ background: 'none', border: 'none', color: t.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 3px' }}>×</button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: '12px 0', textAlign: 'center' }}>
            --- no whitelist entries ---
          </div>
        )}
      </div>
    </>
  );
}
