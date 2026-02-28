import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtAmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || '#003366' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#003366' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
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

const STATUS_COLOR = {
  APPROVAL_PENDING: '#F59E0B',
  QUALIFIED:        '#1874D0',
  CONVERTED:        '#10B981',
  REJECTED:         '#EF4444',
};

export default function ReportsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.getReports()
      .then(setData)
      .catch(() => setError('Failed to load reports. Check API connection.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9CA3AF', fontSize: 14 }}>
      Loading reports...
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', fontSize: 14 }}>{error}</div>
  );

  const { monthly = [], sources = [], officers = [], summary = {} } = data;
  const convRate = summary.total > 0 ? ((summary.converted / summary.total) * 100).toFixed(1) : '0.0';
  const maxMonthly = Math.max(...monthly.map(m => Number(m.total_leads || 0)), 1);
  const maxSource  = Math.max(...sources.map(s => Number(s.total || 0)), 1);
  const maxOfficer = Math.max(...officers.map(o => Number(o.total_leads || 0)), 1);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#003366', margin: 0 }}>Reports & Analytics</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Lead pipeline performance across all sources and field officers</p>
      </div>

      {/* Summary KPI row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard label="Total Leads"       value={fmt(summary.total)}           sub="all time" />
        <StatCard label="Pending Approval"  value={fmt(summary.approvalPending)}  sub="awaiting hub review" color="#F59E0B" />
        <StatCard label="Qualified"         value={fmt(summary.qualified)}        sub="in onboarding" color="#1874D0" />
        <StatCard label="Converted"         value={fmt(summary.converted)}        sub={`${convRate}% conversion rate`} color="#10B981" />
        <StatCard label="Rejected"          value={fmt(summary.rejected)}         sub="declined" color="#EF4444" />
        <StatCard label="Total Disbursed"   value={fmtAmt(summary.totalDisbursed)} sub="converted loan amounts" color="#7C3AED" />
      </div>

      {/* Monthly pipeline table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 24, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <SectionHeader title="Monthly Pipeline" sub="Lead volume and conversion trends by month" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Month', 'Total', 'Pending', 'Qualified', 'Converted', 'Rejected', 'Disbursed', 'Volume'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No data yet</td></tr>
              ) : monthly.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#003366', whiteSpace: 'nowrap' }}>{row.month}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#374151' }}>{fmt(row.total_leads)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#F59E0B', fontWeight: 500 }}>{fmt(row.pending)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#1874D0', fontWeight: 500 }}>{fmt(row.qualified)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#10B981', fontWeight: 600 }}>{fmt(row.converted)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{fmt(row.rejected)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#7C3AED', fontWeight: 500 }}>{fmtAmt(row.converted_amount)}</td>
                  <td style={{ padding: '10px 14px', minWidth: 100 }}>
                    <Bar value={row.total_leads} max={maxMonthly} color="#1874D0" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Source breakdown */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <SectionHeader title="By Lead Source" sub="Which channels bring the most leads" />
          </div>
          <div style={{ padding: '8px 0' }}>
            {sources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No data yet</div>
            ) : sources.map((row, i) => (
              <div key={i} style={{ padding: '10px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 130, fontSize: 13, fontWeight: 500, color: '#374151', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.source}</div>
                <Bar value={row.total} max={maxSource} color="#1874D0" />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', width: 30, textAlign: 'right', flexShrink: 0 }}>{fmt(row.total)}</div>
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, width: 44, textAlign: 'right', flexShrink: 0 }}>{pct(row.conversion_rate_pct)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Officer performance */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <SectionHeader title="Field Officer Performance" sub="Leads assigned and conversion by officer" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Officer', 'Leads', 'Converted', 'Rejected', 'Conv %', 'Disbursed'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {officers.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>No data yet</td></tr>
                ) : officers.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, color: '#003366' }}>{row.officer}</td>
                    <td style={{ padding: '9px 14px', fontSize: 13, color: '#374151' }}>{fmt(row.total_leads)}</td>
                    <td style={{ padding: '9px 14px', fontSize: 13, color: '#10B981', fontWeight: 600 }}>{fmt(row.converted)}</td>
                    <td style={{ padding: '9px 14px', fontSize: 13, color: '#EF4444' }}>{fmt(row.rejected)}</td>
                    <td style={{ padding: '9px 14px', fontSize: 13, color: '#7C3AED', fontWeight: 600 }}>{pct(row.conversion_rate_pct)}</td>
                    <td style={{ padding: '9px 14px', fontSize: 13, color: '#6B7280' }}>{fmtAmt(row.converted_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#CFD6DD', textAlign: 'right' }}>
        Data refreshes on page load · All amounts in INR
      </div>
    </div>
  );
}
