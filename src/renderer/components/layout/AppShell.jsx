import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppState.context.js';
import { useTheme }    from '../../context/AppState.context.js';
import { StatusDot }   from '../shared/primitives.jsx';

const NAV_ITEMS = [
  { key:'dashboard',  sym:'#', label:'DASHBOARD',   prefix:'>_' },
  { key:'threatlog',  sym:'!', label:'THREAT LOG',  prefix:'>_' },
  { key:'dnsmonitor', sym:'~', label:'DNS MONITOR', prefix:'>_' },
  null,
  { key:'domainmgr',  sym:'@', label:'DOMAIN MGR',  prefix:'>_' },
  { key:'settings',   sym:'*', label:'SETTINGS',    prefix:'>_' },
  null,
  { key:'export',     sym:'^', label:'EXPORT',      prefix:'>_' },
];

export function BurgerButton({ t, onClick }) {
  return (
    <button onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&onClick()}
      style={{ background:'none', border:'none', color:t.textMid, cursor:'pointer',
        fontSize:16, fontFamily:t.mono, padding:'0 4px', lineHeight:1, WebkitAppRegion:'no-drag' }}
      title="Toggle sidebar">≡</button>
  );
}

export function Header({ t }) {
  const { sidebarCollapsed, toggleSidebar } = useAppState();
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  const [uptime, setUptime] = useState('00:00:00');
  const startRef = useState(Date.now())[0];
  const [session, setSession] = useState({ scanned:0, blocked:0 });

  useEffect(()=>{
    const id = setInterval(()=>{
      setClock(new Date().toLocaleTimeString());
      const s = Math.floor((Date.now()-startRef)/1000);
      setUptime(`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`);
    },1000);
    const sid = setInterval(async()=>{
      const r = await window.nakora?.dns.getStats().catch(()=>null);
      const d = r?.data??r;
      if(d) setSession({ scanned:d.scanned||0, blocked:d.blocked||0 });
    },5000);
    return ()=>{ clearInterval(id); clearInterval(sid); };
  },[]);

  const indicators = [
    { label:'DNS', active:true },
    { label:'ETW', active:true },
    { label:'ML',  active:true },
    { label:'UP',  active:true, val:uptime },
  ];

  return (
    <header className="app-header" style={{ background:t.titleBar, borderBottom:`1px solid ${t.border}`,
      display:'flex', alignItems:'center', padding:'0 10px', gap:10,
      WebkitAppRegion:'drag', userSelect:'none', height:'var(--header-height)' }}>
      <BurgerButton t={t} onClick={toggleSidebar} />
      <div style={{ color:t.accentBright, fontFamily:t.mono, fontSize:13, fontWeight:700, letterSpacing:'0.12em' }}>
        nakora
        <span style={{ display:'inline-block', width:2, height:12, background:t.accentBright, marginLeft:2,
          verticalAlign:'middle', animation:'blink 1.1s step-start infinite' }} />
      </div>
      <div style={{ flex:1 }} />
      <div style={{ display:'flex', gap:12, alignItems:'center', WebkitAppRegion:'no-drag' }}>
        {indicators.map(ind=>(
          <div key={ind.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <StatusDot active={ind.active} t={t} size={6} />
            <span style={{ color:t.textMid, fontSize:10, fontFamily:t.mono }}>{ind.val||ind.label}</span>
          </div>
        ))}
        <div style={{ width:1, height:12, background:t.border }} />
        <span style={{ color:t.textDim, fontSize:10, fontFamily:t.mono }}>{clock}</span>
      </div>
    </header>
  );
}

export function Sidebar({ t }) {
  const { activePage, navigateTo, sidebarCollapsed } = useAppState();
  const w = sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)';

  return (
    <nav className="app-sidebar" style={{ width:w, background:t.navBg, borderRight:`1px solid ${t.border}`,
      display:'flex', flexDirection:'column', overflow:'hidden', userSelect:'none', transition:'width 0s' }}>
      {NAV_ITEMS.map((item,i)=>{
        if(!item) return <div key={`d${i}`} style={{ height:1, background:t.border, margin:'4px 8px' }} />;
        const active = activePage===item.key;
        return (
          <button key={item.key} onClick={()=>navigateTo(item.key)}
            role="button" tabIndex={0} onKeyDown={e=>(e.key==='Enter')&&navigateTo(item.key)}
            style={{ display:'flex', alignItems:'center', gap:8,
              padding: sidebarCollapsed ? '9px 0' : '9px 12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              background: active?t.accentDim:'none',
              borderLeft: active?`3px solid ${t.accentBright}`:'3px solid transparent',
              border:'none', color:active?t.accentBright:t.textMid,
              fontSize:11, fontFamily:t.mono, fontWeight:active?600:400,
              cursor:'pointer', width:'100%', transition:'background 0.1s', letterSpacing:'0.06em' }}
            onMouseEnter={!active?e=>{e.currentTarget.style.background=t.card;e.currentTarget.style.color=t.text;}:null}
            onMouseLeave={!active?e=>{e.currentTarget.style.background='none';e.currentTarget.style.color=t.textMid;}:null}>
            <span style={{ fontSize:13, fontFamily:t.mono, flexShrink:0, width:16, textAlign:'center' }}>
              {sidebarCollapsed?item.sym:item.prefix}
            </span>
            {!sidebarCollapsed && <span style={{ fontSize:11, whiteSpace:'nowrap', overflow:'hidden' }}>{item.label}</span>}
          </button>
        );
      })}
      <div style={{ flex:1 }} />
      {!sidebarCollapsed && (
        <div style={{ padding:'8px 12px', borderTop:`1px solid ${t.border}` }}>
          <div style={{ color:t.textDim, fontSize:8, fontFamily:t.mono }}>v0.1.0-prototype</div>
          <div style={{ color:t.textDim, fontSize:8, fontFamily:t.mono, marginTop:1 }}>GDPR · ISO 27001 · Zero Trust</div>
        </div>
      )}
    </nav>
  );
}

