import React from 'react';

function Btn({ children, onClick, t, danger, disabled, small, style = {} }) {
  const c = danger ? t.danger : t.accent;
  return (
    <button
      type="button"
      onClick={disabled ? null : onClick}
      disabled={disabled}
      style={{
        background: disabled ? t.border : c + '18', color: disabled ? t.textDim : c,
        border: `1px solid ${disabled ? t.border : c + '55'}`, borderRadius: 3,
        padding: small ? '3px 9px' : '6px 14px', fontSize: small ? 10 : 12,
        fontFamily: t.mono, cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap', ...style,
      }}
      onMouseEnter={!disabled ? e => e.currentTarget.style.background = c + '30' : null}
      onMouseLeave={!disabled ? e => e.currentTarget.style.background = c + '18' : null}
    >{children}</button>
  );
}

export default function ConfirmButton({ label, confirmLabel, onConfirm, t, danger, timeout = 3000 }) {
  const [stage, setStage] = React.useState(0);
  const timerRef = React.useRef(null);

  const handle = () => {
    if (stage === 0) {
      setStage(1);
      timerRef.current = setTimeout(() => setStage(0), timeout);
    } else {
      clearTimeout(timerRef.current);
      setStage(0);
      onConfirm();
    }
  };

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <Btn t={t} danger={danger} onClick={handle} style={{ width: '100%' }}>
      {stage === 0 ? label : confirmLabel}
    </Btn>
  );
}
