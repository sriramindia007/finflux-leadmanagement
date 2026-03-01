import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function StatusPill({ created, duplicates, failed }) {
  if (failed === 0 && duplicates === 0) return <span style={p.success}>✓ All Created</span>;
  if (created === 0) return <span style={p.error}>✗ All Failed</span>;
  return <span style={p.partial}>⚠ Partial</span>;
}

export default function BulkUploadMonitorPage() {
  const navigate = useNavigate();
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null); // jobId of expanded row
  const [detail, setDetail]     = useState({});   // jobId → full job with errors

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getBulkUploads();
      setJobs(data);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (jobId) => {
    if (expanded === jobId) { setExpanded(null); return; }
    setExpanded(jobId);
    if (!detail[jobId]) {
      try {
        const d = await api.getBulkUploadJob(jobId);
        setDetail(prev => ({ ...prev, [jobId]: d }));
      } catch (_) {}
    }
  };

  const downloadErrors = (job) => {
    const fullJob = detail[job.jobId];
    if (!fullJob?.errors?.length) return;
    const rows = ['Row,Mobile,Reason', ...fullJob.errors.map(e => `${e.row},${e.mobile || ''},${e.reason}`)].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `errors-${job.jobId.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/leads')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#003366' }}>←</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#003366' }}>Bulk Upload Monitor</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Track all CSV upload jobs, success and failure records</p>
        </div>
        <button onClick={load} disabled={loading} style={{ marginLeft: 'auto', padding: '7px 14px', border: '1px solid #CFD6DD', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', opacity: loading ? 0.6 : 1 }}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading jobs…</div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No upload jobs yet</div>
          <div style={{ fontSize: 13 }}>Upload a CSV from the Leads Pool page to see jobs here</div>
          <button onClick={() => navigate('/leads')} style={{ marginTop: 16, padding: '8px 20px', background: '#1874D0', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Go to Leads Pool
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 90px 80px 80px 80px 80px auto', gap: 0, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <span>Uploaded At</span>
            <span>Total Rows</span>
            <span style={{ color: '#059669' }}>Created</span>
            <span style={{ color: '#D97706' }}>Duplicates</span>
            <span style={{ color: '#DC2626' }}>Failed</span>
            <span>Status</span>
            <span></span>
          </div>

          {jobs.map((job, idx) => {
            const isOpen = expanded === job.jobId;
            const jobDetail = detail[job.jobId];
            return (
              <div key={job.jobId} style={{ borderBottom: idx < jobs.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                {/* Main row */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: '180px 90px 80px 80px 80px 80px auto', gap: 0, padding: '12px 16px', alignItems: 'center', cursor: job.errorCount > 0 ? 'pointer' : 'default', background: isOpen ? '#F5F8FF' : '#fff' }}
                  onClick={() => job.errorCount > 0 && toggleExpand(job.jobId)}
                >
                  <div>
                    <div style={{ fontSize: 13, color: '#1F2937' }}>{fmt(job.uploadedAt)}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, fontFamily: 'monospace' }}>{job.jobId.slice(0, 8)}…</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{job.totalRows}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>{job.created}</span>
                  <span style={{ fontSize: 14, fontWeight: job.duplicates > 0 ? 700 : 400, color: job.duplicates > 0 ? '#D97706' : '#9CA3AF' }}>{job.duplicates}</span>
                  <span style={{ fontSize: 14, fontWeight: job.failed > 0 ? 700 : 400, color: job.failed > 0 ? '#DC2626' : '#9CA3AF' }}>{job.failed}</span>
                  <StatusPill created={job.created} duplicates={job.duplicates} failed={job.failed} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {job.errorCount > 0 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpand(job.jobId); }}
                          style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #BFDBFE', borderRadius: 4, background: '#EFF6FF', color: '#1874D0', cursor: 'pointer' }}
                        >
                          {isOpen ? 'Hide' : `View ${job.errorCount} issue${job.errorCount !== 1 ? 's' : ''}`}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadErrors(job); }}
                          style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #D1FAE5', borderRadius: 4, background: '#ECFDF5', color: '#059669', cursor: 'pointer' }}
                          title="Download error report as CSV"
                        >
                          ⬇ CSV
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded error detail */}
                {isOpen && (
                  <div style={{ background: '#FAFAFA', borderTop: '1px solid #EEF2FF', padding: '0 16px 16px' }}>
                    {!jobDetail ? (
                      <div style={{ padding: '16px 0', color: '#9CA3AF', fontSize: 13 }}>Loading details…</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', padding: '12px 0 8px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          Issues ({jobDetail.errors?.length || 0} rows)
                        </div>
                        <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: '#F9FAFB' }}>
                                <th style={t.th}>Row #</th>
                                <th style={t.th}>Mobile</th>
                                <th style={t.th}>Reason</th>
                                <th style={t.th}>Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(jobDetail.errors || []).map((err, i) => {
                                const isDup = err.reason.toLowerCase().startsWith('duplicate');
                                const isValidation = !isDup;
                                return (
                                  <tr key={i} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                    <td style={t.td}>{err.row}</td>
                                    <td style={{ ...t.td, fontFamily: 'monospace' }}>{err.mobile || '—'}</td>
                                    <td style={{ ...t.td, color: isDup ? '#D97706' : '#DC2626' }}>{err.reason}</td>
                                    <td style={t.td}>
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: isDup ? '#FEF3C7' : '#FEF2F2', color: isDup ? '#D97706' : '#DC2626', border: `1px solid ${isDup ? '#FDE68A' : '#FECACA'}` }}>
                                        {isDup ? 'Duplicate' : 'Validation'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const p = {
  success: { fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' },
  error:   { fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
  partial: { fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' },
};

const t = {
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.3 },
  td: { padding: '8px 12px', color: '#374151', verticalAlign: 'middle' },
};
