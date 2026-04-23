import { useState, useEffect, useRef, useCallback } from 'react';

const api = () => (typeof window !== 'undefined' && window.nakora) ? window.nakora : null;

// ─── usePolling — generic ──────────────────────────────────────────────────
export function usePolling(fn, intervalMs) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let active = true;
    async function tick() {
      try {
        const result = await fnRef.current();
        if (active) { setData(result); setLoading(false); setError(null); }
      } catch (e) {
        if (active) setError(e.message);
      }
    }
    tick();
    const id = setInterval(() => {
      if (document.visibilityState !== 'hidden') tick();
    }, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [intervalMs]);

  return { data, loading, error };
}

// ─── useDnsStats ───────────────────────────────────────────────────────────
export function useDnsStats() {
  return usePolling(async () => {
    const r = await api()?.dns.getStats();
    return r?.data ?? r ?? { scanned: 0, blocked: 0, warned: 0, startTime: Date.now(), durationSeconds: 0 };
  }, 2000);
}

// ─── useDnsFeed ────────────────────────────────────────────────────────────
export function useDnsFeed(limit = 50) {
  const [feed, setFeed] = useState([]);
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.visibilityState === 'hidden') return;
      const r = await api()?.dns.getFeed(limit).catch(() => null);
      const rows = r?.data ?? r;
      if (Array.isArray(rows)) setFeed(rows);
    }, 900);
    return () => clearInterval(id);
  }, [limit]);
  return feed;
}

// ─── useEtwMetrics ─────────────────────────────────────────────────────────
export function useEtwMetrics() {
  const [cpu,   setCpu]   = useState({ usagePercent: 0, history: [], perCore: [] });
  const [mem,   setMem]   = useState({ usedPercent: 0, history: [] });
  const [procs, setProcs] = useState([]);
  const [conns, setConns] = useState([]);
  const [events,setEvents]= useState([]);

  useEffect(() => {
    const ids = [];
    ids.push(setInterval(async () => { const r = await api()?.etw.getCpu().catch(()=>null); if(r?.data||r) setCpu(r?.data??r); }, 1000));
    ids.push(setInterval(async () => { const r = await api()?.etw.getMemory().catch(()=>null); if(r?.data||r) setMem(r?.data??r); }, 2000));
    ids.push(setInterval(async () => { const r = await api()?.etw.getProcesses().catch(()=>null); const d=r?.data??r; if(Array.isArray(d)) setProcs(d); }, 5000));
    ids.push(setInterval(async () => { const r = await api()?.etw.getConnections().catch(()=>null); const d=r?.data??r; if(Array.isArray(d)) setConns(d); }, 3000));
    ids.push(setInterval(async () => { const r = await api()?.etw.getEvents(60).catch(()=>null); const d=r?.data??r; if(Array.isArray(d)) setEvents(d); }, 1500));
    return () => ids.forEach(clearInterval);
  }, []);

  return { cpu, mem, procs, conns, events };
}

// ─── useSettings ───────────────────────────────────────────────────────────
export function useSettings() {
  const [settings, setSettings] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    api()?.settings.getSettings().then(r => {
      const s = r?.data ?? r;
      if (s) setSettings(s);
    }).catch(() => {});
  }, []);

  const updateSetting = useCallback((partial) => {
    setSettings(prev => {
      if (!prev) return prev;
      const merged = { ...prev, ...partial };
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        api()?.settings.saveSettings(partial).catch(() => {});
      }, 500);
      return merged;
    });
  }, []);

  return { settings, updateSetting };
}
