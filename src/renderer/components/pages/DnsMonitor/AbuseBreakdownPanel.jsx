import React from 'react';
import { Card, SectionHeader } from '../../shared/primitives.jsx';
import ProgressBar from '../../shared/ProgressBar.jsx';
import { abuseColor } from '../../../theme.js';

const FIRST_TYPES = [
  { label: 'Phishing',      desc: 'Deceptive brand-spoofing sites'  },
  { label: 'Malware C2',    desc: 'Command & control callbacks'      },
  { label: 'Cryptojacking', desc: 'Mining pool / coin domains'       },
  { label: 'DNS Tunneling', desc: 'Data exfil via DNS protocol'      },
  { label: 'DGA',           desc: 'Domain generation algorithms'     },
  { label: 'Cache Poisoning',desc: 'DNS spoofing attempts'           },
];

export default function AbuseBreakdownPanel({ firstCounts, t }) {
  const maxCount = Math.max(...Object.values(firstCounts), 1);

  return (
    <Card t={t} style={{ flex: 1 }}>
      <SectionHeader t={t}>FIRST.org DNS Abuse Matrix</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {FIRST_TYPES.map(({ label, desc }) => {
          const count = firstCounts[label] || 0;
          const c = abuseColor(label, t);
          return (
            <div key={label}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
                <div>
                  <span style={{ color: t.text, fontSize: 12, fontFamily: t.mono }}>{label}</span>
                  <span style={{ color: t.textDim, fontSize: 9, marginLeft: 8 }}>{desc}</span>
                </div>
                <span style={{ color: c, fontSize: 13, fontFamily: t.mono, fontWeight: 700 }}>{count}</span>
              </div>
              <ProgressBar value={count} max={maxCount} color={c} t={t} h={4} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
