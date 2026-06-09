import { useState, useEffect } from 'react';

const api = () => (typeof window !== 'undefined' && window.nakora) ? window.nakora : null;

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
