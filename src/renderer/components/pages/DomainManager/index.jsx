import React, { useState, useEffect } from 'react';
import { SectionHeader, Tag, Btn, Input, Toggle } from '../../shared/primitives.jsx';

function Col({ children, t, style = {} }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 5,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}
function ColHeader({ children, t }) {
  return (
    <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
      {children}
    </div>
  );
}

export default function DomainManager({ t }) {
  const [filterLists, setFilterLists] = useState([]);
  const [whitelist,   setWhitelist]   = useState([]);
  const [blacklist,   setBlacklist]   = useState([]);
  const [wDomain,     setWDomain]     = useState('');
  const [wReason,     setWReason]     = useState('');
  const [bDomain,     setBDomain]     = useState('');
  const [wSearch,     setWSearch]     = useState('');
  const [bSearch,     setBSearch]     = useState('');
  const [loading,     setLoading]     = useState(true);

  async function refresh() {
    const [fl, wl, bl] = await Promise.all([
      window.nakora?.domains.getFilterLists().catch(() => null),
      window.nakora?.domains.getWhitelist().catch(() => null),
      window.nakora?.domains.getBlacklist().catch(() => null),
    ]);
    const fld = fl?.data ?? fl; if (Array.isArray(fld)) setFilterLists(fld);
    const wld = wl?.data ?? wl; if (Array.isArray(wld)) setWhitelist(wld);
    const bld = bl?.data ?? bl; if (Array.isArray(bld)) setBlacklist(bld);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function handleToggle(id, enabled) {
    await window.nakora?.domains.toggleFilterList(id, enabled).catch(() => {});
    refresh();
  }
  async function addWhitelist() {
    if (!wDomain.trim()) return;
    await window.nakora?.domains.addToWhitelist(wDomain.trim(), wReason.trim()).catch(() => {});
    setWDomain(''); setWReason(''); refresh();
  }
  async function removeWhitelist(domain) {
    await window.nakora?.domains.removeFromWhitelist(domain).catch(() => {});
    refresh();
  }
  async function addBlacklist() {
    if (!bDomain.trim()) return;
    await window.nakora?.domains.addToBlacklist(bDomain.trim()).catch(() => {});
    setBDomain(''); refresh();
  }
  async function removeBlacklist(domain) {
    await window.nakora?.domains.removeFromBlacklist(domain).catch(() => {});
    refresh();
  }

  const totalActive = filterLists.filter(l => l.enabled).reduce((s, l) => s + (l.count || 0), 0);
  const filtW = whitelist.filter(e => e.domain.toLowerCase().includes(wSearch.toLowerCase()));
  const filtB = blacklist.filter(e => e.domain.toLowerCase().includes(bSearch.toLowerCase()));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
      color: t.textDim, fontFamily: t.mono, fontSize: 12 }}>loading domain lists...</div>
  );

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '260px 1fr 1fr', gap: 10, overflow: 'hidden' }}>

      {/* Left: filter list sources */}
      <Col t={t}>
        <ColHeader t={t}>
          <SectionHeader t={t}>Filter List Sources</SectionHeader>
        </ColHeader>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filterLists.map(list => (
            <div key={list.id} style={{
              background: t.surface, borderRadius: 3, padding: '8px 10px', opacity: list.enabled ? 1 : 0.5,
              border: `1px solid ${list.enabled ? t.borderBright : t.border}`,
              borderLeft: `3px solid ${list.enabled ? t.accent : t.textDim}`,
              transition: 'opacity 0.15s, border-color 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: t.text, fontSize: 11, fontFamily: t.mono, fontWeight: 600 }}>{list.name}</span>
                <Toggle value={list.enabled} onChange={en => handleToggle(list.id, en)} t={t} />
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
      </Col>

      {/* Middle: blacklist */}
      <Col t={t}>
        <ColHeader t={t}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <SectionHeader t={t}>Blacklist</SectionHeader>
            <span style={{ color: t.danger, fontSize: 9, fontFamily: t.mono, marginTop: -8 }}>
              {(totalActive + blacklist.length).toLocaleString()} total
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
            <Input value={bDomain} onChange={setBDomain} placeholder="domain.xyz" t={t} />
            <Btn t={t} danger onClick={addBlacklist}>+ BLOCK</Btn>
          </div>
          <Input value={bSearch} onChange={setBSearch} placeholder="search..." t={t} />
        </ColHeader>
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtB.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
              background: t.dangerDim, border: `1px solid ${t.danger}22`, borderLeft: `3px solid ${t.danger}`, borderRadius: 3,
            }}>
              <span style={{ flex: 1, color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {entry.domain}
              </span>
              <Tag label={entry.source || 'MANUAL'} color={t.danger} t={t} small />
              <span style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono }}>{(entry.created_at||entry.added||'').slice(0,10)}</span>
              <button onClick={() => removeBlacklist(entry.domain)}
                style={{ background: 'none', border: 'none', color: t.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 3px' }}>×</button>
            </div>
          ))}
          {filtB.length === 0 && (
            <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: '12px 0', textAlign: 'center' }}>
              --- no manual entries ---
            </div>
          )}
        </div>
      </Col>

      {/* Right: whitelist */}
      <Col t={t}>
        <ColHeader t={t}>
          <SectionHeader t={t}>Whitelist</SectionHeader>
          <div style={{ background: t.safeDim, border: `1px solid ${t.safe}44`, borderRadius: 3,
            padding: '4px 8px', color: t.safe, fontSize: 8, fontFamily: t.mono, letterSpacing: '0.06em', marginBottom: 7 }}>
            ▲ WHITELIST TAKES PRECEDENCE OVER ALL BLOCKLISTS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
            <Input value={wDomain} onChange={setWDomain} placeholder="domain.com or 192.168.0.0/24" t={t} />
            <div style={{ display: 'flex', gap: 6 }}>
              <Input value={wReason} onChange={setWReason} placeholder="reason (optional)" t={t} />
              <Btn t={t} onClick={addWhitelist}>+ ALLOW</Btn>
            </div>
          </div>
          <Input value={wSearch} onChange={setWSearch} placeholder="search..." t={t} />
        </ColHeader>
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtW.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 8px',
              background: t.safeDim, border: `1px solid ${t.safe}22`, borderLeft: `3px solid ${t.safe}`, borderRadius: 3,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.domain}
                </div>
                {entry.reason && <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>{entry.reason}</div>}
              </div>
              <span style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono, flexShrink: 0 }}>
                {(entry.created_at||entry.added||'').slice(0,10)}
              </span>
              <button onClick={() => removeWhitelist(entry.domain)}
                style={{ background: 'none', border: 'none', color: t.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 3px' }}>×</button>
            </div>
          ))}
          {filtW.length === 0 && (
            <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono, padding: '12px 0', textAlign: 'center' }}>
              --- no whitelist entries ---
            </div>
          )}
        </div>
      </Col>
    </div>
  );
}
