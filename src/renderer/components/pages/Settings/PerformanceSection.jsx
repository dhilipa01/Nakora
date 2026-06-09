import React from 'react';
import { AccordionSection } from '../../shared/primitives.jsx';

const SLIDERS = [
  { key: 'dnsLatencyTarget', label: 'DNS Latency Target', min: 10, max: 200, unit: 'ms',
    note: v => `at ${v}ms — ${v < 20 ? '~99%' : v < 35 ? '~95%' : '~85%'} of queries resolve before perceptible delay` },
  { key: 'cpuBudget', label: 'Max CPU Overhead', min: 1, max: 30, unit: '%',
    note: v => `at ${v}% — ${v < 3 ? 'minimal footprint' : v < 7 ? 'balanced detection/perf' : 'maximum coverage'}` },
  { key: 'dataRetentionDays', label: 'Data Retention', min: 7, max: 365, unit: ' days',
    note: v => `logs purged after ${v} days — GDPR Art. 5(1)(e) storage limitation` },
];

export default function PerformanceSection({ bud, setBudget, t }) {
  return (
    <AccordionSection title="PERFORMANCE BUDGETS" t={t} defaultOpen={false}>
      {SLIDERS.map(({ key, label, min, max, unit, note }) => (
        <div key={key} style={{ padding: '9px 0', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <label htmlFor={`range-${key}`} style={{ color: t.text, fontSize: 12, fontFamily: t.mono }}>{label}</label>
            <span aria-hidden="true" style={{ color: t.accentBright, fontSize: 12, fontFamily: t.mono }}>{bud[key]}{unit}</span>
          </div>
          <input id={`range-${key}`} type="range" min={min} max={max} value={bud[key] ?? 0}
            aria-label={label} aria-valuetext={`${bud[key] ?? 0}${unit}`}
            onChange={e => setBudget(key, +e.target.value)}
            style={{ width: '100%', accentColor: t.accent, cursor: 'pointer' }} />
          <div style={{ color: t.textDim, fontSize: 10, marginTop: 3 }}>{note(bud[key] ?? 0)}</div>
        </div>
      ))}
    </AccordionSection>
  );
}
