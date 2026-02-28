import React, { useEffect, useState } from 'react';
import { c } from '../theme';
import { api } from '../services/api';

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const ACTIVE_STATUSES = ['APPROVAL_PENDING', 'QUALIFIED'];

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1874D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const PersonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const ThumbsUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FA8D29" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="10" r="3"/>
    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 13 8 13s8-7.75 8-13a8 8 0 0 0-8-8z"/>
  </svg>
);

// Status display labels for task strip
const STATUS_LABEL = {
  APPROVAL_PENDING: 'Pending Approval',
  QUALIFIED: 'Needs Follow-up',
};

export default function HomeScreen({ navigate, user }) {
  const [stats, setStats] = useState({ total: 0, approvalPending: 0, qualified: 0, converted: 0 });
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user?.name) return;

    // Load officer-scoped leads for stats + task strip
    api.getLeads({ assignedTo: user.name })
      .then(({ data }) => {
        setStats({
          total:           data.length,
          approvalPending: data.filter(l => l.status === 'APPROVAL_PENDING').length,
          qualified:       data.filter(l => l.status === 'QUALIFIED').length,
          converted:       data.filter(l => l.status === 'CONVERTED').length,
        });
        // Task strip: active leads that need action
        const active = data.filter(l => ACTIVE_STATUSES.includes(l.status));
        setTasks(
          active.slice(0, 5).map(l => ({
            id:     l.id,
            name:   l.name,
            center: l.centre || l.branch || 'Field Visit',
            label:  STATUS_LABEL[l.status] || l.status,
            type:   l.leadType || 'Lead',
            lead:   l,
          }))
        );
      })
      .catch(() => {});
  }, [user?.name]);

  const today   = new Date();
  const dateStr = `${DAYS[today.getDay()]}, ${today.getDate()} ${MONTHS[today.getMonth()]}`;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F5F6FA', paddingBottom: 80 }}>

      {/* Date header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarIcon />
          <span style={{ fontSize: 14, fontWeight: 600, color: c.navy }}>{dateStr}</span>
        </div>
        {user?.name && (
          <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'right' }}>
            <div style={{ fontWeight: 600, color: c.navy }}>{user.name}</div>
            {user.branch && <div style={{ fontSize: 11, color: c.textMuted }}>{user.branch}</div>}
          </div>
        )}
      </div>

      {/* Assignment pills */}
      {(user?.branch || user?.centre) && (
        <div style={{ display: 'flex', gap: 8, padding: '6px 16px 8px', flexWrap: 'wrap' }}>
          {user.branch  && <span style={{ fontSize: 11, background: '#EBF5FF', color: '#1874D0', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>{user.branch}</span>}
          {user.village && <span style={{ fontSize: 11, background: '#F0FDF4', color: '#059669', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>{user.village}</span>}
          {user.centre  && <span style={{ fontSize: 11, background: '#FEF6EC', color: '#FA8D29', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>{user.centre}</span>}
        </div>
      )}

      {/* Two hero cards */}
      <div style={{ display: 'flex', gap: 12, padding: '8px 16px 24px' }}>

        {/* Sourcing card */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '18px 14px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: '#FA8D29', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <PersonIcon />
          </div>
          <p style={{ fontSize: 13, color: c.navy, lineHeight: 1.6, margin: '0 0 16px', fontWeight: 400 }}>
            You have{' '}
            <strong style={{ color: '#FA8D29' }}>sourcing</strong> to do today
          </p>
          <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.navy }}>{stats.approvalPending}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>Pending Approval</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.navy }}>{stats.total}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>My Leads</div>
            </div>
          </div>
          <button
            onClick={() => navigate('leads')}
            style={{ width: '100%', padding: '10px 0', borderRadius: 40, background: '#FA8D29', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            View List →
          </button>
        </div>

        {/* Qualified leads card */}
        <div style={{ flex: 1, background: '#DCFCE7', borderRadius: 20, padding: '18px 14px 14px', boxShadow: '0 4px 20px rgba(16,185,129,0.12)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <ThumbsUpIcon />
          </div>
          <p style={{ fontSize: 13, color: c.navy, lineHeight: 1.6, margin: '0 0 16px', fontWeight: 400 }}>
            And,{' '}
            <strong style={{ color: '#059669' }}>leads</strong> to follow up
          </p>
          <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.navy }}>{stats.qualified}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>Qualified</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.navy }}>₹{((stats.converted || 0) * 800).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>Earned</div>
            </div>
          </div>
          <button
            onClick={() => navigate('leads')}
            style={{ width: '100%', padding: '10px 0', borderRadius: 40, background: '#fff', color: '#059669', border: '1.5px solid #10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Leads Pool →
          </button>
        </div>

      </div>

      {/* Upcoming Tasks — real leads requiring action */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: c.navy, marginBottom: 12 }}>
          Action Required {tasks.length > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: c.textMuted }}>({tasks.length})</span>}
        </div>
        {tasks.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', color: c.textMuted, fontSize: 13, textAlign: 'center' }}>
            All caught up 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8 }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate('journey', task.lead)}
                style={{ minWidth: 210, flexShrink: 0, background: '#fff', borderRadius: 14, padding: '12px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 20, background: '#FEF6EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LocationIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</div>
                  <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{task.center} • {task.type}</div>
                  <div style={{ fontSize: 10, color: '#FA8D29', fontWeight: 600, marginTop: 2 }}>{task.label}</div>
                </div>
                <span style={{ color: c.textMuted, fontSize: 16 }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
