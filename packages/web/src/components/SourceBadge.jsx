import React from 'react';

// Canonical source definitions — icon, label, colors
const SOURCE_CONFIG = {
  'Field Scouting': { icon: '📍', color: '#92400E', bg: '#FEF3C7', border: '#F59E0B' },
  'CRM':            { icon: '🏢', color: '#6D28D9', bg: '#EDE9FE', border: '#A78BFA' },
  'Back Office':    { icon: '🖥',  color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
  'Bulk Upload':    { icon: '📤', color: '#0E7490', bg: '#CFFAFE', border: '#67E8F9' },
  'Inbound Call':   { icon: '📞', color: '#075985', bg: '#E0F2FE', border: '#7DD3FC' },
  'Outbound Call':  { icon: '📣', color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
};

const DEFAULT_CONFIG = { icon: '🔗', color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' };

export default function SourceBadge({ source, small }) {
  const src = source || 'Unknown';
  const cfg = SOURCE_CONFIG[src] || DEFAULT_CONFIG;
  const fs  = small ? 10 : 11;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: small ? '2px 7px' : '3px 10px',
      borderRadius: 999,
      fontSize: fs,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: small ? 10 : 12 }}>{cfg.icon}</span>
      {src}
    </span>
  );
}
