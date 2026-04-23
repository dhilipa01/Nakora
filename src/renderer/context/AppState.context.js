import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── AppState Context ────────────────────────────────────────────────────────
const AppStateCtx = createContext(null);

export function AppStateProvider({ children }) {
  const [activePage,       setActivePage]       = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [breadcrumb,       setBreadcrumbRaw]    = useState(['DASHBOARD']);
  const [selectedEntry,    setSelectedEntry]    = useState(null);

  const toggleSidebar = useCallback(() => setSidebarCollapsed(p => !p), []);

  const setBreadcrumb = useCallback((segments) => {
    setBreadcrumbRaw(Array.isArray(segments) ? segments : [String(segments)]);
  }, []);

  const selectEntry = useCallback((entry) => {
    setSelectedEntry(entry);
    if (entry) setBreadcrumb([activePage.toUpperCase(), entry.domain]);
    else       setBreadcrumb([activePage.toUpperCase()]);
  }, [activePage]);

  const navigateTo = useCallback((page) => {
    setActivePage(page);
    setSelectedEntry(null);
    setBreadcrumb([page.toUpperCase()]);
  }, []);

  return (
    <AppStateCtx.Provider value={{
      activePage, navigateTo,
      sidebarCollapsed, toggleSidebar,
      breadcrumb, setBreadcrumb,
      selectedEntry, selectEntry,
    }}>
      {children}
    </AppStateCtx.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error('useAppState must be inside AppStateProvider');
  return ctx;
}

// ─── Theme Context ────────────────────────────────────────────────────────────
import { THEMES } from '../theme.js';

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameRaw] = useState(() => {
    try { return localStorage.getItem('nakora_theme') || 'original'; } catch { return 'original'; }
  });

  const setTheme = useCallback((name) => {
    if (!THEMES[name]) return;
    setThemeNameRaw(name);
    try { localStorage.setItem('nakora_theme', name); } catch {}
    // Apply to :root for CSS var override
    document.documentElement.className = `theme-${name}`;
  }, []);

  const t = THEMES[themeName] || THEMES.original;

  // Apply on mount
  React.useEffect(() => {
    document.documentElement.className = `theme-${themeName}`;
  }, [themeName]);

  return (
    <ThemeCtx.Provider value={{ themeName, setTheme, t }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
