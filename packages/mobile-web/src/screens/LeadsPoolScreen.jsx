import React, { useEffect, useState, useCallback } from 'react';
import { c, card, pill } from '../theme';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const FILTERS = ['ALL','APPROVAL_PENDING','QUALIFIED','REJECTED','CONVERTED'];
const LABELS = { ALL:'All', APPROVAL_PENDING:'Pending', QUALIFIED:'Qualified', REJECTED:'Rejected', CONVERTED:'Converted' };

export default function LeadsPoolScreen({ navigate }) {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.getLeads(filter !== 'ALL' ? { status: filter } : {}); setLeads(data); }
    catch (_) {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.bg }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 16px 10px' }}>
        <button onClick={() => navigate('home')} style={{ width:36, height:36, borderRadius:18, background:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', fontSize:18 }}>←</button>
        <span style={{ fontSize:18, fontWeight:700, color:c.navy, flex:1 }}>Leads Pool</span>
        <button onClick={load} disabled={loading} style={{ width:36, height:36, borderRadius:18, background:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', fontSize:18, opacity: loading ? 0.5 : 1 }}>↻</button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display:'flex', gap:8, padding:'0 16px 12px', overflowX:'auto', scrollbarWidth:'none' }}>
        {FILTERS.map(f => <button key={f} style={pill(filter === f)} onClick={() => setFilter(f)}>{LABELS[f]}</button>)}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px', paddingBottom:80 }}>
        {loading ? <div style={{ textAlign:'center', paddingTop:40, color:c.textMuted }}>Loading...</div>
          : leads.length === 0 ? <div style={{ textAlign:'center', paddingTop:40, color:c.textMuted }}>No leads found</div>
          : leads.map(lead => {
            const borderColor = {
              APPROVAL_PENDING: c.pending,
              QUALIFIED:        c.qualified,
              CONVERTED:        c.converted,
              APPROVED:         c.approved,
              REJECTED:         c.rejected,
              NOT_CONVERTED:    c.textMuted,
            }[lead.status] || c.border;
            return (
              <div key={lead.id} style={{ ...card, cursor:'pointer', borderLeft:`4px solid ${borderColor}`, paddingLeft:12 }} onClick={() => navigate('journey', lead)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:c.navy }}>{lead.name}</div>
                    <div style={{ fontSize:12, color:c.textSecondary, margin:'3px 0 2px' }}>
                      {lead.leadType} Lead{lead.source ? ` · ${lead.source}` : ''}
                    </div>
                    {(lead.branch || lead.centre) && (
                      <div style={{ fontSize:11, color:c.textMuted, marginBottom:5 }}>
                        {[lead.branch, lead.village, lead.centre].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <StatusBadge status={lead.status} />
                      {lead.status === 'CONVERTED' && <span style={{ color:c.converted, fontWeight:700, fontSize:13 }}>+₹800</span>}
                      {lead.status === 'APPROVAL_PENDING' && <span style={{ fontSize:11, color:c.pending }}>Awaiting hub review</span>}
                    </div>
                  </div>
                  <span style={{ color:c.textMuted, fontSize:20, marginLeft:8 }}>›</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('newlead')} style={{ position:'absolute', bottom:84, right:20, width:56, height:56, borderRadius:28, background:c.primary, border:'none', cursor:'pointer', fontSize:28, fontWeight:300, color:'#fff', boxShadow:'0 4px 16px rgba(33,150,243,0.4)', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>+</button>
    </div>
  );
}
