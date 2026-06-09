import { useState, useEffect } from 'react';

const api = () => (typeof window !== 'undefined' && window.nakora) ? window.nakora : null;

export function useEtwMetrics() {
  const [cpu,    setCpu]    = useState({ usagePercent: 0, history: [], perCore: [] });
  const [mem,    setMem]    = useState({ usedPercent: 0, history: [] });
  const [procs,  setProcs]  = useState([]);
  const [conns,  setConns]  = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const ids = [];
    ids.push(setInterval(async () => { const r = await api()?.etw.getCpu().catch(() => null);         if (r?.data || r) setCpu(r?.data ?? r); }, 1000));
    ids.push(setInterval(async () => { const r = await api()?.etw.getMemory().catch(() => null);      if (r?.data || r) setMem(r?.data ?? r); }, 2000));
    ids.push(setInterval(async () => { const r = await api()?.etw.getProcesses().catch(() => null);   const d = r?.data ?? r; if (Array.isArray(d)) setProcs(d); }, 5000));
    ids.push(setInterval(async () => { const r = await api()?.etw.getConnections().catch(() => null); const d = r?.data ?? r; if (Array.isArray(d)) setConns(d); }, 3000));
    ids.push(setInterval(async () => { const r = await api()?.etw.getEvents(60).catch(() => null);    const d = r?.data ?? r; if (Array.isArray(d)) setEvents(d); }, 1500));
    return () => ids.forEach(clearInterval);
  }, []);

  return { cpu, mem, procs, conns, events };
}
