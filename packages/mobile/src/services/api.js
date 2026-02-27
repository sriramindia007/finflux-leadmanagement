const BASE_URL = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getLeads: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leads${query ? '?' + query : ''}`);
  },
  getLead: (id) => request(`/leads/${id}`),
  getStats: () => request('/leads/stats'),
  createLead: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStep: (leadId, stepId, data) =>
    request(`/leads/${leadId}/steps/${stepId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  lookupPincode: (pin) => request(`/pincode/${pin}`),
  prequalify: (id) => request(`/leads/${id}/prequalify`, { method: 'POST' }),
  addVisitLog: (id, data) => request(`/leads/${id}/visit-logs`, { method: 'POST', body: JSON.stringify(data) }),
  addCallLog: (id, data) => request(`/leads/${id}/call-logs`, { method: 'POST', body: JSON.stringify(data) }),
};
