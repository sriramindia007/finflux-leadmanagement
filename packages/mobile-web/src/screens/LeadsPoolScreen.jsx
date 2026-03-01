import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { c, card, pill } from '../theme';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const FILTERS = ['ALL','CORRECTIONS','APPROVAL_PENDING','QUALIFIED','REJECTED','CONVERTED'];
const LABELS = { ALL:'All', CORRECTIONS:'Corrections', APPROVAL_PENDING:'Pending', QUALIFIED:'Qualified', REJECTED:'Rejected', CONVERTED:'Converted' };

function agingDays(createdAt) {
  return Math.floor((Date.now() - new Date(createdAt)) / 86400000);
}

function AgingBadge({ createdAt }) {
  const d = agingDays(createdAt);
  const color = d <= 3 ? '#10B981' : d <= 7 ? '#FA8D29' : '#EF4444';
  const bg    = d <= 3 ? 'rgba(16,185,129,0.10)' : d <= 7 ? 'rgba(250,141,41,0.10)' : 'rgba(239,68,68,0.10)';
  return (
    <span style={{ fontSize:10, fontWeight:700, color, background:bg, borderRadius:40, padding:'2px 7px', flexShrink:0 }}>
      {d > 7 ? '⚠ ' : ''}{d}d
    </span>
  );
}

export default function LeadsPoolScreen({ navigate, user }) {
  const [leads, setLeads]     = useState([]);
  const [filter, setFilter]   = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [myLeads, setMyLeads] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.getLeads({}); setLeads(data); }
    catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Base list: optionally scoped to current officer
  const base = useMemo(() => {
    if (myLeads && user?.name) return leads.filter(l => l.assignedTo === user.name);
    return leads;
  }, [leads, myLeads, user]);

  // Status counts across full base list
  const countByStatus = useMemo(() => {
    const counts = {
      ALL: base.length,
      CORRECTIONS: base.filter(l => l.isCorrection === true).length,
    };
    FILTERS.filter(f => f !== 'ALL' && f !== 'CORRECTIONS').forEach(f => {
      counts[f] = base.filter(l => l.status === f).length;
    });
    return counts;
  }, [base]);

  // Visible list: status chip + search
  const filtered = useMemo(() => {
    let list;
    if (filter === 'ALL') {
      list = base;
    } else if (filter === 'CORRECTIONS') {
      list = base.filter(l => l.isCorrection === true);
    } else {
      list = base.filter(l => l.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.mobile || '').includes(q) ||
        (l.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [base, filter, search]);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.bg }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 16px 10px' }}>
        <button onClick={() => navigate('home')} style={{ width:36, height:36, borderRadius:18, background:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', fontSize:18 }}>←</button>
        <span style={{ fontSize:18, fontWeight:700, color:c.navy, flex:1 }}>Leads Pool</span>
        <button onClick={load} disabled={loading} style={{ width:36, height:36, borderRadius:18, background:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', fontSize:18, opacity: loading ? 0.5 : 1 }}>↻</button>
      </div>

      {/* Search + My Leads toggle */}
      <div style={{ display:'flex', gap:8, alignItems:'center', padding:'0 16px 10px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, mobile, ID…"
          style={{ flex:1, padding:'9px 14px', borderRadius:40, border:`1.5px solid ${c.border}`, background:'#fff', fontSize:13, color:c.navy, outline:'none', fontFamily:'Inter, sans-serif' }}
        />
        <button
          onClick={() => setMyLeads(m => !m)}
          style={{ ...pill(myLeads), padding:'9px 14px', fontSize:12, flexShrink:0 }}
        >
          {myLeads ? 'My Leads' : 'All Leads'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display:'flex', gap:8, padding:'0 16px 12px', overflowX:'auto', scrollbarWidth:'none' }}>
        {FILTERS.map(f => {
          const isCorrections = f === 'CORRECTIONS';
          const hasCorrections = isCorrections && (countByStatus['CORRECTIONS'] ?? 0) > 0;
          const correctionStyle = isCorrections && filter !== f ? {
            border: '1.5px solid #F59E0B',
            background: '#FFFBEB',
            color: '#92400E',
            fontWeight: 600,
          } : {};
          return (
            <button key={f} style={{ ...pill(filter === f), ...(filter !== f ? correctionStyle : {}) }} onClick={() => setFilter(f)}>
              {isCorrections && hasCorrections ? '⚠ ' : ''}{LABELS[f]} <span style={{ fontSize:10, opacity:0.7 }}>({countByStatus[f] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px', paddingBottom:80 }}>
        {loading
          ? <div style={{ textAlign:'center', paddingTop:40, color:c.textMuted }}>Loading…</div>
          : filtered.length === 0
            ? <div style={{ textAlign:'center', paddingTop:40, color:c.textMuted }}>No leads found</div>
            : filtered.map(lead => {
                const borderColor = {
                  APPROVAL_PENDING: c.pending,
                  QUALIFIED:        c.qualified,
                  CONVERTED:        c.converted,
                  APPROVED:         c.approved,
                  REJECTED:         c.rejected,
                  NOT_CONVERTED:    c.textMuted,
                }[lead.status] || c.border;
                return (
                  <div
                    key={lead.id}
                    style={{ ...card, cursor:'pointer', borderLeft:`4px solid ${borderColor}`, paddingLeft:12 }}
                    onClick={() => navigate('journey', lead)}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ flex:1 }}>
                        {/* Name + aging */}
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                          <div style={{ fontSize:15, fontWeight:700, color:c.navy }}>{lead.name}</div>
                          {lead.createdAt && <AgingBadge createdAt={lead.createdAt} />}
                        </div>
                        <div style={{ fontSize:12, color:c.textSecondary, margin:'0 0 2px' }}>
                          {lead.leadType} Lead{lead.source ? ` · ${lead.source}` : ''}
                        </div>
                        {(lead.branch || lead.centre) && (
                          <div style={{ fontSize:11, color:c.textMuted, marginBottom:4 }}>
                            {[lead.branch, lead.village, lead.centre].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <StatusBadge status={lead.status} />
                          {lead.isCorrection && <span style={{ fontSize:10, fontWeight:700, color:'#92400E', background:'#FEF3C7', borderRadius:40, padding:'2px 8px', border:'1px solid #F59E0B' }}>⚠ Correction</span>}
                          {lead.status === 'CONVERTED' && <span style={{ color:c.converted, fontWeight:700, fontSize:13 }}>+₹800</span>}
                          {lead.status === 'APPROVAL_PENDING' && !lead.isCorrection && <span style={{ fontSize:11, color:c.pending }}>Awaiting hub review</span>}
                        </div>
                        {lead.assignedTo && !myLeads && (
                          <div style={{ fontSize:11, color:c.textMuted, marginTop:3 }}>FO: {lead.assignedTo}</div>
                        )}
                      </div>
                      <span style={{ color:c.textMuted, fontSize:20, marginLeft:8 }}>›</span>
                    </div>
                  </div>
                );
              })
        }
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('newlead')}
        style={{ position:'absolute', bottom:84, right:20, width:56, height:56, borderRadius:28, background:c.primary, border:'none', cursor:'pointer', fontSize:28, fontWeight:300, color:'#fff', boxShadow:'0 4px 16px rgba(33,150,243,0.4)', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}
      >+</button>
    </div>
  );
}
