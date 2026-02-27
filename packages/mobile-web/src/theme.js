export const c = {
  primary: '#2196F3', navy: '#003366', bg: '#F5F6FA', surface: '#FFFFFF',
  border: '#CFD6DD', borderLight: '#E8EDF2',
  pending: '#FA8D29', pendingBg: '#FEF6EC',
  qualified: '#2196F3', qualifiedBg: '#EBF5FF',
  converted: '#10B981', convertedBg: '#D1FAE5',
  rejected: '#EF4444', rejectedBg: '#FEE2E2',
  approved: '#10B981', approvedBg: '#D1FAE5',
  stepDone: '#10B981', stepActive: '#FA8D29', stepPending: '#9CA3AF',
  textPrimary: '#003366', textSecondary: '#6B7280', textMuted: '#9CA3AF', white: '#FFFFFF',
};

export const card = { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 10 };
export const input = { width: '100%', padding: '14px 16px', border: '1px solid #CFD6DD', borderRadius: 12, fontSize: 15, color: '#003366', outline: 'none', background: '#fff', marginBottom: 10 };
export const pill = (active) => ({ padding: '7px 16px', borderRadius: 40, border: `1px solid ${active ? '#003366' : '#CFD6DD'}`, background: active ? '#003366' : '#fff', color: active ? '#fff' : '#6B7280', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer' });
export const backBtn = { width: 36, height: 36, borderRadius: 18, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 18, color: '#003366' };
export const primaryBtn = (disabled) => ({ width: '100%', padding: '14px', borderRadius: 40, background: disabled ? '#CFD6DD' : '#2196F3', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' });
