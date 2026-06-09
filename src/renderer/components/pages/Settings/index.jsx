import React, { useCallback } from 'react';
import { useTheme } from '../../../context/AppState.context.jsx';
import { useSettings } from '../../../hooks/usePolling.js';
import CoreFeaturesSection from './CoreFeaturesSection.jsx';
import AdvancedDetectionSection from './AdvancedDetectionSection.jsx';
import ApiConfigSection from './ApiConfigSection.jsx';
import PerformanceSection from './PerformanceSection.jsx';
import GdprSection from './GdprSection.jsx';
import AppearanceSection from './AppearanceSection.jsx';

export default function Settings({ t }) {
  const { themeName, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();

  const tog = settings?.toggles  || {};
  const bud = settings?.budgets  || { dnsLatencyTarget: 30, cpuBudget: 5, dataRetentionDays: 90 };
  const api = settings?.apiConfig || { goEndpoint: 'http://localhost:8080' };

  const setToggle = useCallback((key, val) => {
    updateSetting({ toggles: { [key]: val } });
  }, [updateSetting]);

  const setBudget = useCallback((key, val) => {
    updateSetting({ budgets: { [key]: val } });
  }, [updateSetting]);

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', paddingBottom: 20 }}>
        <CoreFeaturesSection     tog={tog} setToggle={setToggle} t={t} />
        <AdvancedDetectionSection tog={tog} setToggle={setToggle} t={t} />
        <ApiConfigSection        api={api} updateSetting={updateSetting} t={t} />
        <PerformanceSection      bud={bud} setBudget={setBudget} t={t} />
        <GdprSection             tog={tog} setToggle={setToggle} updateSetting={updateSetting} t={t} />
        <AppearanceSection       tog={tog} setToggle={setToggle} themeName={themeName} setTheme={setTheme} t={t} />
      </div>
    </div>
  );
}
