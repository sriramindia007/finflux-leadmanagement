import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'To-Do',        path: '/todo' },
  { label: 'Onboarding',   path: '/leads' },
  { label: 'Collections',  path: '/collections' },
  { label: 'All Customers', path: '/customers' },
  { label: 'Reports',      path: '/reports' },
  { label: '⚙ Config',     path: '/config' },
];

const ROLES = ['Hub Team', 'Branch Manager'];
const HUB_BRANCHES = ['HQ', 'Bengaluru North', 'Bengaluru South', 'Dharwad', 'Guntur', 'Hyderabad Central'];

export default function TopNav({ user, onUserChange }) {
  const { pathname } = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);

  const openMenu = () => { setShowMenu(true); setEditing(false); setEditName(user?.name || ''); };
  const closeMenu = () => { setShowMenu(false); setEditing(false); };

  const applyName = () => {
    if (editName.trim()) onUserChange({ ...user, name: editName.trim() });
    setEditing(false);
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>⬡</span>
        <span style={styles.logoText}>finflux</span>
        <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.15)', marginLeft: 8 }} />
      </div>
      <div style={styles.items}>
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} style={{ ...styles.item, ...(active ? styles.itemActive : {}) }}>
              {item.label}
            </Link>
          );
        })}
      </div>
      <div style={styles.actions}>
        <button style={styles.iconBtn}>🔍</button>
        <button style={styles.iconBtn}>⊞</button>
        {/* User pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={openMenu}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px 4px 4px', cursor: 'pointer' }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 13, background: '#2196F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>
              {user?.name?.charAt(0) || '?'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.2 }}>{user?.role}</div>
            </div>
          </button>
          {showMenu && (
            <>
              <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
              <div style={{ position: 'absolute', right: 0, top: 40, background: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 200, zIndex: 200, overflow: 'hidden' }}>
                {/* Name editor */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  {editing ? (
                    <div>
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') applyName(); if (e.key === 'Escape') setEditing(false); }}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #CFD6DD', borderRadius: 4, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 6 }}
                      />
                      <button onClick={applyName} style={{ padding: '4px 12px', background: '#1874D0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Save</button>
                      <button onClick={() => setEditing(false)} style={{ padding: '4px 8px', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: '#6B7280', marginLeft: 4 }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#003366' }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{user?.role}</div>
                      </div>
                      <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#1874D0', padding: 2 }}>✏️</button>
                    </div>
                  )}
                </div>
                {/* Branch info */}
                {user?.branch && (
                  <div style={{ padding: '6px 16px', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: 600 }}>BRANCH</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {HUB_BRANCHES.map(b => (
                        <button
                          key={b}
                          onClick={() => onUserChange({ ...user, branch: b })}
                          style={{ padding: '3px 8px', borderRadius: 99, border: `1px solid ${user?.branch === b ? '#1874D0' : '#E5E7EB'}`, background: user?.branch === b ? '#EBF5FF' : '#F9FAFB', color: user?.branch === b ? '#1874D0' : '#6B7280', fontSize: 11, fontWeight: user?.branch === b ? 700 : 400, cursor: 'pointer' }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Role switcher */}
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, fontWeight: 500 }}>ROLE</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ROLES.map(r => (
                      <button
                        key={r}
                        onClick={() => { onUserChange({ ...user, role: r }); closeMenu(); }}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: `1px solid ${user?.role === r ? '#1874D0' : '#CFD6DD'}`, background: user?.role === r ? '#EBF5FF' : '#fff', color: user?.role === r ? '#1874D0' : '#374151', fontSize: 11, fontWeight: user?.role === r ? 700 : 400, cursor: 'pointer' }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', alignItems: 'center', height: 52, backgroundColor: '#2D4F7E', paddingInline: 20, gap: 24, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  logo: { display: 'flex', alignItems: 'center', gap: 6, marginRight: 8, flexShrink: 0 },
  logoIcon: { fontSize: 20, color: '#4FB3FF' },
  logoText: { color: '#FFFFFF', fontSize: 16, fontWeight: 700, letterSpacing: 1 },
  items: { display: 'flex', alignItems: 'stretch', gap: 0, flex: 1, height: '100%' },
  item: { display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500, padding: '0 14px', textDecoration: 'none', borderBottom: '2px solid transparent', transition: 'color 0.15s', whiteSpace: 'nowrap' },
  itemActive: { color: '#FFFFFF', fontWeight: 600, borderBottom: '2px solid #fff' },
  actions: { display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.65)', padding: 4 },
};
