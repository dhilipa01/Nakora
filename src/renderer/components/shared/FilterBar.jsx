import React from 'react';

export default function FilterBar({ onSearch, onVerdictChange, onAnalyzerChange, t, analyzers = [] }) {
  const [search,   setSearch]   = React.useState('');
  const [verdict,  setVerdict]  = React.useState('ALL');
  const [analyzer, setAnalyzer] = React.useState('ALL');
  const timerRef = React.useRef(null);

  const handleSearch = v => {
    setSearch(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch?.(v), 300);
  };

  const s = {
    background: t.surface, border: `1px solid ${t.border}`,
    color: t.text, fontSize: 11, fontFamily: t.mono, padding: '5px 8px', borderRadius: 3,
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} role="search">
      <input
        value={search}
        onChange={e => handleSearch(e.target.value)}
        placeholder="search domain..."
        aria-label="Search domains"
        style={{ flex: 1, ...s, outline: 'none' }}
      />
      <select
        value={verdict}
        onChange={e => { setVerdict(e.target.value); onVerdictChange?.(e.target.value); }}
        aria-label="Filter by verdict"
        style={s}
      >
        {['ALL', 'BLOCKED', 'WARNING', 'CLEAN'].map(v => <option key={v}>{v}</option>)}
      </select>
      {analyzers.length > 0 && (
        <select
          value={analyzer}
          onChange={e => { setAnalyzer(e.target.value); onAnalyzerChange?.(e.target.value); }}
          aria-label="Filter by analyzer"
          style={s}
        >
          <option>ALL</option>
          {analyzers.map(a => <option key={a}>{a}</option>)}
        </select>
      )}
      <button
        type="button"
        aria-label="Clear filters"
        onClick={() => {
          setSearch(''); setVerdict('ALL'); setAnalyzer('ALL');
          onSearch?.(''); onVerdictChange?.('ALL'); onAnalyzerChange?.('ALL');
        }}
        style={{ ...s, cursor: 'pointer', color: t.textDim }}
      >×</button>
    </div>
  );
}
