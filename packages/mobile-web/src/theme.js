/**
 * Mobile Design System
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for all mobile UI styling.
 * Derived directly from Figma "Loanbook Field Staff - Lead Management".
 *
 * RULE: Every screen imports from here. Never hardcode design values.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Color tokens ─────────────────────────────────────────────────
export const c = {
  primary:      '#2196F3',
  navy:         '#003366',
  bg:           '#F5F6FA',
  surface:      '#FFFFFF',
  border:       '#CFD6DD',
  borderLight:  '#E8EDF2',

  // Status
  pending:      '#FA8D29', pendingBg:   'rgba(250,141,41,0.12)',
  qualified:    '#2196F3', qualifiedBg: 'rgba(33,150,243,0.12)',
  converted:    '#10B981', convertedBg: 'rgba(16,185,129,0.12)',
  rejected:     '#EF4444', rejectedBg:  'rgba(239,68,68,0.12)',
  approved:     '#10B981', approvedBg:  'rgba(16,185,129,0.12)',

  // Steps
  stepDone:    '#10B981',
  stepActive:  '#FA8D29',
  stepPending: '#9CA3AF',

  // Text
  textPrimary:   '#003366',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  white:         '#FFFFFF',
};

// ── Card ─────────────────────────────────────────────────────────
/** Standard white card — Figma: 16px radius, subtle shadow */
export const card = {
  background:   '#fff',
  borderRadius: 16,
  padding:      16,
  boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
  marginBottom: 12,
};

// ── Input ─────────────────────────────────────────────────────────
/** Full-width rounded input — Figma: 14px radius, 14px vertical padding */
export const input = (err) => ({
  width:        '100%',
  padding:      '14px 16px',
  border:       `1.5px solid ${err ? '#EF4444' : '#CFD6DD'}`,
  borderRadius: 14,
  fontSize:     15,
  color:        '#003366',
  outline:      'none',
  background:   '#fff',
  marginBottom: 12,
  boxSizing:    'border-box',
  fontFamily:   'Inter, sans-serif',
});

// ── Back button ───────────────────────────────────────────────────
/** Round white circle back button — Figma: 36px circle, shadow */
export const backBtn = {
  width:          36,
  height:         36,
  borderRadius:   18,
  background:     '#fff',
  border:         'none',
  cursor:         'pointer',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  boxShadow:      '0 2px 8px rgba(0,0,0,0.08)',
  fontSize:       18,
  color:          '#003366',
  flexShrink:     0,
};

// ── Primary button ────────────────────────────────────────────────
/** Full-width pill button — Figma: 40px radius, #2196F3 */
export const primaryBtn = (disabled) => ({
  width:        '100%',
  padding:      '14px',
  borderRadius: 40,
  background:   disabled ? '#CFD6DD' : '#2196F3',
  color:        '#fff',
  border:       'none',
  fontSize:     15,
  fontWeight:   700,
  cursor:       disabled ? 'not-allowed' : 'pointer',
  fontFamily:   'Inter, sans-serif',
});

// ── Filter pill ───────────────────────────────────────────────────
/** Filter pill — Figma: active=#003366 filled, inactive=white outlined */
export const pill = (active) => ({
  padding:      '7px 16px',
  borderRadius: 40,
  border:       `1.5px solid ${active ? '#003366' : '#CFD6DD'}`,
  background:   active ? '#003366' : '#fff',
  color:        active ? '#fff' : '#6B7280',
  fontSize:     13,
  fontWeight:   active ? 600 : 400,
  cursor:       'pointer',
  whiteSpace:   'nowrap',
  fontFamily:   'Inter, sans-serif',
});

// ── Status badge ──────────────────────────────────────────────────
/** Status badge — Figma: pill, no border, light colored bg */
export const statusBadge = (status) => {
  const map = {
    APPROVAL_PENDING: { color: '#FA8D29', bg: 'rgba(250,141,41,0.12)' },
    QUALIFIED:        { color: '#2196F3', bg: 'rgba(33,150,243,0.12)' },
    CONVERTED:        { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    REJECTED:         { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    APPROVED:         { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    NOT_CONVERTED:    { color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  };
  const s = map[status] || map.APPROVAL_PENDING;
  return {
    display:       'inline-block',
    padding:       '4px 10px',
    borderRadius:  40,
    fontSize:      10,
    fontWeight:    700,
    letterSpacing: 0.5,
    color:         s.color,
    background:    s.bg,
    textTransform: 'uppercase',
    fontFamily:    'Inter, sans-serif',
  };
};

// ── Page header ───────────────────────────────────────────────────
export const pageHeader = {
  display:    'flex',
  alignItems: 'center',
  gap:        12,
  padding:    '16px 16px 8px',
};

export const pageTitle = {
  fontSize:   17,
  fontWeight: 700,
  color:      '#003366',
  fontFamily: 'Inter, sans-serif',
};
