import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppState.context.jsx';
import { StatusDot } from '../shared/primitives.jsx';
import BurgerButton from './BurgerButton.jsx';

export default function Header({ t }) {
  const { toggleSidebar } = useAppState();
  const [clock,   setClock]   = useState(new Date().toLocaleTimeString());
  const [uptime,  setUptime]  = useState('00:00:00');
  const startRef = useState(Date.now())[0];

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
      const s = Math.floor((Date.now() - startRef) / 1000);
      setUptime(
        `${String(Math.floor(s / 3600)).padStart(2, '0')}:` +
        `${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:` +
        `${String(s % 60).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const indicators = [
    { label: 'DNS', active: true },
    { label: 'ETW', active: true },
    { label: 'ML',  active: true },
    { label: 'UP',  active: true, val: uptime },
  ];

  return (
    <header
      className="app-header"
      style={{
        background: t.titleBar, borderBottom: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: 10,
        WebkitAppRegion: 'drag', userSelect: 'none', height: 'var(--header-height)',
      }}
    >
      <BurgerButton t={t} onClick={toggleSidebar} />
      <div style={{ color: t.accentBright, fontFamily: t.mono, fontSize: 13, fontWeight: 700, letterSpacing: '0.12em' }}>
        nakora
        <span style={{
          display: 'inline-block', width: 2, height: 12, background: t.accentBright,
          marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1.1s step-start infinite',
        }} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
        {indicators.map(ind => (
          <div key={ind.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <StatusDot active={ind.active} t={t} size={6} />
            <span style={{ color: t.textMid, fontSize: 10, fontFamily: t.mono }}>{ind.val || ind.label}</span>
          </div>
        ))}
        <div style={{ width: 1, height: 12, background: t.border }} />
        <span style={{ color: t.textDim, fontSize: 10, fontFamily: t.mono }}>{clock}</span>
      </div>
    </header>
  );
}
