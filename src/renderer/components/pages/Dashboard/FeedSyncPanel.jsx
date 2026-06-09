import React from 'react';
import { Card, SectionHeader, StatusDot } from '../../shared/primitives.jsx';
import { Tag } from '../../shared/Tag.jsx';

export default function FeedSyncPanel({ filterLists, t }) {
  return (
    <Card t={t} style={{ flex: 2, overflow: 'auto' }}>
      <SectionHeader t={t}>Threat Intelligence Sources</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {filterLists.filter(l => l.id !== 'manual').map(list => (
          <div key={list.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
            background: t.surface, borderRadius: 3, opacity: list.enabled ? 1 : 0.45,
            border: `1px solid ${list.enabled ? t.border : t.textDim + '22'}`,
          }}>
            <StatusDot active={list.enabled} t={t} size={6} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: t.text, fontSize: 11, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.name}</div>
              <div style={{ color: t.textDim, fontSize: 9, fontFamily: t.mono }}>{(list.count || 0).toLocaleString()} entries</div>
            </div>
            <Tag label={list.category} color={t.info} t={t} small />
          </div>
        ))}
        {filterLists.length === 0 && (
          <div style={{ color: t.textDim, fontSize: 11, fontFamily: t.mono }}>loading...</div>
        )}
      </div>
    </Card>
  );
}
