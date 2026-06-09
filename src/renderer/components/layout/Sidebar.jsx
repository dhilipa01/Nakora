import React from 'react';
import { useAppState } from '../../context/AppState.context.jsx';

const NAV_ITEMS = [
  { key: 'dashboard',  sym: '#', label: 'DASHBOARD',   prefix: '>_' },
  { key: 'threatlog',  sym: '!', label: 'THREAT LOG',  prefix: '>_' },
  { key: 'dnsmonitor', sym: '~', label: 'DNS MONITOR', prefix: '>_' },
  null,
  { key: 'domainmgr',  sym: '@', label: 'DOMAIN MGR',  prefix: '>_' },
  { key: 'settings',   sym: '*', label: 'SETTINGS',    prefix: '>_' },
  null,
  { key: 'export',     sym: '^', label: 'EXPORT',      prefix: '>_' },
];

export default function Sidebar({ t }) {
  const { activePage, navigateTo, sidebarCollapsed } = useAppState();
  const w = sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)';

  return (
    <nav
      className="app-sidebar"
      style={{
        width: w, background: t.navBg, borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        userSelect: 'none', transition: 'width 0s',
      }}
    >
      {NAV_ITEMS.map((item, i) => {
        if (!item) return <div key={`d${i}`} style={{ height: 1, background: t.border, margin: '4px 8px' }} />;
        const active = activePage === item.key;
        return (
          <button
            key={item.key}
            onClick={() => navigateTo(item.key)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigateTo(item.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: sidebarCollapsed ? '9px 0' : '9px 12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              background: active ? t.accentDim : 'none',
              borderLeft: active ? `3px solid ${t.accentBright}` : '3px solid transparent',
              border: 'none', color: active ? t.accentBright : t.textMid,
              fontSize: 11, fontFamily: t.mono, fontWeight: active ? 600 : 400,
              cursor: 'pointer', width: '100%', transition: 'background 0.1s', letterSpacing: '0.06em',
            }}
            onMouseEnter={!active ? e => { e.currentTarget.style.background = t.card; e.currentTarget.style.color = t.text; } : null}
            onMouseLeave={!active ? e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = t.textMid; } : null}
          >
            <span style={{ fontSize: 13, fontFamily: t.mono, flexShrink: 0, width: 16, textAlign: 'center' }}>
              {sidebarCollapsed ? item.sym : item.prefix}
            </span>
            {!sidebarCollapsed && (
              <span style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>
            )}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      {!sidebarCollapsed && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${t.border}` }}>
          <div style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono }}>v0.1.0-prototype</div>
          <div style={{ color: t.textDim, fontSize: 8, fontFamily: t.mono, marginTop: 1 }}>GDPR · ISO 27001 · Zero Trust</div>
        </div>
      )}
    </nav>
  );
}
