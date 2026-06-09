import React, { useState, useEffect } from 'react';
import { AccordionSection, Input, Btn, Tag } from '../../shared/primitives.jsx';

export default function ApiConfigSection({ api, updateSetting, t }) {
  const [apiKeyStatus, setApiKeyStatus] = useState({ phishtank: false, virustotal: false });
  const [apiTests,     setApiTests]     = useState({});
  const [goEndpoint,   setGoEndpoint]   = useState(api?.goEndpoint || 'http://localhost:8080');
  const [ptKey,        setPtKey]        = useState('');
  const [vtKey,        setVtKey]        = useState('');

  useEffect(() => {
    ['phishtank', 'virustotal'].forEach(async name => {
      const r = await window.nakora?.settings.getApiKeyStatus(name).catch(() => null);
      const d = r?.data ?? r;
      if (d) setApiKeyStatus(p => ({ ...p, [name]: d.configured }));
    });
  }, []);

  useEffect(() => { if (api?.goEndpoint) setGoEndpoint(api.goEndpoint); }, [api?.goEndpoint]);

  const testApi = async (key) => {
    setApiTests(p => ({ ...p, [key]: 'testing' }));
    const ep = key === 'go' ? goEndpoint : `https://${key}.api.check`;
    const r = await window.nakora?.settings.testConnection(ep).catch(() => null);
    const d = r?.data ?? r;
    setApiTests(p => ({ ...p, [key]: d?.ok ? 'ok' : 'fail' }));
  };

  const saveGoEndpoint = () => updateSetting({ apiConfig: { goEndpoint } });

  const saveApiKey = async (name, value) => {
    if (!value.trim()) return;
    await window.nakora?.settings.setApiKey(name, value.trim()).catch(() => {});
    setApiKeyStatus(p => ({ ...p, [name]: true }));
    if (name === 'phishtank') setPtKey('');
    if (name === 'virustotal') setVtKey('');
  };

  const testIcon = (k) => {
    if (apiTests[k] === 'testing') return <span style={{ color: t.warn, fontSize: 9, fontFamily: t.mono }}>...</span>;
    if (apiTests[k] === 'ok')      return <Tag label="OK"   color={t.safe}   t={t} small />;
    if (apiTests[k] === 'fail')    return <Tag label="FAIL" color={t.danger} t={t} small />;
    return null;
  };

  return (
    <AccordionSection title="API CONFIGURATION" t={t} defaultOpen={false}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ width: 170, color: t.textMid, fontSize: 11, fontFamily: t.mono, flexShrink: 0 }}>Go Microservice URL</span>
        <Input value={goEndpoint} onChange={setGoEndpoint} placeholder="http://localhost:8080" t={t} />
        <Btn t={t} small onClick={saveGoEndpoint}>SAVE</Btn>
        <Btn t={t} small onClick={() => testApi('go')}>TEST</Btn>
        <div style={{ width: 32 }}>{testIcon('go')}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ width: 170, color: t.textMid, fontSize: 11, fontFamily: t.mono, flexShrink: 0 }}>PhishTank API Key</span>
        <Input value={ptKey} onChange={setPtKey} placeholder={apiKeyStatus.phishtank ? '●●●●●● configured' : 'pk_...'} t={t} password />
        <Btn t={t} small onClick={() => saveApiKey('phishtank', ptKey)}>SAVE</Btn>
        <Btn t={t} small onClick={() => testApi('pt')}>TEST</Btn>
        <div style={{ width: 32 }}>{testIcon('pt') || (apiKeyStatus.phishtank && <Tag label="SET" color={t.safe} t={t} small />)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
        <span style={{ width: 170, color: t.textMid, fontSize: 11, fontFamily: t.mono, flexShrink: 0 }}>VirusTotal API Key</span>
        <Input value={vtKey} onChange={setVtKey} placeholder={apiKeyStatus.virustotal ? '●●●●●● configured' : 'vt_...'} t={t} password />
        <Btn t={t} small onClick={() => saveApiKey('virustotal', vtKey)}>SAVE</Btn>
        <Btn t={t} small onClick={() => testApi('vt')}>TEST</Btn>
        <div style={{ width: 32 }}>{testIcon('vt') || (apiKeyStatus.virustotal && <Tag label="SET" color={t.safe} t={t} small />)}</div>
      </div>
      <div style={{ color: t.textDim, fontSize: 10, fontFamily: t.mono, marginTop: 8 }}>
        API keys stored in Windows Credential Manager (keytar) — never in plaintext files.
      </div>
    </AccordionSection>
  );
}
