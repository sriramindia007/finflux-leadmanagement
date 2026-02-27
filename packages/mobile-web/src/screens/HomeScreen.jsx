import React, { useEffect, useState } from 'react';
import { c } from '../theme';
import { api } from '../services/api';

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Mock upcoming tasks — replace with API call when available
const MOCK_TASKS = [
  { center: 'Vidyapura Center 1', time: '07:00 AM', type: 'Collection' },
  { center: 'Vidyapura Center 1', time: '09:00 AM', type: 'Collection' },
];

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

export default function HomeScreen({ navigate, user }) {
  const [stats, setStats] = useState({ total: 0, approvalPending: 0, qualified: 0, converted: 0 });

  useEffect(() => {
    api.getStats().then(s => setStats(s)).catch(() => {});
  }, []);

  const today   = new Date();
  const dateStr = `${DAYS[today.getDay()]}, ${today.getDate()} ${MONTHS[today.getMonth()]}`;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: c.surface, paddingBottom: 80 }}>

      {/* Date header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 8px' }}>
        <CalendarIcon />
        <span style={{ fontSize: 14, fontWeight: 600, color: c.navy }}>{dateStr}</span>
      </div>

      {/* Two hero cards */}
      <div style={{ display: 'flex', gap: 12, padding: '8px 16px 20px' }}>

        {/* Sourcing card */}
        <div style={{ flex: 1, background: c.surface, borderRadius: 16, padding: '16px 14px', boxShadow: '0 2px 14px rgba(0,0,0,0.09)', border: `1px solid ${c.borderLight}` }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: '#FA8D29', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <PersonIcon />
          </div>
          <p style={{ fontSize: 13, color: c.navy, lineHeight: 1.55, margin: '0 0 14px', fontWeight: 400 }}>
            Well, you have some things <strong>Sourcing</strong> today
          </p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.navy }}>{stats.approvalPending || 0}</div>
              <div style={{ fontSize: 11, color: c.textSecondary }}>Onboarding Tasks</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.navy }}>{stats.total || 0}</div>
              <div style={{ fontSize: 11, color: c.textSecondary }}>Leads Found</div>
            </div>
          </div>
          <button onClick={() => navigate('leads')} style={{ width: '100%', padding: '9px 0', borderRadius: 40, background: '#FA8D29', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            View List →
          </button>
        </div>

        {/* Leads card */}
        <div style={{ flex: 1, background: '#D1FAE5', borderRadius: 16, padding: '16px 14px', boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <ThumbsUpIcon />
          </div>
          <p style={{ fontSize: 13, color: c.navy, lineHeight: 1.55, margin: '0 0 14px', fontWeight: 400 }}>
            And, there are <strong>leads</strong> to be met
          </p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.navy }}>{stats.qualified || 0}</div>
              <div style={{ fontSize: 11, color: c.textSecondary }}>Clients Promised</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.navy }}>₹{((stats.converted || 0) * 800).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: c.textSecondary }}>To Be Collected</div>
            </div>
          </div>
          <button onClick={() => navigate('leads')} style={{ width: '100%', padding: '9px 0', borderRadius: 40, background: 'transparent', color: '#059669', border: '1.5px solid #10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Leads Pool →
          </button>
        </div>

      </div>

      {/* Upcoming Tasks */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: c.navy, marginBottom: 12 }}>Upcoming Tasks</div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8 }}>
          {MOCK_TASKS.map((task, i) => (
            <div key={i} style={{ minWidth: 210, flexShrink: 0, background: c.surface, borderRadius: 14, padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${c.borderLight}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 19, background: '#FEF6EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LocationIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.center}</div>
                <div style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>{task.time} • {task.type}</div>
              </div>
              <button style={{ padding: '6px 10px', borderRadius: 8, background: '#EBF5FF', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#1874D0', flexShrink: 0 }}>
                Map
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
