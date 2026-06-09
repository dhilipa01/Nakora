import React, { useState, useEffect } from 'react';
import FilterListSources from './FilterListSources.jsx';
import BlacklistPanel from './BlacklistPanel.jsx';
import WhitelistPanel from './WhitelistPanel.jsx';

export default function DomainManager({ t }) {
  const [filterLists, setFilterLists] = useState([]);
  const [whitelist,   setWhitelist]   = useState([]);
  const [blacklist,   setBlacklist]   = useState([]);
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
  async function addWhitelist(domain, reason) {
    await window.nakora?.domains.addToWhitelist(domain, reason).catch(() => {});
    refresh();
  }
  async function removeWhitelist(domain) {
    await window.nakora?.domains.removeFromWhitelist(domain).catch(() => {});
    refresh();
  }
  async function addBlacklist(domain) {
    await window.nakora?.domains.addToBlacklist(domain).catch(() => {});
    refresh();
  }
  async function removeBlacklist(domain) {
    await window.nakora?.domains.removeFromBlacklist(domain).catch(() => {});
    refresh();
  }

  const totalActive = filterLists.filter(l => l.enabled).reduce((s, l) => s + (l.count || 0), 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
      color: t.textDim, fontFamily: t.mono, fontSize: 12 }}>loading domain lists...</div>
  );

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '260px 1fr 1fr', gap: 10, overflow: 'hidden' }}>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 5, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <FilterListSources filterLists={filterLists} totalActive={totalActive} onToggle={handleToggle} t={t} />
      </div>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 5, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <BlacklistPanel
          blacklist={blacklist}
          totalCount={totalActive + blacklist.length}
          onAdd={addBlacklist}
          onRemove={removeBlacklist}
          t={t}
        />
      </div>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 5, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <WhitelistPanel whitelist={whitelist} onAdd={addWhitelist} onRemove={removeWhitelist} t={t} />
      </div>
    </div>
  );
}
