import React, { useState } from 'react';

const ROLES = ['Hub Team', 'Branch Manager'];

export default function LoginPage({ onLogin }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Hub Team');

  const handleSignIn = () => {
    if (!name.trim()) return;
    onLogin({ name: name.trim(), role });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#003366', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Background circles */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(33,150,243,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(33,150,243,0.06)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '40px 36px', backdropFilter: 'blur(10px)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#2196F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⬡</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>finflux</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 }}>LOANBOOK</div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Sign in</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>Hub Team Portal</div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Full name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignIn()}
            placeholder="Enter your name"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Role */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Role</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${role === r ? '#2196F3' : 'rgba(255,255,255,0.15)'}`, background: role === r ? 'rgba(33,150,243,0.2)' : 'rgba(255,255,255,0.04)', color: role === r ? '#2196F3' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: role === r ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          disabled={!name.trim()}
          style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: name.trim() ? '#1874D0' : 'rgba(255,255,255,0.1)', color: name.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
        >
          Sign In →
        </button>

        <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          Field Officer? Use the mobile app
        </div>
      </div>
    </div>
  );
}
