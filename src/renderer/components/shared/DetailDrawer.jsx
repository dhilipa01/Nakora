import React from 'react';
import { useAppState } from '../../context/AppState.context.jsx';
import { SectionHeader, Tag, ScoreBadge, VerdictBadge, Btn, ProgressBar } from './primitives.jsx';
import { verdictColor, scoreColor } from '../../theme.js';

const SIGNALS = {
  'Homoglyph/Punycode': [{name:'Homoglyph chars',weight:30},{name:'Punycode encoding',weight:20},{name:'Cyrillic mix',weight:25}],
  'PhishTank API':      [{name:'PhishTank match',weight:40},{name:'Community verified',weight:20},{name:'Recent submit',weight:15}],
  'Redirect Chain':     [{name:'Hops > 2',weight:20},{name:'Domain mismatch',weight:25},{name:'Short URL',weight:15}],
  'DGA Detector':       [{name:'Entropy > 4.2',weight:35},{name:'Fast-flux NS',weight:30},{name:'Age < 7d',weight:20}],
  'Cryptojacking/ETW':  [{name:'CoinBlocker match',weight:35},{name:'CPU spike corr.',weight:25},{name:'Mining pool DNS',weight:20}],
  'ML.NET':             [{name:'ML score',weight:30},{name:'URL features',weight:15},{name:'TLD risk',weight:10}],
};

export default function DetailDrawer({ t }) {
  const { selectedEntry, selectEntry } = useAppState();
  if (!selectedEntry) return null;
  const e = selectedEntry;
  const signals = SIGNALS[e.analyzer] || [{name:'Heuristic signal', weight: e.score}];

  return (
    <div style={{ width:320, flexShrink:0, background:t.surface, borderLeft:`1px solid ${t.border}`,
      display:'flex', flexDirection:'column', overflow:'hidden', animation:'fadein 0.15s ease' }}>
      <div style={{ padding:'10px 12px', borderBottom:`1px solid ${t.border}`, display:'flex', alignItems:'center' }}>
        <span style={{ color:t.textMid, fontSize:10, fontFamily:t.mono, flex:1 }}>SIGNAL DETAIL</span>
        <button onClick={()=>selectEntry(null)} style={{ background:'none', border:'none', color:t.textDim, cursor:'pointer', fontSize:16, fontFamily:t.mono }}>×</button>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:12, display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ fontFamily:t.mono, color:t.text, fontSize:12, fontWeight:600, wordBreak:'break-all' }}>{e.domain}</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <VerdictBadge verdict={e.verdict} t={t} />
          <ScoreBadge score={e.score} t={t} />
          {e.abuseType&&e.abuseType!=='None'&&<Tag label={e.abuseType} color={t.warn} t={t} small />}
        </div>
        <ProgressBar value={e.score} max={100} color={scoreColor(e.score,t)} t={t} h={5} label="CONFIDENCE" showVal />
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:3, padding:'8px 10px' }}>
          {[['ANALYZER',e.analyzer,t.text],['TRIGGER',e.trigger,t.warn],['TYPE',e.abuseType||'N/A',t.text],['LATENCY',(e.latency||'--')+'ms',t.info]].map(([k,v,c])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'2px 0', borderBottom:`1px solid ${t.border}` }}>
              <span style={{ color:t.textDim, fontSize:9, fontFamily:t.mono }}>{k}</span>
              <span style={{ color:c, fontSize:10, fontFamily:t.mono }}>{v}</span>
            </div>
          ))}
        </div>
        <SectionHeader t={t}>Signal Breakdown</SectionHeader>
        {signals.map((sig,i)=>{
          const c = sig.weight<0?t.safe:sig.weight>25?t.danger:t.warn;
          return <div key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ color:t.textMid, fontSize:10, fontFamily:t.mono }}>{sig.name}</span>
              <span style={{ color:c, fontSize:10, fontFamily:t.mono }}>{sig.weight>0?'+':''}{sig.weight}</span>
            </div>
            <ProgressBar value={Math.abs(sig.weight)} max={40} color={c} t={t} h={3} />
          </div>;
        })}
        <div style={{ color:t.textDim, fontSize:9, fontFamily:t.mono }}>
          {typeof e.time==='string'?e.time.replace('T',' ').slice(0,19):'--'}
        </div>
        <div style={{ display:'flex', gap:6, marginTop:'auto' }}>
          <Btn t={t} small style={{ flex:1 }} onClick={async()=>{
            await window.nakora?.domains.addToWhitelist(e.domain,'User override').catch(()=>{});
            selectEntry(null);
          }}>+ ALLOW</Btn>
          <Btn t={t} danger small style={{ flex:1 }} onClick={async()=>{
            await window.nakora?.domains.addToBlacklist(e.domain).catch(()=>{});
            selectEntry(null);
          }}>+ BLOCK</Btn>
        </div>
      </div>
    </div>
  );
}
