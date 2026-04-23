import React from 'react';
import { scoreColor, verdictColor, verdictBg } from '../../theme.js';

export const Tag = ({ label, color, t, small }) => (
  <span style={{ background:color+'1a', color, border:`1px solid ${color}44`, borderRadius:3,
    padding:small?'1px 5px':'2px 8px', fontSize:small?10:11, fontFamily:t.mono, fontWeight:600, whiteSpace:'nowrap', letterSpacing:'0.04em' }}>{label}</span>
);

export const ScoreBadge = ({ score, t }) => <Tag label={String(score)} color={scoreColor(score,t)} t={t} />;
export const VerdictBadge = ({ verdict, t }) => <Tag label={verdict} color={verdictColor(verdict,t)} t={t} />;

export const StatusDot = ({ active, t, size=7 }) => {
  const c = active ? t.accent : t.textDim;
  return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:c,
    boxShadow:active?`0 0 6px ${c}`:'none', animation:active?'pulse 2.5s ease-in-out infinite':'none', flexShrink:0 }} />;
};

export const SectionHeader = ({ children, t }) => (
  <div style={{ color:t.textMid, fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase',
    fontFamily:t.mono, marginBottom:10, borderBottom:`1px solid ${t.border}`, paddingBottom:5 }}>{children}</div>
);

export const Card = ({ children, t, style={}, onClick }) => (
  <div onClick={onClick} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:6, padding:'12px 14px',
    transition:'border-color 0.15s', cursor:onClick?'pointer':'default', ...style }}
    onMouseEnter={onClick?e=>e.currentTarget.style.borderColor=t.borderBright:null}
    onMouseLeave={onClick?e=>e.currentTarget.style.borderColor=t.border:null}>{children}</div>
);

export const StatCard = ({ label, value, color, t, sub }) => (
  <Card t={t} style={{ flex:1 }}>
    <div style={{ color:t.textDim, fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:t.mono, marginBottom:6 }}>{label}</div>
    <div style={{ color:color||t.accentBright, fontFamily:t.mono, fontSize:24, fontWeight:700, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ color:t.textDim, fontSize:10, marginTop:4, fontFamily:t.mono }}>{sub}</div>}
  </Card>
);

export const ProgressBar = ({ value, max=100, color, t, h=4, label, showVal }) => {
  const pct = Math.min((value/max)*100,100);
  return (
    <div>
      {(label||showVal) && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
        {label && <span style={{ color:t.textMid, fontSize:10, fontFamily:t.mono }}>{label}</span>}
        {showVal && <span style={{ color, fontSize:10, fontFamily:t.mono }}>{value}</span>}
      </div>}
      <div style={{ height:h, background:t.border, borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, transition:'width 0.4s ease', boxShadow:`0 0 6px ${color}88` }} />
      </div>
    </div>
  );
};

