import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../services/api';

// ── Formatters ───────────────────────────────────────────────────────────────
const fmt    = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtAmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const pct    = (n) => `${Number(n || 0).toFixed(1)}%`;

// ── Branch master ─────────────────────────────────────────────────────────────
const ALL_BRANCHES = ['Bengaluru South', 'Bengaluru North', 'Guntur', 'Dharwad', 'HQ', 'Hyderabad Central'];
const ALL_OFFICERS = ['Ravi Kumar', 'Amul Sharma', 'Gopal Nair', 'Jagan Reddy', 'Mohan Das', 'Sameer Khan'];

// ── Client-side aggregation ──────────────────────────────────────────────────
function aggByMonth(leads) {
  const map = {};
  leads.forEach(l => {
    const m = l.createdAt ? l.createdAt.slice(0, 7) : '—';
    if (!map[m]) map[m] = { month: m, total: 0, pending: 0, qualified: 0, converted: 0, rejected: 0, disbursed: 0 };
    map[m].total++;
    if (l.status === 'APPROVAL_PENDING') map[m].pending++;
    if (l.status === 'QUALIFIED')        map[m].qualified++;
    if (l.status === 'CONVERTED')        map[m].converted++;
    if (l.status === 'REJECTED')         map[m].rejected++;
    if (l.status === 'CONVERTED' && l.loanAmount) map[m].disbursed += Number(l.loanAmount);
  });
  return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
}

