import React, { useState } from 'react';
import { c } from '../theme';
import { api } from '../services/api';

const REASONS = ['Low Credit Score','Insufficient Income','Already Has Loan','Invalid Documents','Ineligible Area','Customer Declined','Other'];

export default function RejectionScreen({ navigate, lead }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleConfirm = async () => {
    if (!reason) { setError('Please select a rejection reason.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.updateLead(lead.id, { status: 'REJECTED', rejectionReason: reason });
      // Navigate back without alert() — alert() is blocked in Android WebView/Capacitor
      navigate('leads');
    } catch (_) {
      setError('Failed to reject lead. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F5F6FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px' }}>
        <button onClick={() => navigate('journey', lead)} style={{ width: 36, height: 36, borderRadius: 18, background: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 18 }}>←</button>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#003366' }}>Reject Lead</span>
      </div>

      <div style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
        {/* Lead identity + warning */}
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>{lead.name}</div>
          <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>Rejecting this lead is permanent and cannot be undone.</div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Select a rejection reason *</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {REASONS.map(r => (
            <button
              key={r}
              onClick={() => { setReason(r); setError(''); }}
              style={{
                padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                border: `2px solid ${reason === r ? '#EF4444' : '#E5E7EB'}`,
                background: reason === r ? '#FEF2F2' : '#fff',
                cursor: 'pointer', fontSize: 14,
                color: reason === r ? '#EF4444' : '#374151',
                fontWeight: reason === r ? 600 : 400,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Inline error — no alert() */}
        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#B91C1C' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Confirm button: red when enabled, grey when not */}
        <button
          onClick={handleConfirm}
          disabled={!reason || saving}
          style={{
            padding: 14, borderRadius: 40, fontSize: 15, fontWeight: 700,
            cursor: reason && !saving ? 'pointer' : 'not-allowed',
            background: !reason || saving ? '#9CA3AF' : '#EF4444',
            border: 'none', color: '#fff',
          }}
        >
          {saving ? 'Rejecting…' : 'Confirm Rejection'}
        </button>
        <button
          onClick={() => navigate('journey', lead)}
          style={{ padding: 14, borderRadius: 40, background: '#fff', border: `1.5px solid ${c.border}`, color: '#374151', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
