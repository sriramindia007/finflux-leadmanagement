import React, { useState } from 'react';
import { c } from '../theme';
import { api } from '../services/api';

const REASONS = ['Low Credit Score','Insufficient Income','Already Has Loan','Invalid Documents','Ineligible Area','Customer Declined','Other'];

export default function RejectionScreen({ navigate, lead }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!reason) { alert('Please select a rejection reason.'); return; }
    setSaving(true);
    try {
      await api.updateLead(lead.id, { status:'REJECTED', rejectionReason:reason });
      alert(`${lead.name}'s lead has been rejected.`);
      navigate('leads');
    } catch (_) { alert('Failed — is the API running?'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#F5F6FA' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 16px 16px' }}>
        <button onClick={() => navigate('journey', lead)} style={{ width:36, height:36, borderRadius:18, background:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', fontSize:18 }}>←</button>
        <span style={{ fontSize:18, fontWeight:700, color:'#003366' }}>Rejection Reasons</span>
      </div>

      <div style={{ flex:1, padding:'0 16px' }}>
        <p style={{ fontSize:15, color:'#003366', fontWeight:500, marginBottom:4 }}>Are you sure to reject this lead?</p>
        <p style={{ fontSize:15, color:'#003366', marginBottom:20 }}>This action cannot be undone.</p>

        <select value={reason} onChange={e=>setReason(e.target.value)} style={{ width:'100%', padding:'14px 16px', border:'1px solid #CFD6DD', borderRadius:12, fontSize:15, color: reason ? '#003366' : '#9CA3AF', outline:'none', background:'#fff', appearance:'none', cursor:'pointer' }}>
          <option value="">Rejection reason</option>
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={handleConfirm} disabled={!reason || saving} style={{ padding:14, borderRadius:40, background:'#fff', border:'1px solid #CFD6DD', color: reason ? '#374151' : '#9CA3AF', fontSize:15, fontWeight:600, cursor: reason ? 'pointer' : 'not-allowed' }}>
          {saving ? 'Confirming...' : 'Confirm'}
        </button>
        <button onClick={() => navigate('journey', lead)} style={{ padding:14, borderRadius:40, background:'#2196F3', border:'none', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          Go back
        </button>
      </div>
    </div>
  );
}