function aggBySource(leads) {
  const map = {};
  leads.forEach(l => {
    const s = l.source || l.leadSource || 'Unknown';
    if (!map[s]) map[s] = { source: s, total: 0, converted: 0 };
    map[s].total++;
    if (l.status === 'CONVERTED') map[s].converted++;
  });
  return Object.values(map).map(r => ({ ...r, convRate: r.total ? (r.converted / r.total * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}

function aggByBranch(leads) {
  const map = {};
  leads.forEach(l => {
    const b = l.branch || l.office || 'Unknown';
    if (!map[b]) map[b] = { branch: b, total: 0, converted: 0, rejected: 0, pending: 0, disbursed: 0 };
    map[b].total++;
    if (l.status === 'CONVERTED')        { map[b].converted++; map[b].disbursed += Number(l.loanAmount || 0); }
    if (l.status === 'REJECTED')         map[b].rejected++;
    if (l.status === 'APPROVAL_PENDING') map[b].pending++;
  });
  return Object.values(map).map(r => ({ ...r, convRate: r.total ? (r.converted / r.total * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}

function aggByOfficer(leads) {
  const map = {};
  leads.forEach(l => {
    const o = l.assignedTo || 'Unassigned';
    const b = l.branch || l.office || '';
    if (!map[o]) map[o] = { officer: o, branch: b, total: 0, converted: 0, rejected: 0, disbursed: 0 };
    map[o].total++;
    if (l.status === 'CONVERTED') { map[o].converted++; map[o].disbursed += Number(l.loanAmount || 0); }
    if (l.status === 'REJECTED')  map[o].rejected++;
  });
  return Object.values(map).map(r => ({ ...r, convRate: r.total ? (r.converted / r.total * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}

// ── CSV export helper ─────────────────────────────────────────────────────────
function toCSV(headers, rows) {
  const escape = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','))].join('\n');
}

function downloadCSV(filename, csvText) {
  const BOM = '\uFEFF'; // UTF-8 BOM so Excel opens correctly
  const blob = new Blob([BOM + csvText], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Small UI components ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || '#003366' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Bar({ value, max, color }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ width: `${w}%`, height: '100%', background: color || '#1874D0', borderRadius: 99, transition: 'width 0.4s' }} />
    </div>
  );
}

function SectionTitle({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#003366' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const EMPTY_F = { branch: '', dateFrom: '', dateTo: '', officer: '', status: '', leadType: '', source: '' };

export default function ReportsPage() {
  const [allLeads, setAllLeads]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filters, setFilters]     = useState(EMPTY_F);
  const [pending, setPending]     = useState(EMPTY_F);
  const [showFilter, setShowFilter] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportType, setExportType] = useState('leads');
  const exportRef = useRef();

  // Load ALL leads once
  useEffect(() => {
    api.getLeads()
      .then(r => setAllLeads(r.data || []))
      .catch(() => setError('Failed to load reports. Check API connection.'))
      .finally(() => setLoading(false));
  }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Apply filters
  const filtered = useMemo(() => allLeads.filter(l => {
    if (filters.branch   && (l.branch || l.office) !== filters.branch) return false;
    if (filters.officer  && l.assignedTo !== filters.officer)           return false;
    if (filters.status   && l.status !== filters.status)               return false;
    if (filters.leadType && l.leadType !== filters.leadType)           return false;
    if (filters.source   && (l.source || l.leadSource) !== filters.source) return false;
    if (filters.dateFrom && new Date(l.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo   && new Date(l.createdAt) > new Date(filters.dateTo + 'T23:59:59')) return false;
    return true;
  }), [allLeads, filters]);

  // Aggregations
  const monthly  = useMemo(() => aggByMonth(filtered),   [filtered]);
  const sources  = useMemo(() => aggBySource(filtered),  [filtered]);
  const branches = useMemo(() => aggByBranch(filtered),  [filtered]);
  const officers = useMemo(() => aggByOfficer(filtered), [filtered]);

  // Summary KPIs
  const summary = useMemo(() => ({
    total:          filtered.length,
    approvalPending: filtered.filter(l => l.status === 'APPROVAL_PENDING').length,
    qualified:      filtered.filter(l => l.status === 'QUALIFIED').length,
    converted:      filtered.filter(l => l.status === 'CONVERTED').length,
    rejected:       filtered.filter(l => l.status === 'REJECTED').length,
    totalDisbursed: filtered.filter(l => l.status === 'CONVERTED').reduce((s, l) => s + Number(l.loanAmount || 0), 0),
  }), [filtered]);

  const convRate  = summary.total > 0 ? (summary.converted / summary.total * 100).toFixed(1) : '0.0';
  const maxMonth  = Math.max(...monthly.map(m => m.total), 1);
  const maxSource = Math.max(...sources.map(s => s.total), 1);
  const maxBranch = Math.max(...branches.map(b => b.total), 1);

  // Unique values for filter dropdowns (from all leads, not filtered)
  const uniqSources  = [...new Set(allLeads.map(l => l.source || l.leadSource).filter(Boolean))].sort();
  const uniqTypes    = [...new Set(allLeads.map(l => l.leadType).filter(Boolean))].sort();

  const activeCount = Object.values(filters).filter(Boolean).length;

  const applyFilters = () => { setFilters(pending); setShowFilter(false); };
  const clearAll     = () => { setFilters(EMPTY_F); setPending(EMPTY_F); setShowFilter(false); };
  const setP = (k, v) => setPending(f => ({ ...f, [k]: v }));

  // ── Export functions ─────────────────────────────────────────────────────
  const doExport = (type) => {
    const ts  = new Date().toISOString().slice(0, 10);
    const tag = filters.branch ? `_${filters.branch.replace(/\s/g, '-')}` : '';

    if (type === 'leads') {
      const headers = ['Lead ID', 'Name', 'Mobile', 'Status', 'Lead Type', 'Lead Source',
        'Loan Amount', 'Loan Purpose', 'Branch', 'Village', 'Centre', 'Field Officer',
        'Created By', 'Created At', 'State', 'District', 'Notes'];
      const rows = filtered.map(l => ({
        'Lead ID':       l.id,
        'Name':          l.name,
        'Mobile':        l.mobile,
        'Status':        l.status,
        'Lead Type':     l.leadType || '',
        'Lead Source':   l.source || l.leadSource || '',
        'Loan Amount':   l.loanAmount || '',
        'Loan Purpose':  l.loanPurpose || '',
        'Branch':        l.branch || l.office || '',
        'Village':       l.village || l.locality || '',
        'Centre':        l.centre || l.center || '',
        'Field Officer': l.assignedTo || '',
        'Created By':    l.createdBy || '',
        'Created At':    l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN') : '',
        'State':         l.state || '',
        'District':      l.district || '',
        'Notes':         l.notes || '',
      }));
      downloadCSV(`leads-detail-report${tag}_${ts}.csv`, toCSV(headers, rows));
    }

    if (type === 'pipeline') {
      const headers = ['Month', 'Total Leads', 'Pending', 'Qualified', 'Converted', 'Rejected', 'Disbursed (₹)', 'Conv %'];
      const rows = monthly.map(r => ({
        'Month': r.month, 'Total Leads': r.total, 'Pending': r.pending,
        'Qualified': r.qualified, 'Converted': r.converted, 'Rejected': r.rejected,
        'Disbursed (₹)': r.disbursed,
        'Conv %': r.total ? (r.converted / r.total * 100).toFixed(1) + '%' : '0.0%',
      }));
      downloadCSV(`pipeline-summary${tag}_${ts}.csv`, toCSV(headers, rows));
    }

    if (type === 'officer') {
      const headers = ['Officer', 'Branch', 'Total Leads', 'Converted', 'Rejected', 'Conv %', 'Disbursed (₹)'];
      const rows = officers.map(r => ({
        'Officer': r.officer, 'Branch': r.branch, 'Total Leads': r.total,
        'Converted': r.converted, 'Rejected': r.rejected,
        'Conv %': r.convRate.toFixed(1) + '%', 'Disbursed (₹)': r.disbursed,
      }));
      downloadCSV(`officer-performance${tag}_${ts}.csv`, toCSV(headers, rows));
    }

    if (type === 'branch') {
      const headers = ['Branch', 'Total Leads', 'Pending', 'Converted', 'Rejected', 'Conv %', 'Disbursed (₹)'];
      const rows = branches.map(r => ({
        'Branch': r.branch, 'Total Leads': r.total, 'Pending': r.pending,
        'Converted': r.converted, 'Rejected': r.rejected,
        'Conv %': r.convRate.toFixed(1) + '%', 'Disbursed (₹)': r.disbursed,
      }));
      downloadCSV(`branch-performance${tag}_${ts}.csv`, toCSV(headers, rows));
    }

    if (type === 'source') {
      const headers = ['Lead Source', 'Total Leads', 'Converted', 'Conv %'];
      const rows = sources.map(r => ({
        'Lead Source': r.source, 'Total Leads': r.total,
        'Converted': r.converted, 'Conv %': r.convRate.toFixed(1) + '%',
      }));
      downloadCSV(`source-analysis${tag}_${ts}.csv`, toCSV(headers, rows));
    }

    setShowExport(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9CA3AF', fontSize: 14 }}>Loading reports...</div>;
  if (error)   return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', fontSize: 14 }}>{error}</div>;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#003366', margin: 0 }}>Reports & Analytics</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
            {activeCount > 0 ? `Showing ${filtered.length} of ${allLeads.length} leads — filtered` : `All ${allLeads.length} leads`}
          </p>
        </div>
        {/* Export dropdown */}
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExport(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#003366', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,51,102,0.2)' }}
          >
            ⬇ Download Report ▾
          </button>
          {showExport && (
            <div style={{ position: 'absolute', right: 0, top: 42, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 220, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                Select Report Type
              </div>
              {[
                { key: 'leads',    label: '📋 Leads Detail Report',     sub: 'All fields for each lead' },
                { key: 'pipeline', label: '📈 Monthly Pipeline',         sub: 'Volume & conversion by month' },
                { key: 'officer',  label: '👤 Officer Performance',       sub: 'Leads & conversions by officer' },
                { key: 'branch',   label: '🏢 Branch Performance',        sub: 'Volume & conversions by branch' },
                { key: 'source',   label: '📡 Lead Source Analysis',      sub: 'Channel-wise conversion rates' },
              ].map(({ key, label, sub }) => (
                <button
                  key={key}
                  onClick={() => doExport(key)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0F5FF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#003366' }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{sub}</span>
                </button>
              ))}
              <div style={{ padding: '8px 14px', fontSize: 11, color: '#9CA3AF', background: '#F9FAFB' }}>
                Downloads as CSV (Excel-compatible)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>Filter:</span>

          {/* Branch */}
          <select style={fsel} value={filters.branch} onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}>
            <option value="">All Branches</option>
            {ALL_BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>

          {/* Date range */}
          <input type="date" style={fsel} value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} title="From date" />
          <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>to</span>
          <input type="date" style={fsel} value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} title="To date" />

          {/* More filters toggle */}
          <button onClick={() => setShowFilter(v => !v)} style={{ padding: '6px 12px', border: `1px solid ${showFilter ? '#1874D0' : '#CFD6DD'}`, borderRadius: 6, background: showFilter ? '#EBF5FF' : '#fff', fontSize: 12, color: showFilter ? '#1874D0' : '#374151', cursor: 'pointer', fontWeight: showFilter ? 600 : 400, flexShrink: 0 }}>
            + More filters{activeCount > 2 ? ` (${activeCount - Object.values({ b: filters.branch, df: filters.dateFrom, dt: filters.dateTo }).filter(Boolean).length} more)` : ''}
          </button>

          {activeCount > 0 && (
            <button onClick={clearAll} style={{ padding: '6px 12px', border: '1px solid #EF4444', borderRadius: 6, background: '#fff', fontSize: 12, color: '#EF4444', cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>
              ✕ Clear all
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>
            {filtered.length} leads
          </div>
        </div>

        {/* Extended filters */}
        {showFilter && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
            <div>
              <label style={flabel}>Field Officer</label>
              <select style={fsel} value={filters.officer} onChange={e => setFilters(f => ({ ...f, officer: e.target.value }))}>
                <option value="">All Officers</option>
                {ALL_OFFICERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={flabel}>Status</label>
              <select style={fsel} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All Statuses</option>
                {['APPROVAL_PENDING','QUALIFIED','CONVERTED','REJECTED','NOT_CONVERTED'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={flabel}>Lead Type</label>
              <select style={fsel} value={filters.leadType} onChange={e => setFilters(f => ({ ...f, leadType: e.target.value }))}>
                <option value="">All Types</option>
                {uniqTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={flabel}>Lead Source</label>
              <select style={fsel} value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
                <option value="">All Sources</option>
                {uniqSources.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Total Leads"      value={fmt(summary.total)}            sub={`${activeCount > 0 ? 'filtered · ' : ''}all statuses`} />
        <StatCard label="Pending Approval" value={fmt(summary.approvalPending)}  sub="awaiting hub review"     color="#F59E0B" />
        <StatCard label="Qualified"        value={fmt(summary.qualified)}        sub="in onboarding"           color="#1874D0" />
        <StatCard label="Converted"        value={fmt(summary.converted)}        sub={`${convRate}% conv rate`} color="#10B981" />
        <StatCard label="Rejected"         value={fmt(summary.rejected)}         sub="declined"                color="#EF4444" />
        <StatCard label="Total Disbursed"  value={fmtAmt(summary.totalDisbursed)} sub="from converted leads"   color="#7C3AED" />
      </div>

      {/* ── Monthly Pipeline ── */}
      <div style={card}>
        <div style={cardHead}>
          <SectionTitle
            title="Monthly Pipeline"
            sub="Lead volume and conversion trends by month"
            action={
              <button onClick={() => doExport('pipeline')} style={dlBtn}>⬇ Export</button>
            }
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Month', 'Total', 'Pending', 'Qualified', 'Converted', 'Rejected', 'Disbursed', 'Conv %', 'Volume'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No data for selected filters</td></tr>
              ) : monthly.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={{ ...td, fontWeight: 600, color: '#003366' }}>{row.month}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{fmt(row.total)}</td>
                  <td style={{ ...td, color: '#F59E0B' }}>{fmt(row.pending)}</td>
                  <td style={{ ...td, color: '#1874D0' }}>{fmt(row.qualified)}</td>
                  <td style={{ ...td, color: '#10B981', fontWeight: 600 }}>{fmt(row.converted)}</td>
                  <td style={{ ...td, color: '#EF4444' }}>{fmt(row.rejected)}</td>
                  <td style={{ ...td, color: '#7C3AED' }}>{fmtAmt(row.disbursed)}</td>
                  <td style={{ ...td, color: '#10B981', fontWeight: 600 }}>{row.total ? pct(row.converted / row.total * 100) : '—'}</td>
                  <td style={{ ...td, minWidth: 100 }}><Bar value={row.total} max={maxMonth} color="#1874D0" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Source + Branch side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Source */}
        <div style={card}>
          <div style={cardHead}>
            <SectionTitle
              title="By Lead Source"
              sub="Which channels bring the most leads"
              action={<button onClick={() => doExport('source')} style={dlBtn}>⬇ Export</button>}
            />
          </div>
          <div style={{ padding: '8px 0' }}>
            {sources.length === 0 ? <Empty /> : sources.map((row, i) => (
              <div key={i} style={{ padding: '9px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 130, fontSize: 13, fontWeight: 500, color: '#374151', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.source}</div>
                <Bar value={row.total} max={maxSource} color="#1874D0" />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', width: 28, textAlign: 'right', flexShrink: 0 }}>{fmt(row.total)}</div>
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, width: 44, textAlign: 'right', flexShrink: 0 }}>{pct(row.convRate)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch */}
        <div style={card}>
          <div style={cardHead}>
            <SectionTitle
              title="By Branch"
              sub="Lead volume and conversion per branch office"
              action={<button onClick={() => doExport('branch')} style={dlBtn}>⬇ Export</button>}
            />
          </div>
          <div style={{ padding: '8px 0' }}>
            {branches.length === 0 ? <Empty /> : branches.map((row, i) => (
              <div key={i} style={{ padding: '9px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 130, fontSize: 13, fontWeight: 500, color: '#374151', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.branch}</div>
                <Bar value={row.total} max={maxBranch} color="#7C3AED" />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', width: 28, textAlign: 'right', flexShrink: 0 }}>{fmt(row.total)}</div>
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, width: 44, textAlign: 'right', flexShrink: 0 }}>{pct(row.convRate)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Officer Performance ── */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={cardHead}>
          <SectionTitle
            title="Field Officer Performance"
            sub="Leads assigned and conversion by officer"
            action={<button onClick={() => doExport('officer')} style={dlBtn}>⬇ Export</button>}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Officer', 'Branch', 'Total Leads', 'Converted', 'Rejected', 'Conv %', 'Disbursed'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No data for selected filters</td></tr>
              ) : officers.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={{ ...td, fontWeight: 600, color: '#003366' }}>{row.officer}</td>
                  <td style={{ ...td, color: '#6B7280', fontSize: 12 }}>{row.branch || '—'}</td>
                  <td style={td}>{fmt(row.total)}</td>
                  <td style={{ ...td, color: '#10B981', fontWeight: 600 }}>{fmt(row.converted)}</td>
                  <td style={{ ...td, color: '#EF4444' }}>{fmt(row.rejected)}</td>
                  <td style={{ ...td, color: '#7C3AED', fontWeight: 600 }}>{pct(row.convRate)}</td>
                  <td style={{ ...td, color: '#6B7280' }}>{fmtAmt(row.disbursed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Full Leads Table (collapsible) ── */}
      <LeadsTable leads={filtered} onExport={() => doExport('leads')} />

      <div style={{ fontSize: 12, color: '#CFD6DD', textAlign: 'right', marginTop: 12 }}>
        Data refreshes on page load · All amounts in INR · Downloads include UTF-8 BOM for Excel compatibility
      </div>
    </div>
  );
}

// ── Leads detail table (collapsible) ─────────────────────────────────────────
function LeadsTable({ leads, onExport }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER = 15;
  const total = leads.length;
  const paged = leads.slice((page - 1) * PER, page * PER);
  const totalPages = Math.ceil(total / PER);

  return (
    <div style={card}>
      <div style={cardHead}>
        <SectionTitle
          title={`Leads Detail${open ? '' : ' (click to expand)'}`}
          sub={`${total} leads matching current filters`}
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onExport} style={dlBtn}>⬇ Export CSV</button>
              <button onClick={() => setOpen(v => !v)} style={{ ...dlBtn, background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}>
                {open ? '▲ Collapse' : '▼ Expand'}
              </button>
            </div>
          }
        />
      </div>
      {open && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Name', 'Mobile', 'Lead Type', 'Source', 'Branch', 'Centre', 'Officer', 'Loan ₹', 'Status', 'Created'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #F9FAFB', background: i % 2 ? '#FAFAFA' : '#fff' }}>
                    <td style={{ ...td, fontWeight: 600, color: '#003366' }}>{l.name}</td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{l.mobile}</td>
                    <td style={td}>{l.leadType || '—'}</td>
                    <td style={td}>{l.source || l.leadSource || '—'}</td>
                    <td style={td}>{l.branch || l.office || '—'}</td>
                    <td style={td}>{l.centre || l.center || '—'}</td>
                    <td style={td}>{l.assignedTo || <span style={{ color: '#CFD6DD' }}>Unassigned</span>}</td>
                    <td style={td}>{l.loanAmount ? fmtAmt(l.loanAmount) : '—'}</td>
                    <td style={td}><StatusPill status={l.status} /></td>
                    <td style={{ ...td, fontSize: 11, color: '#9CA3AF' }}>{l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '10px 16px', borderTop: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{(page-1)*PER+1}–{Math.min(page*PER, total)} of {total}</span>
              <button style={pgBtn} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>‹</button>
              <button style={pgBtn} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const COLOR = { APPROVAL_PENDING: ['#FEF3C7','#92400E'], QUALIFIED: ['#EFF6FF','#1E40AF'], CONVERTED: ['#F0FDF4','#065F46'], REJECTED: ['#FEF2F2','#991B1B'] };
  const [bg, fg] = COLOR[status] || ['#F3F4F6', '#374151'];
  const label = { APPROVAL_PENDING: 'Pending', QUALIFIED: 'Qualified', CONVERTED: 'Converted', REJECTED: 'Rejected', NOT_CONVERTED: 'Not Converted' }[status] || status;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: bg, color: fg }}>{label}</span>;
}

function Empty() {
  return <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No data for selected filters</div>;
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const card    = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 24 };
const cardHead = { padding: '16px 20px', borderBottom: '1px solid #F3F4F6' };
const th       = { padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' };
const td       = { padding: '9px 14px', fontSize: 13, color: '#374151' };
const dlBtn    = { padding: '5px 12px', border: '1px solid #1874D0', borderRadius: 6, background: '#fff', color: '#1874D0', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const fsel     = { padding: '6px 10px', border: '1px solid #CFD6DD', borderRadius: 6, fontSize: 13, color: '#003366', background: '#fff', outline: 'none' };
const flabel   = { fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 };
const pgBtn    = { padding: '4px 10px', border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280' };
