// API service — points to the shared web API backend so mobile and web share one data store.
const BASE = 'https://finflux-leadmanagement.vercel.app/api';

async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

export const api = {
  getLeads:   (p = {}) => { const q = new URLSearchParams(p).toString(); return req(`/leads${q ? '?' + q : ''}`); },
  getLead:    (id)      => req(`/leads/${id}`),
  getStats:   ()        => req('/leads/stats'),
  createLead: (d)       => req('/leads', { method: 'POST', body: JSON.stringify(d) }),
  updateLead: (id, d)   => req(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  updateStep: (lid, sid, d) => req(`/leads/${lid}/steps/${sid}`, { method: 'PATCH', body: JSON.stringify(d) }),
  createCallLog: (lid, d) => req(`/leads/${lid}/call-logs`, { method: 'POST', body: JSON.stringify(d) }),
  lookupPincode: (pin) => req(`/pincode/${pin}`),
  prequalify: (id) => req(`/leads/${id}/prequalify`, { method: 'POST' }),
  addVisitLog:   (id, d) => req(`/leads/${id}/visit-logs`, { method: 'POST', body: JSON.stringify(d) }),
  getConfigKey:  (key)   => req(`/config/${key}`),
};
