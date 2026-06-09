import { useState, useEffect, useRef, useCallback } from 'react';

const api = () => (typeof window !== 'undefined' && window.nakora) ? window.nakora : null;

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
