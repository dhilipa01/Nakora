import React from 'react';
import FilterBar from '../../shared/FilterBar.jsx';
import ConfirmButton from '../../shared/ConfirmButton.jsx';

const ANALYZERS = [
  'Homoglyph/Punycode', 'PhishTank API', 'DGA Detector', 'Cryptojacking/ETW',
  'Redirect Chain', 'ML.NET', 'Blocklist', 'OpenPhish Feed', 'Whitelist/Cache',
];

export default function LogControls({ total, onSearch, onVerdictChange, onAnalyzerChange, onClear, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <div style={{ flex: 1 }}>
        <FilterBar
          onSearch={onSearch}
          onVerdictChange={onVerdictChange}
          onAnalyzerChange={onAnalyzerChange}
          t={t}
          analyzers={ANALYZERS}
        />
      </div>
      <span style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, whiteSpace: 'nowrap' }}>
        {total} entries
      </span>
      <ConfirmButton
        t={t}
        label="CLEAR LOG"
        confirmLabel="CONFIRM CLEAR"
        onConfirm={onClear}
        timeout={3000}
      />
    </div>
  );
}
