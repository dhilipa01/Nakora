import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppState.context.jsx';

export default function StatusBar({ t }) {
  const { breadcrumb } = useAppState();
  const [stats,   setStats]   = useState({ scanned: 0, blocked: 0 });
  const [latency, setLatency] = useState('--');

  useEffect(() => {
    const id = setInterval(async () => {
      const r = await window.nakora?.dns.getStats().catch(() => null);
      const d = r?.data ?? r;
      if (d) setStats({ scanned: d.scanned || 0, blocked: d.blocked || 0 });
      const f = await window.nakora?.dns.getFeed(1).catch(() => null);
      const fd = f?.data ?? f;
      if (Array.isArray(fd) && fd[0]) setLatency(fd[0].latency);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer
      className="app-statusbar"
      style={{
        background: t.titleBar, borderTop: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: 14,
        height: 'var(--statusbar-height)', userSelect: 'none',
      }}
    >
      <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono, flex: 1 }}>
        {breadcrumb.join(' > ')}
      </span>
      <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>
        LATENCY <span style={{ color: t.textMid }}>{latency}ms</span>
      </span>
      <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>
        SCANNED <span style={{ color: t.accentBright }}>{stats.scanned.toLocaleString()}</span>
      </span>
      <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>
        BLOCKED <span style={{ color: t.danger }}>{stats.blocked}</span>
      </span>
    </footer>
  );
}
