import React from 'react';
import { useAppState } from '../../context/AppState.context.jsx';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import StatusBar from './StatusBar.jsx';

export { default as BurgerButton } from './BurgerButton.jsx';
export { default as Header } from './Header.jsx';
export { default as Sidebar } from './Sidebar.jsx';
export { default as StatusBar } from './StatusBar.jsx';

export function AppShell({ children, t }) {
  const { sidebarCollapsed } = useAppState();
  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Header t={t} />
      <Sidebar t={t} />
      <main className="app-main">{children}</main>
      <StatusBar t={t} />
    </div>
  );
}
