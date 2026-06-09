import React from 'react';
import { AccordionSection, Btn, ConfirmButton } from '../../shared/primitives.jsx';
import ToggleRow from './ToggleRow.jsx';

export default function GdprSection({ tog, setToggle, updateSetting, t }) {
  return (
    <AccordionSection title="GDPR & PRIVACY — ART. 32 COMPLIANT" t={t} defaultOpen={false}>
      <ToggleRow label="URL Hashing (SHA-256)"
        desc="Hash URLs before external API queries — plaintext domain never sent to third parties"
        note="GDPR Art. 25 — data protection by design and by default"
        value={tog.urlHashing} onChange={v => setToggle('urlHashing', v)} t={t} color={t.safe} />
      <ToggleRow label="Local-Only Mode"
        desc="Disable all outbound API calls — heuristics and ML.NET only"
        value={tog.localOnly} onChange={v => setToggle('localOnly', v)} t={t} color={t.warn} />
      <ToggleRow label="Opt-In Telemetry"
        desc="Anonymous aggregate scan metrics — no domains, no URLs, no IPs transmitted"
        value={tog.telemetry} onChange={v => setToggle('telemetry', v)} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        <Btn t={t} style={{ justifyContent: 'flex-start', textAlign: 'left' }}
          onClick={async () => {
            const r = await window.nakora?.settings.getSettings().catch(() => null);
            const days = r?.data?.budgets?.dataRetentionDays ?? r?.budgets?.dataRetentionDays ?? 90;
            alert(`Retention Policy: DNS logs and audit entries are purged after ${days} days. No data is sent externally without consent. GDPR Art. 5(1)(e).`);
          }}>View Retention Policy</Btn>
        <Btn t={t} style={{ justifyContent: 'flex-start', textAlign: 'left' }}
          onClick={async () => {
            const r = await window.nakora?.system.getAuditLog(50).catch(() => null);
            const entries = r?.data ?? r ?? [];
            const text = Array.isArray(entries) && entries.length
              ? entries.map(e => `[${e.timestamp ?? ''}] ${e.action ?? ''} — ${e.detail ?? ''}`).join('\n')
              : 'No audit log entries.';
            alert(`Audit Data Access Log (last 50):\n\n${text}`);
          }}>Audit Data Access Log</Btn>
        <Btn t={t} style={{ justifyContent: 'flex-start', textAlign: 'left' }}
          onClick={() => {
            updateSetting({ toggles: { phishtank: false, virustotal: false, telemetry: false } });
            setToggle('localOnly', true);
          }}>Opt Out of All APIs</Btn>
      </div>

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
        <ConfirmButton
          t={t} danger
          label="DELETE ALL LOCAL DATA"
          confirmLabel="CONFIRM DELETE — CLICK AGAIN (3s)"
          onConfirm={async () => {
            await window.nakora?.settings.resetToDefaults().catch(() => {});
            localStorage.clear();
          }}
          timeout={3000}
        />
        <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono, marginTop: 5 }}>
          Wipes SQLite, localStorage, session state. Irreversible. GDPR Art. 17 right to erasure.
        </div>
      </div>
    </AccordionSection>
  );
}