export function StatusBar({ t }) {
  const { breadcrumb } = useAppState();
  const [stats, setStats] = useState({ scanned:0, blocked:0 });
  const [latency, setLatency] = useState('--');

  useEffect(()=>{
    const id = setInterval(async()=>{
      const r = await window.nakora?.dns.getStats().catch(()=>null);
      const d = r?.data??r;
      if(d) setStats({ scanned:d.scanned||0, blocked:d.blocked||0 });
      const f = await window.nakora?.dns.getFeed(1).catch(()=>null);
      const fd = f?.data??f;
      if(Array.isArray(fd)&&fd[0]) setLatency(fd[0].latency);
    },2000);
    return ()=>clearInterval(id);
  },[]);

  return (
    <footer className="app-statusbar" style={{ background:t.titleBar, borderTop:`1px solid ${t.border}`,
      display:'flex', alignItems:'center', padding:'0 10px', gap:14, height:'var(--statusbar-height)', userSelect:'none' }}>
      <span style={{ color:t.textMid, fontSize:9, fontFamily:t.mono, flex:1 }}>
        {breadcrumb.join(' > ')}
      </span>
      <span style={{ color:t.textDim, fontSize:9, fontFamily:t.mono }}>LATENCY <span style={{ color:t.textMid }}>{latency}ms</span></span>
      <span style={{ color:t.textDim, fontSize:9, fontFamily:t.mono }}>SCANNED <span style={{ color:t.accentBright }}>{stats.scanned.toLocaleString()}</span></span>
      <span style={{ color:t.textDim, fontSize:9, fontFamily:t.mono }}>BLOCKED <span style={{ color:t.danger }}>{stats.blocked}</span></span>
    </footer>
  );
}

export function AppShell({ children, t }) {
  const { sidebarCollapsed } = useAppState();
  return (
    <div className={`app-shell${sidebarCollapsed?' sidebar-collapsed':''}`}>
      <Header t={t} />
      <Sidebar t={t} />
      <main className="app-main">{children}</main>
      <StatusBar t={t} />
    </div>
  );
}
