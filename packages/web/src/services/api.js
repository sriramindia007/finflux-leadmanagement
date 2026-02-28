const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getLeads: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/leads${q ? '?' + q : ''}`);
  },
  getLead: (id) => request(`/leads/${id}`),
  getStats: () => request('/leads/stats'),
  createLead: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addCallLog: (id, data) => request(`/leads/${id}/call-logs`, { method: 'POST', body: JSON.stringify(data) }),
  updateStep: (leadId, stepId, data) => request(`/leads/${leadId}/steps/${stepId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  lookupPincode: (pin) => request(`/pincode/${pin}`),
  prequalify: (id) => request(`/leads/${id}/prequalify`, { method: 'POST' }),
  addVisitLog: (id, data) => request(`/leads/${id}/visit-logs`, { method: 'POST', body: JSON.stringify(data) }),
  bulkUpload: (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const res = await fetch(`${BASE}/leads/bulk`, {
            method: 'POST',
            body: e.target.result,
            headers: { 'Content-Type': 'text/csv' },
          });
          if (!res.ok) throw new Error(`API error ${res.status}`);
          resolve(await res.json());
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    }),
  downloadTemplate: async () => {
    const res = await fetch(`${BASE}/leads/template`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead-upload-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  getReports: () => request('/reports'),
  // Config microservice
  getConfig:      ()        => request('/config'),
  getConfigKey:   (key)     => request(`/config/${key}`),
  putConfig:      (key, v)  => {
    const headers = { 'Content-Type': 'application/json' };
    const adminKey = import.meta.env?.VITE_ADMIN_API_KEY;
    if (adminKey) headers['X-Admin-Key'] = adminKey;
    return request(`/config/${key}`, { method: 'PUT', body: JSON.stringify(v), headers });
  },
};
