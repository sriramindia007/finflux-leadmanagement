import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function CallLogsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);

  useEffect(() => {
    api.getLead(id).then(setLead).catch(() => {});
  }, [id]);

  if (!lead) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>;

  const logs = [...(lead.callLogs || [])].reverse();

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#003366' }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#003366' }}>Call logs</h2>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>— {lead.name}</span>
      </div>

      {logs.length === 0 && <p style={{ color: '#9CA3AF', textAlign: 'center', paddingTop: 40 }}>No call logs yet</p>}

      {logs.map((log, i) => (
        <div key={log.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: '4px solid #1874D0', borderRadius: 8, padding: '16px 20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#003366', marginBottom: 12 }}>Call {logs.length - i}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            <Row label="Called on" value={new Date(log.calledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} />
            <Row label="Customer picked up call?" value={log.customerPickedUp ? 'Yes' : 'No'} color={log.customerPickedUp ? '#10B981' : '#EF4444'} />
            <Row label="Lead Type" value={log.leadTemp} color={log.leadTemp === 'Hot' ? '#F59E0B' : '#6B7280'} />
            {log.notes && <Row label="Notes" value={log.notes} span />}
            {log.followUpAt && <Row label="Follow-up requested for" value={new Date(log.followUpAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} color="#1874D0" span />}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value, color, span }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: color || '#374151', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
