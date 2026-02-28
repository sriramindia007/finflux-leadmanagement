import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import LeadsPoolPage from './pages/LeadsPoolPage';
import LeadDetailPage from './pages/LeadDetailPage';
import CallLogsPage from './pages/CallLogsPage';
import ConfigPage from './pages/ConfigPage';
import ReportsPage from './pages/ReportsPage';

const DEFAULT_USER = { name: 'Hub Officer', role: 'Hub Team', branch: 'HQ', centre: '' };

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hub_user')) || DEFAULT_USER; } catch { return DEFAULT_USER; }
  });

  const handleUserChange = (u) => {
    localStorage.setItem('hub_user', JSON.stringify(u));
    setUser(u);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F6F9FC' }}>
      <TopNav user={user} onUserChange={handleUserChange} />
      <Routes>
        <Route path="/" element={<Navigate to="/leads" replace />} />
        <Route path="/leads" element={<LeadsPoolPage user={user} />} />
        <Route path="/leads/:id" element={<LeadDetailPage user={user} />} />
        <Route path="/leads/:id/call-logs" element={<CallLogsPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/todo" element={<Placeholder title="To-Do" />} />
        <Route path="/collections" element={<Placeholder title="Collections" />} />
        <Route path="/customers" element={<Placeholder title="All Customers" />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </div>
  );
}

function Placeholder({ title }) {
  return <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 18 }}>{title} — coming soon</div>;
}
