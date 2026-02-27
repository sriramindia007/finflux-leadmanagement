import React from 'react';
const CFG = {
  APPROVAL_PENDING: { label: 'APPROVAL PENDING', color: '#FA8D29', bg: '#FEF6EC' },
  QUALIFIED:        { label: 'QUALIFIED',         color: '#2196F3', bg: '#EBF5FF' },
  APPROVED:         { label: 'APPROVED',           color: '#10B981', bg: '#D1FAE5' },
  CONVERTED:        { label: 'CONVERTED',          color: '#10B981', bg: '#D1FAE5' },
  REJECTED:         { label: 'REJECTED',           color: '#EF4444', bg: '#FEE2E2' },
  NOT_CONVERTED:    { label: 'NOT CONVERTED',      color: '#6B7280', bg: '#F1F3F4' },
};
export default function StatusBadge({ status }) {
  const cfg = CFG[status] || CFG.APPROVAL_PENDING;
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:40, fontSize:11, fontWeight:700, letterSpacing:0.5, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}` }}>{cfg.label}</span>;
}
