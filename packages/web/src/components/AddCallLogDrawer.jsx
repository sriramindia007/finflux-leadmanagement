import React, { useState } from 'react';
import { api } from '../services/api';

export default function AddCallLogDrawer({ leadId, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ date: today, time: '10:00', ampm: 'AM', customerPickedUp: null, leadTemp: null, notes: '', followUpDate: '', followUpTime: '' });
  const [saving, setSaving] = useState(false);
  const [followUpError, setFollowUpError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFollowUpDate = (v) => {
    set('followUpDate', v);
    if (v && v < today) setFollowUpError('Follow-up date cannot be in the past');
    else setFollowUpError('');
  };

  const handleSave = async () => {
    if (form.followUpDate && form.followUpDate < today) {
      setFollowUpError('Follow-up date cannot be in the past');
      return;
    }
    setSaving(true);
    try {
      await api.addCallLog(leadId, {
        customerPickedUp: form.customerPickedUp === 'yes',
        leadTemp: form.leadTemp,
        notes: form.notes,
        followUpAt: form.followUpDate ? `${form.followUpDate}T${form.followUpTime || '10:00'}:00Z` : null,
      });
      onSaved();
    } catch (_) {} finally { setSaving(false); }
  };

  const radioStyle = (active) => ({ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 14px', borderRadius: 999, border: `1.5px solid ${active ? '#1874D0' : '#CFD6DD'}`, background: active ? '#EBF5FF' : '#fff', fontSize: 13, color: active ? '#1874D0' : '#374151', fontWeight: active ? 600 : 400 });
  const inputStyle = { padding: '8px 12px', border: '1px solid #CFD6DD', borderRadius: 4, fontSize: 14, color: '#003366', outline: 'none', background: '#fff' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: '#fff', zIndex: 301, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#003366' }}>Add a call log</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" style={{ ...inputStyle, width: '100%' }} value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Time</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input type="time" style={{ ...inputStyle, flex: 1 }} value={form.time} onChange={e => set('time', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Did customer pickup */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>Did the customer pickup the call?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={radioStyle(form.customerPickedUp === 'yes')} onClick={() => set('customerPickedUp', 'yes')}>● Yes</button>
              <button style={radioStyle(form.customerPickedUp === 'no')} onClick={() => set('customerPickedUp', 'no')}>● No</button>
            </div>
          </div>

          {/* Lead temp */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>Which type of lead is this?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={radioStyle(form.leadTemp === 'Hot')} onClick={() => set('leadTemp', 'Hot')}>● Hot</button>
              <button style={radioStyle(form.leadTemp === 'Cold')} onClick={() => set('leadTemp', 'Cold')}>● Cold</button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea style={{ ...inputStyle, width: '100%', minHeight: 80, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Call summary..." />
          </div>

          {/* Follow-up */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #1874D0', paddingLeft: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1874D0' }}>Follow-up</span>
              <button onClick={() => set('showFollowup', !form.showFollowup)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#1874D0' }}>+</button>
            </div>
            {form.showFollowup && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Follow-up Date</label>
                  <input type="date" min={today} style={{ ...inputStyle, width: '100%', borderColor: followUpError ? '#EF4444' : '#CFD6DD' }} value={form.followUpDate} onChange={e => handleFollowUpDate(e.target.value)} />
                  {followUpError && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2, display: 'block' }}>{followUpError}</span>}
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Follow-up Time</label>
                  <input type="time" style={{ ...inputStyle, width: '100%' }} value={form.followUpTime} onChange={e => set('followUpTime', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #CFD6DD', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', border: 'none', borderRadius: 4, background: saving ? '#9CA3AF' : '#1874D0', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}
