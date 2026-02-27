// Finflux design tokens — mobile (React Native)
export const colors = {
  primary: '#2196F3',
  primaryDark: '#003366',
  navyText: '#003366',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#CFD6DD',
  borderLight: '#E8EDF2',

  // Status
  pending: '#FA8D29',
  pendingBg: '#FEF6EC',
  qualified: '#2196F3',
  qualifiedBg: '#EBF5FF',
  converted: '#10B981',
  convertedBg: '#D1FAE5',
  rejected: '#EF4444',
  rejectedBg: '#FEE2E2',
  approved: '#10B981',
  approvedBg: '#D1FAE5',

  // Steps
  stepDone: '#10B981',
  stepActive: '#FA8D29',
  stepPending: '#9CA3AF',

  // Dashboard cards
  cardBlue: '#EBF5FF',
  cardGreen: '#D1FAE5',
  cardOrange: '#FEF3C7',

  // Text
  textPrimary: '#003366',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textWhite: '#FFFFFF',
};

export const typography = {
  fontFamily: 'System',
  sizes: { xs: 11, sm: 12, base: 14, md: 15, lg: 16, xl: 18, xxl: 20, xxxl: 24 },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
};

export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, pill: 40, full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fab: {
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};
