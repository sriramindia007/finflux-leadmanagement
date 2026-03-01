import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import SourceBadge from '../components/SourceBadge';
import NewLeadDrawer from '../components/NewLeadDrawer';
import BulkUploadModal from '../components/BulkUploadModal';
import { api } from '../services/api';

const STATUS_FILTERS = ['ALL', 'APPROVAL_PENDING', 'QUALIFIED', 'REJECTED', 'CONVERTED', 'NOT_CONVERTED'];
const STATUS_LABELS  = { ALL: 'All', APPROVAL_PENDING: 'Approval Pending', QUALIFIED: 'Qualified', REJECTED: 'Rejected', CONVERTED: 'Converted', NOT_CONVERTED: 'Not Converted' };
const FO_LIST = ['Ravi Kumar', 'Jagan Reddy', 'Sameer Khan', 'Amul Sharma', 'Gopal Nair', 'Mohan Das'];
const SLA_BREACH_DAYS = 7; // leads older than this with active status = SLA breach

const BRANCH_MAP = {
  'Bengaluru South':   { villages: ['Jayanagar'],  centres: { Jayanagar:  ['Jayanagar C2'] } },
  'Bengaluru North':   { villages: ['Banaswadi'],  centres: { Banaswadi:  ['Banaswadi C1'] } },
  'Guntur':            { villages: ['Brodipet'],   centres: { Brodipet:   ['Brodipet C1'] } },
  'Dharwad':           { villages: ['Vidyanagar'], centres: { Vidyanagar: ['Vidyanagar C1'] } },
  'HQ':                { villages: [], centres: {} },
  'Hyderabad Central': { villages: [], centres: {} },
};
const ALL_BRANCHES   = Object.keys(BRANCH_MAP);
const EMPTY_FILTERS  = { branch: '', village: '', centre: '', leadType: '', source: '', assignee: '', dateFrom: '', dateTo: '' };
const ACTIVE_STATUSES = new Set(['APPROVAL_PENDING', 'QUALIFIED']);

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '\n' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function agingDays(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso)) / 86400000);
}
function isSLABreach(lead) {
  return ACTIVE_STATUSES.has(lead.status) && agingDays(lead.createdAt) > SLA_BREACH_DAYS;
}

function AgingBadge({ createdAt, isBreached }) {
  const days = agingDays(createdAt);
  if (days === null) return <span style={{ color: '#CFD6DD' }}>—</span>;
  const { bg, color, border } = days <= 3
    ? { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' }
    : days <= 7
    ? { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' }
    : { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: bg, color, border: `1px solid ${border}` }}>
      {isBreached ? '⚠ ' : ''}{days}d
    </span>
  );
}

