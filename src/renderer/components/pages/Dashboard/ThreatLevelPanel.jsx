import React from 'react';
import { Card, SectionHeader, StatusDot } from '../../shared/primitives.jsx';
import ProgressBar from '../../shared/ProgressBar.jsx';
import { Tag } from '../../shared/Tag.jsx';

const FIRST_TYPES = ['Phishing', 'Malware C2', 'Cryptojacking', 'DNS Tunneling', 'DGA', 'Cache Poisoning'];
const COMPONENTS = [
  { label: 'DNS Resolver (CISA PDNS)',   key: 'dnsResolver' },
  { label: 'ETW Cryptojacking Monitor',  key: 'etwCryptojack' },
  { label: 'ML.NET On-Device Inference', key: 'mlNet' },
  { label: 'Go Microservice :8080',      key: 'go', alwaysOn: true },
  { label: 'PQC API Layer (BETA)',        key: 'pqcSigning' },
  { label: 'PhishTank Feed',             key: 'phishtank' },
  { label: 'OpenPhish Feed',             key: 'openphish' },
];

export default function ThreatLevelPanel({ stats, firstCounts, toggles, t }) {
  const s = stats || { blocked: 0, warned: 0 };
  const level = s.blocked > 8 ? 'HIGH' : s.warned > 5 ? 'MEDIUM' : 'LOW';
  const levelColor = level === 'HIGH' ? t.danger : level === 'MEDIUM' ? t.warn : t.safe;
  const maxFirst = Math.max(...Object.values(firstCounts), 1);

  return (
    <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Card t={t}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.1em', marginBottom: 3 }}>THREAT LEVEL</div>
            <div style={{ color: levelColor, fontFamily: t.mono, fontSize: 28, fontWeight: 700, textShadow: `0 0 10px ${levelColor}66` }}>{level}</div>
          </div>
          <div style={{ width: 1, height: 40, background: t.border }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, letterSpacing: '0.08em', marginBottom: 7 }}>
              FIRST.ORG DNS ABUSE MATRIX
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px 12px' }}>
              {FIRST_TYPES.map(type => {
                const c = (type.includes('Phishing') || type.includes('Malware') || type === 'DGA' || type.includes('Poison'))
                  ? t.danger : t.warn;
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ color: t.textMid, fontSize: 9, fontFamily: t.mono }}>{type.slice(0, 12).toUpperCase()}</span>
                      <span style={{ color: c, fontSize: 9, fontFamily: t.mono }}>{firstCounts[type] || 0}</span>
                    </div>
                    <ProgressBar value={firstCounts[type] || 0} max={maxFirst} color={c} t={t} h={3} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card t={t} style={{ flex: 1 }}>
        <SectionHeader t={t}>System Health</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {COMPONENTS.map(comp => {
            const on = comp.alwaysOn || !!toggles[comp.key];
            return (
              <div key={comp.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusDot active={on} t={t} />
                <span style={{ flex: 1, color: on ? t.text : t.textDim, fontSize: 12, fontFamily: t.mono }}>{comp.label}</span>
                <Tag label={on ? 'ACTIVE' : 'OFF'} color={on ? t.accent : t.textDim} t={t} small />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
