import React from 'react';
import { AppStateProvider, ThemeProvider, useAppState, useTheme } from './context/AppState.context.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import DetailDrawer from './components/shared/DetailDrawer.jsx';

import Dashboard    from './components/pages/Dashboard/index.jsx';
import ThreatLog    from './components/pages/ThreatLog/index.jsx';
import DnsMonitor   from './components/pages/DnsMonitor/index.jsx';
import DomainManager from './components/pages/DomainManager/index.jsx';
import Settings     from './components/pages/Settings/index.jsx';
import Export       from './components/pages/Export/index.jsx';

const PAGES = { dashboard:Dashboard, threatlog:ThreatLog, dnsmonitor:DnsMonitor, domainmgr:DomainManager, settings:Settings, export:Export };

function Inner() {
  const { activePage, selectedEntry } = useAppState();
  const { t, themeName } = useTheme();
  const Page = PAGES[activePage] || Dashboard;

  return (
    <AppShell t={t}>
      <div className="page-container">
        <div className="page-inner">
          <Page t={t} />
        </div>
        {selectedEntry && <DetailDrawer t={t} />}
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <ThemeProvider>
        <Inner />
      </ThemeProvider>
    </AppStateProvider>
  );
}
