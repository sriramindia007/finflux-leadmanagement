import React from 'react';

const CONFIG = {
  APPROVAL_PENDING: { label: 'APPROVAL PENDING', color: '#FA8D29', bg: '#FEF6EC' },
  QUALIFIED:        { label: 'QUALIFIED',         color: '#1874D0', bg: '#EBF5FF' },
  APPROVED:         { label: 'APPROVED',           color: '#10B981', bg: '#D1FAE5' },
  CONVERTED:        { label: 'CONVERTED',          color: '#10B981', bg: '#D1FAE5' },
  REJECTED:         { label: 'REJECTED',           color: '#EF4444', bg: '#FEE2E2' },
  NOT_CONVERTED:    { label: 'NOT CONVERTED',      color: '#6B7280', bg: '#F1F3F4' },
};

export default function StatusBadge({ status, small }) {
  const cfg = CONFIG[status] || CONFIG.APPROVAL_PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: small ? '2px 7px' : '3px 10px',
      borderRadius: 999,
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      letterSpacing: 0.4,
      color: cfg.color,
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.color}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}