// ── Bulk Assign Modal ────────────────────────────────────────────
function BulkAssignModal({ count, workload, onConfirm, onClose, saving }) {
  const [selected, setSelected] = useState('');
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: 420, zIndex: 301, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#1874D0,#003366)', padding: '18px 24px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Bulk Assign — {count} Lead{count !== 1 ? 's' : ''}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Select a field officer to assign the selected leads</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
          {FO_LIST.map(fo => {
            const load = workload[fo] || 0;
            const isSelected = selected === fo;
            const overloaded = load >= 15;
            return (
              <button key={fo} onClick={() => setSelected(fo)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: `2px solid ${isSelected ? '#1874D0' : '#E5E7EB'}`, background: isSelected ? '#EFF6FF' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isSelected ? '#1874D0' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: isSelected ? '#fff' : '#6B7280', flexShrink: 0 }}>
                  {fo.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: '#003366' }}>{fo}</div>
                  <div style={{ fontSize: 11, color: overloaded ? '#DC2626' : '#6B7280', marginTop: 1 }}>
                    {load} active lead{load !== 1 ? 's' : ''} {overloaded ? '⚠ High load' : ''}
                  </div>
                </div>
                {isSelected && <span style={{ color: '#1874D0', fontSize: 18 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #CFD6DD', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onConfirm(selected)} disabled={!selected || saving} style={{ padding: '8px 20px', border: 'none', borderRadius: 4, background: !selected || saving ? '#9CA3AF' : '#1874D0', color: '#fff', cursor: !selected || saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
            {saving ? 'Assigning…' : `Assign ${count} Lead${count !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </>
  );
}

export default function LeadsPoolPage({ user }) {
  const navigate = useNavigate();
  const [leads, setLeads]               = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading]           = useState(true);
  const [showNewLead, setShowNewLead]   = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [page, setPage]                 = useState(1);
  const [hoveredRow, setHoveredRow]     = useState(null);
  const [showFilter, setShowFilter]     = useState(true);
  const [filters, setFilters]           = useState(EMPTY_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch]             = useState('');
  // Bulk select
  const [selected, setSelected]         = useState(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [workload, setWorkload]         = useState({});
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const PER_PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getLeads({});
      setLeads(data);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [statusFilter]);

  // Load workload when bulk assign modal opens
  useEffect(() => {
    if (showBulkAssign) api.getWorkload().then(setWorkload).catch(() => {});
  }, [showBulkAssign]);

  // Cascading filter options
  const pVillages = pendingFilters.branch ? (BRANCH_MAP[pendingFilters.branch]?.villages || []) : [];
  const pCentres  = (pendingFilters.branch && pendingFilters.village)
    ? (BRANCH_MAP[pendingFilters.branch]?.centres?.[pendingFilters.village] || []) : [];

  const uniqueAssignees = useMemo(() => [...new Set(leads.map(l => l.assignedTo).filter(Boolean))].sort(), [leads]);
  const uniqueSources   = useMemo(() => [...new Set(leads.map(l => l.source || l.leadSource).filter(Boolean))].sort(), [leads]);
  const uniqueTypes     = useMemo(() => [...new Set(leads.map(l => l.leadType).filter(Boolean))].sort(), [leads]);

  const setPending = (k, v) => setPendingFilters(f => ({ ...f, [k]: v,
    ...(k === 'branch'  ? { village: '', centre: '' } : {}),
    ...(k === 'village' ? { centre: '' } : {}),
  }));

  const activeCount   = Object.values(filters).filter(Boolean).length;
  const applyFilters  = () => { setFilters(pendingFilters); setShowFilter(false); setPage(1); };
  const clearFilters  = () => { setFilters(EMPTY_FILTERS); setPendingFilters(EMPTY_FILTERS); setPage(1); };

  const countByStatus = useMemo(() => {
    const map = {};
    STATUS_FILTERS.forEach(f => { map[f] = 0; });
    leads.forEach(l => {
      map['ALL']++;
      if (map[l.status] !== undefined) map[l.status]++;
    });
    return map;
  }, [leads]);

  const slaBreachCount = useMemo(() => leads.filter(isSLABreach).length, [leads]);

  const filtered = useMemo(() => leads.filter(l => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (filters.branch   && (l.branch || l.office) !== filters.branch) return false;
    if (filters.village  && l.village !== filters.village) return false;
    if (filters.centre   && (l.centre || l.center) !== filters.centre) return false;
    if (filters.leadType && l.leadType !== filters.leadType) return false;
    if (filters.source   && (l.source || l.leadSource) !== filters.source) return false;
    if (filters.assignee && l.assignedTo !== filters.assignee) return false;
    if (filters.dateFrom && new Date(l.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo   && new Date(l.createdAt) > new Date(filters.dateTo + 'T23:59:59')) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!(l.name || '').toLowerCase().includes(q) &&
          !(l.mobile || l.phone || '').toLowerCase().includes(q) &&
          !(l.id || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [leads, statusFilter, filters, search]);

  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // Bulk select helpers
  const pageIds       = paged.map(l => l.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const someSelected    = selected.size > 0;

  const toggleRow = (id, e) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (allPageSelected) setSelected(prev => { const n = new Set(prev); pageIds.forEach(id => n.delete(id)); return n; });
    else setSelected(prev => { const n = new Set(prev); pageIds.forEach(id => n.add(id)); return n; });
  };

  const handleBulkAssign = async (foName) => {
    setBulkAssigning(true);
    try {
      await Promise.all([...selected].map(id => api.updateLead(id, { assignedTo: foName })));
      setSelected(new Set());
      setShowBulkAssign(false);
      await load();
    } finally { setBulkAssigning(false); }
  };

  const TABLE_COLS = ['', 'Created On', 'Lead ID', 'Customer Name', 'Mobile', 'Lead Type', 'Source', 'Branch / Village / Centre', 'Field Officer', 'Aging', 'Status', ''];

  return (
    <div style={s.page}>
      {/* Type Tabs */}
      <div style={s.typeTabs}>
        <button style={{ ...s.typeTab, ...s.typeTabActive }}>Leads Pool</button>
        <span style={{ color: '#CFD6DD', fontSize: 18 }}>›</span>
        <button style={s.typeTab}>Loan Applications</button>
      </div>

      {/* SLA Breach Alert Banner */}
      {slaBreachCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>{slaBreachCount} lead{slaBreachCount !== 1 ? 's' : ''} breached 7-day SLA</span>
            <span style={{ fontSize: 13, color: '#B91C1C', marginLeft: 8 }}>— active leads with no resolution for over a week</span>
          </div>
          <button onClick={() => { setStatusFilter('ALL'); setFilters(EMPTY_FILTERS); }} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            View All
          </button>
        </div>
      )}

      {/* Status Pills + Actions */}
      <div style={s.filterRow}>
        <div style={s.filterPills}>
          {STATUS_FILTERS.map(f => {
            const cnt = countByStatus[f] ?? 0;
            const isActive = statusFilter === f;
            return (
              <button key={f} style={{ ...s.pill, ...(isActive ? s.pillActive : {}) }} onClick={() => { setStatusFilter(f); setPage(1); }}>
                {STATUS_LABELS[f]}
                {cnt > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: isActive ? '#1874D0' : '#E5E7EB', color: isActive ? '#fff' : '#6B7280', lineHeight: 1.6, display: 'inline-block' }}>{cnt}</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ ...s.filterBtn, ...(activeCount > 0 ? { borderColor: '#1874D0', color: '#1874D0', background: '#EBF5FF' } : {}) }}
            onClick={() => { setPendingFilters(filters); setShowFilter(f => !f); }}>
            ⊟ Filter{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          {activeCount > 0 && (
            <button onClick={clearFilters} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>
          )}
          <button style={s.bulkBtn} onClick={() => navigate('/bulk-uploads')}>📋 Upload Monitor</button>
          <button style={s.bulkBtn} onClick={() => setShowBulkUpload(true)}>⬆ Bulk Upload</button>
          <button style={s.newLeadBtn} onClick={() => setShowNewLead(true)}>+ New Lead</button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div style={{ background: '#F8FAFF', border: '1px solid #DBEAFE', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
            {[
              { label: 'Branch',       key: 'branch',   type: 'select', opts: ALL_BRANCHES,    placeholder: 'All Branches',  disabled: false },
              { label: 'Village',      key: 'village',  type: 'select', opts: pVillages,       placeholder: 'All Villages',  disabled: !pendingFilters.branch || pVillages.length === 0 },
              { label: 'Centre',       key: 'centre',   type: 'select', opts: pCentres,        placeholder: 'All Centres',   disabled: !pendingFilters.village || pCentres.length === 0 },
              { label: 'Field Officer',key: 'assignee', type: 'select', opts: uniqueAssignees, placeholder: 'All Officers',  disabled: false },
              { label: 'Lead Type',    key: 'leadType', type: 'select', opts: uniqueTypes,     placeholder: 'All Types',     disabled: false },
              { label: 'Source',       key: 'source',   type: 'select', opts: uniqueSources,   placeholder: 'All Sources',   disabled: false },
            ].map(({ label, key, opts, placeholder, disabled }) => (
              <div key={key}>
                <label style={s.flabel}>{label}</label>
                <select style={s.fselect} value={pendingFilters[key]} onChange={e => setPending(key, e.target.value)} disabled={disabled}>
                  <option value="">{placeholder}</option>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label style={s.flabel}>Created From</label>
              <input type="date" style={s.fselect} value={pendingFilters.dateFrom} onChange={e => setPending('dateFrom', e.target.value)} />
            </div>
            <div>
              <label style={s.flabel}>Created To</label>
              <input type="date" style={s.fselect} value={pendingFilters.dateTo} onChange={e => setPending('dateTo', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => { setShowFilter(false); setPendingFilters(filters); }} style={s.btnGhost}>Cancel</button>
            <button onClick={clearFilters} style={{ ...s.btnGhost, color: '#EF4444', borderColor: '#EF4444' }}>Clear All</button>
            <button onClick={applyFilters} style={s.btnPrimary}>Apply Filters</button>
          </div>
        </div>
      )}

      {/* Search + Bulk Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Search by name, mobile, or lead ID…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={s.searchInput}
        />
        {someSelected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: '#1874D0', fontWeight: 600 }}>{selected.size} selected</span>
            <button onClick={() => setShowBulkAssign(true)} style={{ padding: '5px 12px', background: '#1874D0', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Assign to Officer
            </button>
            <button onClick={() => setSelected(new Set())} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Clear</button>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
        {loading ? 'Loading…' : `${filtered.length}${filtered.length !== leads.length ? ` of ${leads.length}` : ''} lead${filtered.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {/* Checkbox header */}
              <th style={{ ...s.th, width: 36, textAlign: 'center' }}>
                <input type="checkbox" checked={allPageSelected} onChange={toggleAll} style={{ cursor: 'pointer' }} />
              </th>
              {TABLE_COLS.slice(1).map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={TABLE_COLS.length} style={s.emptyCell}>Loading…</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={TABLE_COLS.length} style={s.emptyCell}>No leads found</td></tr>
            ) : paged.map(lead => {
              const breached   = isSLABreach(lead);
              const isSelected = selected.has(lead.id);
              const rowBg      = isSelected ? '#EFF6FF' : hoveredRow === lead.id ? '#F5F8FF' : breached ? '#FFFBFB' : '#fff';
              return (
                <tr
                  key={lead.id}
                  style={{ ...s.tr, background: rowBg, borderLeft: breached ? '3px solid #FCA5A5' : '3px solid transparent' }}
                  onMouseEnter={() => setHoveredRow(lead.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  {/* Checkbox */}
                  <td style={{ ...s.td, textAlign: 'center', width: 36 }} onClick={e => toggleRow(lead.id, e)}>
                    <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={s.td}><span style={{ whiteSpace: 'pre-line', fontSize: 12, color: '#6B7280' }}>{fmt(lead.createdAt)}</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>{lead.id}</span></td>
                  <td style={{ ...s.td, fontWeight: 600, color: '#003366', minWidth: 130 }}>{lead.name}</td>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{lead.mobile || lead.phone || <span style={{ color: '#CFD6DD' }}>—</span>}</td>
                  <td style={s.td}>
                    {lead.leadType ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#EDE9FE', color: '#7C3AED', fontWeight: 600 }}>{lead.leadType}</span> : <span style={{ color: '#CFD6DD' }}>—</span>}
                  </td>
                  <td style={s.td}>
                    {(lead.source || lead.leadSource)
                      ? <SourceBadge source={lead.source || lead.leadSource} small />
                      : <span style={{ color: '#CFD6DD' }}>—</span>}
                  </td>
                  <td style={{ ...s.td, minWidth: 160 }}>
                    {(lead.branch || lead.office) ? (
                      <div style={{ lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#1F2937' }}>{lead.branch || lead.office}</div>
                        {lead.village && <div style={{ fontSize: 11, color: '#6B7280' }}>📍 {lead.village}</div>}
                        {(lead.centre || lead.center) && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{lead.centre || lead.center}</div>}
                      </div>
                    ) : <span style={{ color: '#CFD6DD' }}>—</span>}
                  </td>
                  <td style={s.td}>
                    {lead.assignedTo
                      ? <span style={{ fontSize: 12, fontWeight: 500 }}>{lead.assignedTo}</span>
                      : <span style={{ fontSize: 12, color: '#F59E0B', fontStyle: 'italic' }}>Unassigned</span>}
                    {lead.createdBy && lead.createdByRole === 'Field Officer' && lead.createdBy !== lead.assignedTo && (
                      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>📱 Created by {lead.createdBy}</div>
                    )}
                  </td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    <AgingBadge createdAt={lead.createdAt} isBreached={breached} />
                  </td>
                  <td style={s.td}><StatusBadge status={lead.status} small /></td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    {lead.isCorrection && (
                      <span title={`Correction: ${lead.correctionNote || 'Hub review required'}`} style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7', borderRadius: 999, padding: '2px 8px', border: '1px solid #F59E0B', whiteSpace: 'nowrap' }}>⚠ Correction</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={s.pagination}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          {filtered.length === 0 ? '0 leads' : `${(page-1)*PER_PAGE+1}–${Math.min(page*PER_PAGE, filtered.length)} of ${filtered.length} leads`}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={s.pageBtn} onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button style={s.pageBtn} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>‹</button>
          <span style={{ padding: '4px 10px', fontSize: 13, color: '#374151' }}>{page} / {totalPages || 1}</span>
          <button style={s.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}>›</button>
          <button style={s.pageBtn} onClick={() => setPage(totalPages)} disabled={page >= totalPages}>»</button>
        </div>
      </div>

      {showNewLead && <NewLeadDrawer user={user} onClose={() => setShowNewLead(false)} onCreated={() => { setShowNewLead(false); load(); }} />}
      {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} onUploaded={load} />}
      {showBulkAssign && (
        <BulkAssignModal count={selected.size} workload={workload} onConfirm={handleBulkAssign} onClose={() => setShowBulkAssign(false)} saving={bulkAssigning} />
      )}
    </div>
  );
}

const s = {
  page: { padding: '20px 24px', maxWidth: 1400, margin: '0 auto' },
  typeTabs: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  typeTab: { background: 'none', border: 'none', fontSize: 14, color: '#6B7280', cursor: 'pointer', padding: '4px 8px' },
  typeTabActive: { color: '#1874D0', fontWeight: 600, borderBottom: '2px solid #1874D0' },
  filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  filterPills: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill: { padding: '5px 14px', borderRadius: 999, border: '1px solid #CFD6DD', background: '#fff', fontSize: 13, color: '#6B7280', cursor: 'pointer', fontWeight: 400 },
  pillActive: { background: '#EBF5FF', color: '#1874D0', borderColor: '#1874D0', fontWeight: 600 },
  filterBtn: { padding: '7px 14px', border: '1px solid #CFD6DD', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' },
  bulkBtn: { padding: '7px 14px', border: '1px solid #1874D0', borderRadius: 6, background: '#fff', color: '#1874D0', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  newLeadBtn: { padding: '7px 16px', border: 'none', borderRadius: 6, background: '#1874D0', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  searchInput: { flex: 1, maxWidth: 400, padding: '8px 14px', border: '1px solid #CFD6DD', borderRadius: 8, fontSize: 13, color: '#003366', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' },
  tableWrap: { background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 1150 },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', whiteSpace: 'nowrap' },
  tr: { cursor: 'pointer', transition: 'background 0.12s' },
  td: { padding: '11px 12px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' },
  emptyCell: { textAlign: 'center', padding: 48, color: '#9CA3AF' },
  pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 14 },
  pageBtn: { padding: '4px 10px', border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280' },
  flabel: { fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 },
  fselect: { width: '100%', padding: '6px 10px', border: '1px solid #CFD6DD', borderRadius: 6, fontSize: 13, color: '#003366', background: '#fff', outline: 'none' },
  btnGhost: { padding: '6px 16px', border: '1px solid #CFD6DD', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' },
  btnPrimary: { padding: '6px 20px', border: 'none', borderRadius: 6, background: '#1874D0', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};
