import React, { useState } from 'react';
import { c, primaryBtn } from '../theme';

const OFFICERS = ['Ravi Kumar', 'Jagan', 'Sameer', 'Amul', 'Gopal', 'Mohan'];

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [custom, setCustom] = useState(false);

  const handleStart = () => {
    if (!name.trim()) return;
    onLogin({ name: name.trim(), role: 'FIELD_OFFICER' });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.navy, position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(33,150,243,0.15)' }} />
      <div style={{ position: 'absolute', bottom: 80, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(33,150,243,0.10)' }} />

      {/* Logo area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px 0', zIndex: 1 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: '#2196F3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 8px 24px rgba(33,150,243,0.4)' }}>
          <span style={{ fontSize: 36 }}>⬡</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>finflux</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4, letterSpacing: 1 }}>LOANBOOK</div>

        <div style={{ marginTop: 40, width: '100%' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>Sign in as Field Officer to continue</div>

          {/* Officer selector */}
          {!custom ? (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: 10 }}>Select your name</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {OFFICERS.map(o => (
                  <button key={o} onClick={() => setName(o)} style={{ padding: '12px 16px', borderRadius: 12, border: `2px solid ${name === o ? '#2196F3' : 'rgba(255,255,255,0.15)'}`, background: name === o ? 'rgba(33,150,243,0.2)' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 15, fontWeight: name === o ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    {o}
                  </button>
                ))}
                <button onClick={() => { setCustom(true); setName(''); }} style={{ padding: '10px 16px', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.3)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>
                  + Enter custom name
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: 8 }}>Your name</div>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
                placeholder="Enter your full name"
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
              <button onClick={() => { setCustom(false); setName(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', marginTop: 6 }}>
                ← Pick from list
              </button>
            </>
          )}
        </div>
      </div>

      {/* Role badge */}
      <div style={{ zIndex: 1, display: 'flex', justifyContent: 'center', padding: '20px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 40, background: 'rgba(33,150,243,0.2)', border: '1px solid rgba(33,150,243,0.4)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2196F3', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: '#2196F3', fontWeight: 600, letterSpacing: 0.5 }}>FIELD OFFICER</span>
        </div>
      </div>

      {/* Start button */}
      <div style={{ padding: '12px 32px 32px', zIndex: 1 }}>
        <button
          onClick={handleStart}
          disabled={!name.trim()}
          style={primaryBtn(!name.trim())}
        >
          Start Shift →
        </button>
      </div>
    </div>
  );
}