export const Sparkline = ({ data, color, h=28, w=90 }) => {
  if (!data?.length) return null;
  const max = Math.max(...data,1);
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-(v/max)*(h-2)-1}`).join(' ');
  return <svg width={w} height={h} style={{ overflow:'visible' }}>
    <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} style={{ filter:`drop-shadow(0 0 3px ${color})` }} />
  </svg>;
};

export const Input = ({ value, onChange, placeholder, t, password, style={} }) => (
  <input type={password?'password':'text'} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:3, padding:'6px 10px',
      color:t.text, fontSize:12, fontFamily:t.mono, width:'100%', outline:'none', transition:'border-color 0.15s', ...style }}
    onFocus={e=>e.target.style.borderColor=t.accent}
    onBlur={e=>e.target.style.borderColor=t.border} />
);

export const Btn = ({ children, onClick, t, color, danger, disabled, small, style={} }) => {
  const c = danger?t.danger:color||t.accent;
  return <button type="button" onClick={disabled?null:onClick} disabled={disabled} style={{
    background:disabled?t.border:c+'18', color:disabled?t.textDim:c,
    border:`1px solid ${disabled?t.border:c+'55'}`, borderRadius:3,
    padding:small?'3px 9px':'6px 14px', fontSize:small?10:12, fontFamily:t.mono,
    cursor:disabled?'not-allowed':'pointer', fontWeight:600, transition:'all 0.15s', whiteSpace:'nowrap', ...style }}
    onMouseEnter={!disabled?e=>e.currentTarget.style.background=c+'30':null}
    onMouseLeave={!disabled?e=>e.currentTarget.style.background=c+'18':null}>{children}</button>;
};

export const Toggle = ({ value, onChange, t, color }) => {
  const c = color||t.accent;
  return <div onClick={()=>onChange(!value)} role="switch" aria-checked={value} tabIndex={0}
    onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&onChange(!value)}
    style={{ width:38, height:20, borderRadius:10, background:value?c:t.border, position:'relative',
      cursor:'pointer', flexShrink:0, transition:'background 0.2s', boxShadow:value?`0 0 8px ${c}66`:'none' }}>
    <div style={{ position:'absolute', top:2, left:value?20:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
  </div>;
};

export const FeedItem = ({ time, domain, verdict, score, trigger, analyzer, onClick, t }) => {
  const vc = verdictColor;
  const vb = verdictBg;
  return <div onClick={onClick} role="button" tabIndex={0}
    onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&onClick?.()}
    aria-label={`${verdict} — ${domain} — score ${score}`}
    style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 8px',
    background:verdict!=='CLEAN'?vb(verdict,t):'transparent', borderRadius:3, cursor:'pointer',
    borderLeft:`2px solid ${verdict!=='CLEAN'?vc(verdict,t):t.border}`, animation:'fadein 0.2s ease' }}
    onMouseEnter={e=>e.currentTarget.style.background=t.card}
    onMouseLeave={e=>e.currentTarget.style.background=verdict!=='CLEAN'?vb(verdict,t):'transparent'}>
    <span style={{ color:t.textDim, fontSize:10, fontFamily:t.mono, flexShrink:0, width:68 }}>{String(time||'').slice(11,19)}</span>
    <span style={{ flex:1, color:t.text, fontSize:11, fontFamily:t.mono, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{domain}</span>
    <Tag label={String(score)} color={scoreColor(score,t)} t={t} small />
    <Tag label={verdict} color={vc(verdict,t)} t={t} small />
    <span style={{ color:t.textDim, fontSize:9, fontFamily:t.mono }}>{analyzer}</span>
  </div>;
};

export function ConfirmButton({ label, confirmLabel, onConfirm, t, danger, timeout=3000 }) {
  const [stage, setStage] = React.useState(0);
  const timerRef = React.useRef(null);
  const handle = () => {
    if (stage===0) {
      setStage(1);
      timerRef.current = setTimeout(()=>setStage(0), timeout);
    } else {
      clearTimeout(timerRef.current);
      setStage(0);
      onConfirm();
    }
  };
  React.useEffect(()=>()=>clearTimeout(timerRef.current),[]);
  return <Btn t={t} danger={danger} onClick={handle} style={{ width:'100%' }}>
    {stage===0 ? label : confirmLabel}
  </Btn>;
}

export function AccordionSection({ title, children, t, defaultOpen=true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();
  return <div style={{ marginBottom:8 }}>
    <button type="button" aria-expanded={open} aria-controls={id}
      onClick={()=>setOpen(o=>!o)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
      background:t.card, border:`1px solid ${t.border}`, borderRadius:open?'3px 3px 0 0':3,
      padding:'9px 12px', color:t.textMid, fontSize:9, fontFamily:t.mono, fontWeight:600, cursor:'pointer', letterSpacing:'0.12em' }}>
      {title}<span aria-hidden="true" style={{ color:t.textDim, fontSize:13 }}>{open?'−':'+'}</span>
    </button>
    {open && <div id={id} style={{ background:t.card, border:`1px solid ${t.border}`, borderTop:'none', borderRadius:'0 0 3px 3px', padding:'10px 12px' }}>{children}</div>}
  </div>;
}

export function FilterBar({ onSearch, onVerdictChange, onAnalyzerChange, t, analyzers=[] }) {
  const [search, setSearch] = React.useState('');
  const [verdict, setVerdict] = React.useState('ALL');
  const [analyzer, setAnalyzer] = React.useState('ALL');
  const timerRef = React.useRef(null);
  const handleSearch = v => { setSearch(v); clearTimeout(timerRef.current); timerRef.current=setTimeout(()=>onSearch?.(v),300); };
  const s = { background:t.surface, border:`1px solid ${t.border}`, color:t.text, fontSize:11, fontFamily:t.mono, padding:'5px 8px', borderRadius:3 };
  return <div style={{ display:'flex', gap:8, alignItems:'center' }} role="search">
    <input value={search} onChange={e=>handleSearch(e.target.value)} placeholder="search domain..."
      aria-label="Search domains" style={{ flex:1, ...s, outline:'none' }} />
    <select value={verdict} onChange={e=>{setVerdict(e.target.value);onVerdictChange?.(e.target.value);}}
      aria-label="Filter by verdict" style={s}>
      {['ALL','BLOCKED','WARNING','CLEAN'].map(v=><option key={v}>{v}</option>)}
    </select>
    {analyzers.length>0 && <select value={analyzer} onChange={e=>{setAnalyzer(e.target.value);onAnalyzerChange?.(e.target.value);}}
      aria-label="Filter by analyzer" style={s}>
      <option>ALL</option>
      {analyzers.map(a=><option key={a}>{a}</option>)}
    </select>}
    <button type="button" aria-label="Clear filters"
      onClick={()=>{setSearch('');setVerdict('ALL');setAnalyzer('ALL');onSearch?.('');onVerdictChange?.('ALL');onAnalyzerChange?.('ALL');}}
      style={{ ...s, cursor:'pointer', color:t.textDim }}>×</button>
  </div>;
}
