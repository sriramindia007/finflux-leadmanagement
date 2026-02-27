import React, { useEffect, useState } from 'react';
import { c, card } from '../theme';
import { api } from '../services/api';

const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function CalendarStrip() {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() - 3 + i); return { date: d.getDate(), day: DAYS[d.getDay()], isToday: i === 3 }; });
  return (
    <div style={{ display:'flex', justifyContent:'space-around', padding:'8px 16px 12px' }}>
      {days.map((d,i) => (
        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 8px', borderRadius: d.isToday ? 10 : 6, background: d.isToday ? c.primary : 'transparent' }}>
          <span style={{ fontSize:10, fontWeight:500, color: d.isToday ? '#fff' : c.textSecondary }}>{d.day}</span>
          <span style={{ fontSize:14, fontWeight:700, color: d.isToday ? '#fff' : c.navy, marginTop:2 }}>{d.date}</span>
        </div>
      ))}
    </div>
  );
}

function DashCard({ label, count, sub, amount, amountSub, btnLabel, bg, onPress, icon }) {
  return (
    <div style={{ ...card, background: bg, minWidth:180, flex:'0 0 auto' }}>
      <div style={{ fontSize:28, marginBottom:6 }}>{icon}</div>
      <p style={{ fontSize:13, fontWeight:600, color:c.navy, marginBottom:10 }}>{label}</p>
      <div style={{ display:'flex', gap:16, marginBottom:12 }}>
        <div><div style={{ fontSize:18, fontWeight:700, color:c.navy }}>{count}</div><div style={{ fontSize:11, color:c.textSecondary }}>{sub}</div></div>
        {amount != null && <div><div style={{ fontSize:18, fontWeight:700, color:c.navy }}>₹{amount.toLocaleString('en-IN')}</div><div style={{ fontSize:11, color:c.textSecondary }}>{amountSub}</div></div>}
      </div>
      <button onClick={onPress} style={{ padding:'8px 16px', borderRadius:40, background:c.primary, color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>{btnLabel} →</button>
    </div>
  );
}

export default function HomeScreen({ navigate, user }) {
  const [stats, setStats] = useState({ pending: 0, qualified: 0, converted: 0, total: 0 });
  useEffect(() => { api.getStats().then(setStats).catch(() => {}); }, []);
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Officer';

  return (
    <div style={{ height:'100%', overflowY:'auto', background:c.bg, paddingBottom:80 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 16px 8px' }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:c.navy }}>{greeting}, {firstName} 👋</div>
          <div style={{ fontSize:13, color:c.textSecondary }}>Today is {today.toLocaleDateString('en-IN',{day:'numeric',month:'long'})}</div>
        </div>
        <div style={{ width:36, height:36, borderRadius:18, background:c.primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#fff', fontWeight:700 }}>
          {user?.name?.charAt(0) || '👤'}
        </div>
      </div>

      <CalendarStrip />

      {/* Dashboard Cards */}
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 16px 12px', scrollbarWidth:'none' }}>
        <DashCard icon="🏦" label="You're beginning Collections!" count={8} sub="Center Meetings" amount={123500} amountSub="Target Amount" btnLabel="Center List" bg="#EBF5FF" onPress={() => {}} />
        <DashCard icon="📋" label="You have things Sourcing today" count={stats.total} sub="Onboarding Tasks" amount={null} btnLabel="View List" bg="#FEF3C7" onPress={() => navigate('leads')} />
        <DashCard icon="👥" label="Leads to be met" count={stats.qualified} sub="Qualified Leads" amount={null} amountSub={null} btnLabel="Leads Pool" bg="#D1FAE5" onPress={() => navigate('leads')} />
      </div>

      {/* Upcoming Tasks */}
      <div style={{ padding:'0 16px' }}>
        <div style={{ fontSize:15, fontWeight:700, color:c.navy, marginBottom:10 }}>Upcoming Tasks</div>
        {[{title:'Vidyapura Center 1', time:'07:00 AM', type:'Collection'}, {title:'Vidyapura Center 2', time:'09:00 AM', type:'Collection'}].map((t,i) => (
          <div key={i} style={{ ...card, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:c.pending, fontSize:18 }}>○</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:c.navy }}>{t.title}</div>
                <div style={{ fontSize:12, color:c.textSecondary }}>{t.time} • {t.type}</div>
              </div>
            </div>
            <button style={{ display:'flex', alignItems:'center', gap:4, background:'#EBF5FF', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:c.primary, fontSize:12, fontWeight:600 }}>🗺 Map</button>
          </div>
        ))}
      </div>
    </div>
  );
}
