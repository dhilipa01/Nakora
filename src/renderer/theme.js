export const THEMES = {
  original: {
    bg:'#060A06', surface:'#0b110b', card:'#0e160e', cardHover:'#131d13',
    border:'#1a3a1a', borderBright:'#2a6a2a',
    accent:'#00cc33', accentBright:'#00ff41', accentDim:'#00cc3318',
    danger:'#ff3333', dangerDim:'#ff333318',
    warn:'#ffaa00', warnDim:'#ffaa0018',
    info:'#00aaff', infoDim:'#00aaff18',
    safe:'#00cc33', safeDim:'#00cc3318',
    text:'#c8e8c8', textBright:'#00ff41', textMid:'#4a8a4a', textDim:'#1a4a1a',
    titleBar:'#040804', navBg:'#060A06',
    mono:"'JetBrains Mono', monospace", sans:"'IBM Plex Sans', sans-serif",
  },
  darker: {
    bg:'#020402', surface:'#060a06', card:'#080c08', cardHover:'#0c120c',
    border:'#122012', borderBright:'#1a401a',
    accent:'#00aa28', accentBright:'#00cc33', accentDim:'#00aa2818',
    danger:'#cc2222', dangerDim:'#cc222218',
    warn:'#cc8800', warnDim:'#cc880018',
    info:'#0088cc', infoDim:'#0088cc18',
    safe:'#00aa28', safeDim:'#00aa2818',
    text:'#90c090', textBright:'#00cc33', textMid:'#306030', textDim:'#102010',
    titleBar:'#020402', navBg:'#020402',
    mono:"'JetBrains Mono', monospace", sans:"'IBM Plex Sans', sans-serif",
  },
  hacker: {
    bg:'#000000', surface:'#010501', card:'#020802', cardHover:'#031003',
    border:'#0a2a0a', borderBright:'#154015',
    accent:'#00ff41', accentBright:'#80ff80', accentDim:'#00ff4114',
    danger:'#ff0000', dangerDim:'#ff000014',
    warn:'#ffff00', warnDim:'#ffff0014',
    info:'#00ffff', infoDim:'#00ffff14',
    safe:'#00ff41', safeDim:'#00ff4114',
    text:'#00ee30', textBright:'#00ff41', textMid:'#007718', textDim:'#003308',
    titleBar:'#000000', navBg:'#000000',
    mono:"'JetBrains Mono', monospace", sans:"'JetBrains Mono', monospace",
    scanlines: true,
  },
};

export const verdictColor = (v, t) => v==='BLOCKED'?t.danger:v==='WARNING'?t.warn:v==='CLEAN'?t.safe:t.textMid;
export const verdictBg    = (v, t) => v==='BLOCKED'?t.dangerDim:v==='WARNING'?t.warnDim:v==='CLEAN'?t.safeDim:t.accentDim;
export const scoreColor   = (s, t) => s>=70?t.danger:s>=40?t.warn:t.safe;
export const abuseColor   = (type, t) => ({'Phishing':t.danger,'Malware C2':t.danger,'Cryptojacking':t.warn,'Suspicious':t.warn,'Tracker':t.info,'DGA':t.danger,'DNS Tunneling':t.warn,'Cache Poisoning':t.danger}[type]||t.textMid);
