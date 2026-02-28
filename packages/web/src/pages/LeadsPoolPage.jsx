import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import NewLeadDrawer from '../components/NewLeadDrawer';
import BulkUploadModal from '../components/BulkUploadModal';
import { api } from '../services/api';

const STATUS_FILTERS = ['ALL', 'APPROVAL_PENDING', 'QUALIFIED', 'REJECTED', 'CONVERTED', 'NOT_CONVERTED'];
const STATUS_LABELS = { ALL: 'All', APPROVAL_PENDING: 'Approval Pending', QUALIFIED: 'Qualified', REJECTED: 'Rejected', CONVERTED: 'Converted', NOT_CONVERTED: 'Not Converted' };

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '\n' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function LeadsPoolPage({ user }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [page, setPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);
  const PER_PAGE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const { data } = await api.getLeads(params);
      setLeads(data);
    } catch (_) {} finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); setPage(1); }, [load]);

  const paged = leads.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(leads.length / PER_PAGE);

  return (
    <div style={s.page}>
      {/* Type Tabs */}
      <div style={s.typeTabs}>
        <button style={{ ...s.typeTab, ...s.typeTabActive }}>Leads Pool</button>
        <span style={{ color: '#CFD6DD', fontSize: 18 }}>›</span>
        <button style={s.typeTab}>Loan Applications</button>
      </div>

      {/* Status Filter Pills */}
      <div style={s.filterRow}>
        <div style={s.filterPills}>
          {STATUS_FILTERS.map(f => (
            <button key={f} style={{ ...s.pill, ...(statusFilter === f ? s.pillActive : {}) }} onClick={() => setStatusFilter(f)}>
              {STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={s.filterBtn}>⊟ Filter</button>
          <button style={s.bulkBtn} onClick={() => setShowBulkUpload(true)}>⬆ Bulk Upload</button>
          <button style={s.newLeadBtn} onClick={() => setShowNewLead(true)}>+ New Lead</button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
        {loading ? 'Loading...' : `${leads.length} lead${leads.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Created on','Created by','Source','Lead ID','Customer Name','Branch','State','Assignee','Status'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Loading...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>No leads found</td></tr>
            ) : paged.map(lead => (
              <tr
                key={lead.id}
                style={{ ...s.tr, background: hoveredRow === lead.id ? '#F0F5FF' : '#fff' }}
                onMouseEnter={() => setHoveredRow(lead.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => navigate(`/leads/${lead.id}`)}
                title="Click to view lead"
              >
                <td style={s.td}><span style={{ whiteSpace: 'pre-line', fontSize: 12, color: '#6B7280' }}>{fmt(lead.createdAt)}</span></td>
                <td style={s.td}>{lead.createdBy}</td>
                <td style={s.td}>{lead.source || '—'}</td>
                <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>{lead.id}</span></td>
                <td style={{ ...s.td, fontWeight: 600, color: '#003366' }}>{lead.name}</td>
                <td style={s.td}>
                  {lead.branch || lead.office ? (
                    <div>
                      <div style={{ fontWeight: 500, color: '#374151', fontSize: 12 }}>{lead.branch || lead.office}</div>
                      {lead.centre || lead.center ? <div style={{ fontSize: 11, color: '#9CA3AF' }}>{lead.centre || lead.center}</div> : null}
                    </div>
                  ) : <span style={{ color: '#CFD6DD' }}>—</span>}
                </td>
                <td style={s.td}>{lead.state || '—'}</td>
                <td style={s.td}>{lead.assignedTo || <span style={{ color: '#CFD6DD' }}>Unassigned</span>}</td>
                <td style={s.td}><StatusBadge status={lead.status} small /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={s.pagination}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          Items per page: {PER_PAGE} &nbsp;
          {leads.length === 0 ? '0' : `${(page-1)*PER_PAGE+1}–${Math.min(page*PER_PAGE, leads.length)}`} of {leads.length}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={s.pageBtn} onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button style={s.pageBtn} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>‹</button>
          <button style={s.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages || totalPages === 0}>›</button>
          <button style={s.pageBtn} onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}>»</button>
        </div>
      </div>

      {showNewLead && <NewLeadDrawer user={user} onClose={() => setShowNewLead(false)} onCreated={() => { setShowNewLead(false); load(); }} />}
      {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} onUploaded={() => { load(); }} />}
    </div>
  );
}

const s = {
  page: { padding: '20px 24px', maxWidth: 1200, margin: '0 auto' },
  typeTabs: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  typeTab: { background: 'none', border: 'none', fontSize: 14, color: '#6B7280', cursor: 'pointer', padding: '4px 8px' },
  typeTabActive: { color: '#1874D0', fontWeight: 600, borderBottom: '2px solid #1874D0' },
  filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  filterPills: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill: { padding: '5px 14px', borderRadius: 999, border: '1px solid #CFD6DD', background: '#fff', fontSize: 13, color: '#6B7280', cursor: 'pointer', fontWeight: 400, transition: 'all 0.15s' },
  pillActive: { background: '#EBF5FF', color: '#1874D0', borderColor: '#1874D0', fontWeight: 600 },
  filterBtn: { padding: '7px 14px', border: '1px solid #CFD6DD', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' },
  bulkBtn: { padding: '7px 14px', border: '1px solid #1874D0', borderRadius: 6, background: '#fff', color: '#1874D0', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  newLeadBtn: { padding: '7px 16px', border: 'none', borderRadius: 6, background: '#1874D0', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  tableWrap: { background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' },
  tr: { cursor: 'pointer', transition: 'background 0.12s' },
  td: { padding: '12px 12px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6' },
  pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 14 },
  pageBtn: { padding: '4px 10px', border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280' },
};
