import React from 'react';
import { AccordionSection } from '../../shared/primitives.jsx';
import ToggleRow from './ToggleRow.jsx';

export default function AdvancedDetectionSection({ tog, setToggle, t }) {
  return (
    <AccordionSection title="ADVANCED DETECTION" t={t} defaultOpen={false}>
      <ToggleRow label="ETW Cryptojacking Monitor" desc="Real CPU/memory correlation + CoinBlockerLists domain matching"
        note="currently protecting against: xmrpool, coinhive, and 40+ mining pool domains"
        value={tog.etwCryptojack} onChange={v => setToggle('etwCryptojack', v)} t={t} color={t.warn} />
      <ToggleRow label="PQC API Signing (BETA)" desc="BouncyCastle Dilithium3 post-quantum signatures on outbound API calls"
        note="signing: PhishTank + VirusTotal API requests with NIST-standardised Dilithium3"
        value={tog.pqcSigning} onChange={v => setToggle('pqcSigning', v)} t={t} color={t.warn} />
      <ToggleRow label="ML.NET On-Device Inference" desc="ONNX classifier (XGBoost-trained, 71k PhishTank samples)"
        note="classifying: URL structure, TLD risk, entropy, subdomain depth"
        value={tog.mlNet} onChange={v => setToggle('mlNet', v)} t={t} />
      <ToggleRow label="Language Irregularity Analyzer"
        desc="NLP English irregularity detection — excl. blogs, regional variants, Shopify, Wix, user-generated"
        note="exceptions: British, Irish, Indian, Canadian, American, Singaporean, Australian, South African"
        value={tog.langIrregularity} onChange={v => setToggle('langIrregularity', v)} t={t} />
      <ToggleRow label="Homoglyph / Cyrillic Detector" desc="Unicode lookalike chars, Punycode decode, hidden ASCII, Cyrillic substitution"
        note="currently protecting against: paypa1, xn-- domains, Cyrillic substitution"
        value={tog.homoglyph} onChange={v => setToggle('homoglyph', v)} t={t} />
      <ToggleRow label="DGA Detector" desc="FIRST.org matrix — DGA + DNS tunneling + cache poisoning detection"
        note="currently protecting against: entropy > 4.2, fast-flux NS, TXT record abuse"
        value={tog.dgaDetector} onChange={v => setToggle('dgaDetector', v)} t={t} color={t.danger} />
      <ToggleRow label="Redirect Chain Analyzer" desc="Follows up to 8 redirect hops, detects final-domain mismatch + short URL origins"
        value={tog.redirectChain} onChange={v => setToggle('redirectChain', v)} t={t} />
    </AccordionSection>
  );
}
