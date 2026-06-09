import React from 'react';
import { AccordionSection } from '../../shared/primitives.jsx';
import { THEMES } from '../../../theme.js';
import ToggleRow from './ToggleRow.jsx';

const THEME_LABELS = { original: 'ORIGINAL', darker: 'DARKER', hacker: 'HACKER' };

export default function AppearanceSection({ tog, setToggle, themeName, setTheme, t }) {
  return (
    <AccordionSection title="APPEARANCE" t={t} defaultOpen={false}>
      <div role="radiogroup" aria-label="Theme selection" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {Object.entries(THEMES).map(([k, th]) => {
          const label = THEME_LABELS[k] || k.toUpperCase();
          return (
            <div key={k} role="radio" aria-checked={themeName === k} tabIndex={0}
              onClick={() => setTheme(k)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setTheme(k)}
              aria-label={`${label} theme${themeName === k ? ', currently active' : ''}`}
              style={{
                flex: 1, background: th.card, border: `2px solid ${themeName === k ? th.accentBright : th.border}`,
                borderRadius: 5, padding: '12px 8px', cursor: 'pointer', textAlign: 'center',
                boxShadow: themeName === k ? `0 0 12px ${th.accent}44` : 'none', transition: 'all 0.15s',
              }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: th.accentBright,
                margin: '0 auto 7px', boxShadow: `0 0 8px ${th.accent}` }} />
              <div style={{ color: th.text, fontSize: 11, fontFamily: th.mono }}>{label}</div>
              {themeName === k && <div aria-hidden="true" style={{ color: th.accent, fontSize: 9, fontFamily: th.mono, marginTop: 3 }}>ACTIVE</div>}
            </div>
          );
        })}
      </div>
      {themeName === 'hacker' && (
        <ToggleRow label="Scanlines Overlay" desc="Retro CRT scanline texture overlay"
          value={!!tog.scanlines} onChange={v => setToggle('scanlines', v)} t={t} />
      )}
      <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, marginTop: 6 }}>
        Themes applied via CSS custom properties. Preference persisted to electron-store.
      </div>
    </AccordionSection>
  );
}
