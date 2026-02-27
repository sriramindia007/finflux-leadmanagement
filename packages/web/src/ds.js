/**
 * Web Design System
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for all web UI styling.
 * Derived directly from Figma "Loanbook Web - Lead Management".
 *
 * RULE: Every component imports from here. Never hardcode colors,
 * font sizes, radii, or spacing values directly in component files.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Color tokens ─────────────────────────────────────────────────
export const color = {
  // Brand
  navy:     '#003366',
  blue:     '#1874D0',

  // Status (badge text + background)
  pending:         '#FA8D29', pendingBg:      '#FEF6EC',
  qualified:       '#1874D0', qualifiedBg:    '#EBF5FF',
  converted:       '#10B981', convertedBg:    '#D1FAE5',
  rejected:        '#EF4444', rejectedBg:     '#FEE2E2',
  notConverted:    '#6B7280', notConvertedBg: '#F1F3F4',

  // Surfaces
  bg:       '#F9FAFB',
  surface:  '#FFFFFF',
  border:   '#E5E7EB',
  borderMid:'#CFD6DD',

  // Text
  textPrimary:   '#003366',
  textBody:      '#374151',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  textLink:      '#1874D0',
};

// ── Typography scale (px) ─────────────────────────────────────────
export const font = { xs: 11, sm: 12, md: 13, base: 14, lg: 15, xl: 16 };

// ── Border radius ─────────────────────────────────────────────────
export const radius = { sm: 4, md: 6, lg: 8, xl: 12 };

// ── Component tokens ─────────────────────────────────────────────

/** Editable input — Figma: 1px #CFD6DD border, 6px radius, 8/12 padding */
export const input = (err) => ({
  padding: '8px 12px',
  border: `1px solid ${err ? color.rejected : color.borderMid}`,
  borderRadius: radius.md,
  fontSize: font.base,
  color: color.textPrimary,
  outline: 'none',
  width: '100%',
  background: color.surface,
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
});

/** Read-only / auto-filled input (e.g. State, District after pincode) */
export const inputReadOnly = {
  padding: '8px 12px',
  border: `1px solid ${color.borderMid}`,
  borderRadius: radius.md,
  fontSize: font.base,
  color: color.textMuted,
  background: '#F5F6FA',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
};

/** White card / info panel */
export const card = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg,
  padding: 16,
};

/** Section header with left blue border — "Basic Details", "Field Officer" */
export const sectionHeader = {
  borderLeft: `3px solid ${color.blue}`,
  paddingLeft: 8,
  fontSize: font.base,
  fontWeight: 600,
  color: color.blue,
};

/** Info row inside a card */
export const infoRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: `1px solid ${color.bg}`,
};
export const infoLabel = { fontSize: font.md, color: color.textSecondary, fontWeight: 500 };
export const infoValue = { fontSize: font.md, color: color.textBody, textAlign: 'right', maxWidth: '60%' };

/** Primary (blue) button */
export const btnPrimary = (disabled) => ({
  padding: '8px 20px',
  border: 'none',
  borderRadius: radius.sm,
  background: disabled ? color.textMuted : color.blue,
  color: '#fff',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: font.base,
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
});

/** Secondary outlined button */
export const btnSecondary = {
  padding: '8px 20px',
  border: `1px solid ${color.borderMid}`,
  borderRadius: radius.sm,
  background: color.surface,
  color: color.textBody,
  cursor: 'pointer',
  fontSize: font.base,
  fontFamily: 'Inter, sans-serif',
};

/** Danger outlined button (Reject Lead) */
export const btnDanger = {
  padding: '8px 20px',
  border: `1px solid ${color.rejected}`,
  borderRadius: radius.sm,
  background: color.surface,
  color: color.rejected,
  cursor: 'pointer',
  fontSize: font.base,
  fontFamily: 'Inter, sans-serif',
};

/** Success outlined button (Approve Lead) */
export const btnSuccess = {
  padding: '8px 20px',
  border: `1px solid ${color.converted}`,
  borderRadius: radius.sm,
  background: color.surface,
  color: color.converted,
  cursor: 'pointer',
  fontSize: font.base,
  fontFamily: 'Inter, sans-serif',
};

/** Filter pill — Figma: navy filled when active, white outlined when inactive */
export const pill = (active) => ({
  padding: '5px 14px',
  borderRadius: 999,
  border: `1px solid ${active ? color.navy : color.borderMid}`,
  background: active ? color.navy : color.surface,
  color: active ? '#fff' : color.textBody,
  fontSize: font.sm,
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'Inter, sans-serif',
});

/** Status badge config — use in StatusBadge component */
export const statusConfig = {
  APPROVAL_PENDING: { label: 'APPROVAL PENDING', color: '#FA8D29', bg: '#FEF6EC' },
  QUALIFIED:        { label: 'QUALIFIED',         color: '#1874D0', bg: '#EBF5FF' },
  APPROVED:         { label: 'APPROVED',           color: '#10B981', bg: '#D1FAE5' },
  CONVERTED:        { label: 'CONVERTED',          color: '#10B981', bg: '#D1FAE5' },
  REJECTED:         { label: 'REJECTED',           color: '#EF4444', bg: '#FEE2E2' },
  NOT_CONVERTED:    { label: 'NOT CONVERTED',      color: '#6B7280', bg: '#F1F3F4' },
};

/** Step sidebar icon styles */
export const stepIcon = {
  done:    { bg: '#10B981', border: '#10B981', color: '#fff',     symbol: '✓' },
  active:  { bg: '#FFF7ED', border: '#FA8D29', color: '#FA8D29',  symbol: '⏱' },
  pending: { bg: 'transparent', border: '#D1D5DB', color: '#9CA3AF', symbol: '○' },
};
