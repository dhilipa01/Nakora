import React from 'react';
import { AccordionSection } from '../../shared/primitives.jsx';
import ToggleRow from './ToggleRow.jsx';

export default function CoreFeaturesSection({ tog, setToggle, t }) {
  return (
    <AccordionSection title="CORE FEATURES" t={t} defaultOpen>
      <ToggleRow label="DNS Resolver" desc="System-wide CISA PDNS-inspired protective DNS resolver"
        note="currently protecting against: all DNS-layer threats"
        value={tog.dnsResolver} onChange={v => setToggle('dnsResolver', v)} t={t} />
      <ToggleRow label="PhishTank Feed" desc="Community-verified phishing URL database"
        note="currently protecting against: verified phishing domains"
        value={tog.phishtank} onChange={v => setToggle('phishtank', v)} t={t} />
      <ToggleRow label="OpenPhish Feed" desc="Secondary phishing URL feed — updated 3× daily"
        value={tog.openphish} onChange={v => setToggle('openphish', v)} t={t} />
      <ToggleRow label="VirusTotal API" desc="Multi-engine URL reputation checking (requires API key)"
        value={tog.virustotal} onChange={v => setToggle('virustotal', v)} t={t} />
      <ToggleRow label="Toast Alerts" desc="Windows notifications for high-severity blocked domains"
        value={tog.toastAlerts} onChange={v => setToggle('toastAlerts', v)} t={t} />
      <ToggleRow label="DoH Detection Warning" desc="Alert when browser bypasses system DNS via DNS-over-HTTPS"
        note="detecting: Chrome/Edge DoH bypass via port-443 HTTPS to known resolvers"
        value={tog.dohDetection} onChange={v => setToggle('dohDetection', v)} t={t} color={t.warn} />
    </AccordionSection>
  );
}
