import React, { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import LeadsPoolScreen from './screens/LeadsPoolScreen';
import NewLeadScreen from './screens/NewLeadScreen';
import OnboardingJourneyScreen from './screens/OnboardingJourneyScreen';
import RejectionScreen from './screens/RejectionScreen';
import SchedulerScreen from './screens/SchedulerScreen';

const OFFICERS = ['Ravi Kumar', 'Jagan', 'Sameer', 'Amul', 'Gopal', 'Mohan'];
const DEFAULT_USER = { name: 'Ravi Kumar', role: 'FIELD_OFFICER' };

const BOTTOM_NAV = [
  { key:'home', icon:'🏠', label:'Home' },
  { key:'leads', icon:'👥', label:'Leads' },
  { key:'search', icon:'🔍', label:'Search' },
  { key:'metrics', icon:'🗓️', label:'Schedule' },
  { key:'profile', icon:'👤', label:'Profile' },
];

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('flo_user')) || DEFAULT_USER; } catch { return DEFAULT_USER; }
  });
  const [screen, setScreen] = useState('home');
  const [params, setParams] = useState(null);

  const switchOfficer = (name) => {
    const u = { name, role: 'FIELD_OFFICER' };
    localStorage.setItem('flo_user', JSON.stringify(u));
    setUser(u);
  };

  const navigate = (to, p = null) => { setScreen(to); setParams(p); };

  const showBottomNav = ['home','leads','search','metrics','profile'].includes(screen);

  const renderProfile = () => (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#F5F6FA', padding: 24 }}>
      <div style={{ fontSize:18, fontWeight:700, color:'#003366', marginBottom:20 }}>Profile</div>
      {/* Current user */}
      <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:26, background:'#2196F3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#fff', fontWeight:700 }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#003366' }}>{user.name}</div>
            <div style={{ fontSize:12, color:'#2196F3', fontWeight:600, marginTop:2, letterSpacing:0.5 }}>FIELD OFFICER</div>
          </div>
        </div>
      </div>
      {/* Switch officer */}
      <div style={{ fontSize:13, fontWeight:600, color:'#6B7280', marginBottom:10 }}>SWITCH OFFICER</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {OFFICERS.map(name => (
          <button
            key={name}
            onClick={() => switchOfficer(name)}
            style={{ padding:'12px 16px', borderRadius:12, border:`2px solid ${user.name === name ? '#2196F3' : '#E8EDF2'}`, background: user.name === name ? '#EBF5FF' : '#fff', color: user.name === name ? '#2196F3' : '#374151', fontSize:14, fontWeight: user.name === name ? 700 : 400, cursor:'pointer', textAlign:'left' }}
          >
            {name} {user.name === name ? '✓' : ''}
          </button>
        ))}
      </div>
    </div>
  );

  const renderScreen = () => {
    switch(screen) {
      case 'home':      return <HomeScreen navigate={navigate} user={user} />;
      case 'leads':     return <LeadsPoolScreen navigate={navigate} user={user} />;
      case 'newlead':   return <NewLeadScreen navigate={navigate} user={user} />;
      case 'journey':   return <OnboardingJourneyScreen navigate={navigate} lead={params} user={user} />;
      case 'rejection': return <RejectionScreen navigate={navigate} lead={params} />;
      case 'metrics':   return <SchedulerScreen />;
      case 'profile':   return renderProfile();
      default:          return <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>{screen} — coming soon</div>;
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', minHeight:'600px', position:'relative', overflow:'hidden' }}>
      {/* Status bar mock */}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 20px 4px', background:'#F5F6FA', fontSize:12, fontWeight:600, color:'#003366', flexShrink:0 }}>
        <span>9:41</span>
        <span>▲▲▲ WiFi 🔋</span>
      </div>

      {/* Screen content */}
      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        {renderScreen()}
      </div>

      {/* Bottom nav */}
      {showBottomNav && (
        <div style={{ display:'flex', background:'#fff', borderTop:'1px solid #E8EDF2', padding:'8px 0 12px', flexShrink:0, boxShadow:'0 -2px 12px rgba(0,0,0,0.06)' }}>
          {BOTTOM_NAV.map(item => {
            const active = screen === item.key || (item.key === 'leads' && ['leads','newlead','journey','rejection'].includes(screen));
            return (
              <button key={item.key} onClick={() => navigate(item.key)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>
                <span style={{ fontSize:20 }}>{item.icon}</span>
                <span style={{ fontSize:10, fontWeight: active ? 600 : 400, color: active ? '#2196F3' : '#9CA3AF' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
