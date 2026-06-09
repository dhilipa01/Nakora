import { usePolling } from './usePolling.js';

const api = () => (typeof window !== 'undefined' && window.nakora) ? window.nakora : null;

export function useDnsStats() {
  return usePolling(async () => {
    const r = await api()?.dns.getStats();
    return r?.data ?? r ?? { scanned: 0, blocked: 0, warned: 0, startTime: Date.now(), durationSeconds: 0 };
  }, 2000);
}
