import React from 'react';

export default function AccordionSection({ title, children, t, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: open ? '3px 3px 0 0' : 3,
          padding: '9px 12px', color: t.textMid, fontSize: 9,
          fontFamily: t.mono, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.12em',
        }}
      >
        {title}
        <span aria-hidden="true" style={{ color: t.textDim, fontSize: 13 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div id={id} style={{
          background: t.card, border: `1px solid ${t.border}`, borderTop: 'none',
          borderRadius: '0 0 3px 3px', padding: '10px 12px',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
