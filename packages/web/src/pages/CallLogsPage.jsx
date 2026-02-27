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

  // Sort oldest-first, then reverse for display (newest first)
  const sorted = [...(lead.callLogs || [])].sort((a, b) => new Date(a.calledAt) - new Date(b.calledAt));
  const logs = [...sorted].reverse();

  // A followUpAt is resolved if a subsequent log has calledAt >= followUpAt date
  const isFollowUpResolved = (log) => {
    if (!log.followUpAt) return null; // no follow-up set
    const due = new Date(log.followUpAt);
    return sorted.some(l => l !== log && new Date(l.calledAt) >= due);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#003366' }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: 0 }}>Call Logs</h2>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>— {lead.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{logs.length} log{logs.length !== 1 ? 's' : ''}</span>
      </div>

      {logs.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 60, color: '#9CA3AF' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📞</div>
          <div style={{ fontSize: 14 }}>No call logs yet</div>
        </div>
      )}

      {logs.map((log, i) => {
        const resolved = isFollowUpResolved(log);
        return (
          <div key={log.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: `4px solid ${log.customerPickedUp ? '#1874D0' : '#E5E7EB'}`, borderRadius: 8, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#003366' }}>Call {logs.length - i}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {log.leadTemp && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: log.leadTemp === 'Hot' ? '#FEF3C7' : '#F1F3F4', color: log.leadTemp === 'Hot' ? '#92400E' : '#6B7280' }}>
                    {log.leadTemp}
                  </span>
                )}
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: log.customerPickedUp ? '#D1FAE5' : '#FEE2E2', color: log.customerPickedUp ? '#065F46' : '#991B1B' }}>
                  {log.customerPickedUp ? 'Picked up' : 'No answer'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
              <Row label="Called on" value={new Date(log.calledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} />
              {log.notes && <Row label="Notes" value={log.notes} span />}
            </div>

            {log.followUpAt && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{resolved ? '✅' : new Date(log.followUpAt) > new Date() ? '📅' : '⏰'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: resolved ? '#065F46' : new Date(log.followUpAt) > new Date() ? '#1E40AF' : '#92400E' }}>
                    {resolved ? 'Follow-up completed' : new Date(log.followUpAt) > new Date() ? 'Follow-up scheduled' : 'Follow-up overdue'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
                    {new Date(log.followUpAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value, span }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
