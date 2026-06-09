import React from 'react';
import { Btn } from '../../shared/primitives.jsx';

export default function ExportAction({ status, result, onExport, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
      <div>
        <div style={{ color: t.text, fontSize: 14, fontFamily: t.mono, fontWeight: 700, marginBottom: 3 }}>DATA EXPORT</div>
        <div style={{ color: t.textDim, fontSize: 12 }}>
          Opens a native Windows save dialog. Writes real JSON — system data, session counters, config, domain lists.
        </div>
        <div style={{ color: t.textDim, fontSize: 10, marginTop: 3, fontFamily: t.mono }}>
          GDPR Art. 20 — right to data portability · Art. 17 — right to erasure (Delete in Settings)
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <Btn t={t} onClick={onExport} disabled={status === 'running'} style={{ minWidth: 260 }}>
          {status === 'running' ? 'WRITING FILE...' : status === 'done' ? 'EXPORT AGAIN' : 'EXPORT DATA — OPEN SAVE DIALOG'}
        </Btn>
        {status === 'done' && result?.path && (
          <div style={{ color: t.safe, fontSize: 10, fontFamily: t.mono }}>✓ saved: {result.path}</div>
        )}
        {status === 'error' && (
          <div style={{ color: t.danger, fontSize: 10, fontFamily: t.mono }}>✗ {result?.error || 'export failed'}</div>
        )}
      </div>
    </div>
  );
}
