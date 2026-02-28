// ── Shared utilities for all microservices ─────────────────────────────────
import { randomUUID } from 'crypto';
export { randomUUID };

export const SB_URL  = process.env.SUPABASE_URL;
export const SB_KEY  = process.env.SUPABASE_KEY;
export const USE_DB  = !!(SB_URL && SB_KEY);

// ── Supabase REST helper ──────────────────────────────────────────────────
export async function sbFetch(path, opts = {}) {
  const url = `${SB_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ── Config helpers (with 60-second in-memory cache) ─────────────────────
const _configCache = {};
export async function sbGetConfig(key) {
  const now = Date.now();
  if (_configCache[key] && now - _configCache[key].ts < 60_000) return _configCache[key].value;
  const rows = await sbFetch(`/configs?select=value&key=eq.${encodeURIComponent(key)}`);
  if (!rows?.[0]) return null;
  _configCache[key] = { value: rows[0].value, ts: now };
  return rows[0].value;
}

export async function sbPutConfig(key, value) {
  // True upsert via Supabase POST with Prefer: resolution=merge-duplicates
  await sbFetch('/configs', {
    method: 'POST',
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  delete _configCache[key]; // invalidate in-memory cache
}

// ── Lead DB helpers ──────────────────────────────────────────────────────
export async function dbGetLeads(statusFilter, searchQ) {
  let path = '/leads?select=data,id,status,name,mobile,created_at&order=created_at.desc';
  if (statusFilter && statusFilter !== 'ALL') path += `&status=eq.${encodeURIComponent(statusFilter)}`;
  const rows = await sbFetch(path);
  let leads = (rows || []).map(r => r.data);
  if (searchQ) {
    const q = searchQ.toLowerCase();
    leads = leads.filter(l => l.name?.toLowerCase().includes(q) || l.id?.includes(q) || l.mobile?.includes(q));
  }
  return leads;
}

export async function dbGetLead(id) {
  const rows = await sbFetch(`/leads?select=data&id=eq.${encodeURIComponent(id)}`);
  return rows?.[0]?.data || null;
}

// Map lead object → all DB columns (proper columns + full JSON blob)
function leadToRow(lead) {
  return {
    id:               lead.id,
    status:           lead.status,
    name:             lead.name,
    mobile:           lead.mobile,
    lead_type:        lead.leadType   || null,
    source:           lead.source     || lead.leadSource || null,
    loan_amount:      lead.loanAmount ? Number(lead.loanAmount) : null,
    loan_purpose:     lead.loanPurpose || null,
    state:            lead.state      || null,
    district:         lead.district   || null,
    assigned_to:      lead.assignedTo || null,
    created_by:       lead.createdBy  || null,
    created_at:       lead.createdAt  || new Date().toISOString(),
    converted_at:     lead.convertedAt  || null,
    rejected_at:      lead.rejectedAt   || null,
    rejection_reason: lead.rejectionReason || null,
    data:             lead,
  };
}

export async function dbInsertLead(lead) {
  const rows = await sbFetch('/leads', {
    method: 'POST',
    body: JSON.stringify(leadToRow(lead)),
  });
  return rows?.[0]?.data || lead;
}

export async function dbUpdateLead(id, patch) {
  const current = await dbGetLead(id);
  if (!current) return null;
  const updated = { ...current, ...patch };
  const row = leadToRow(updated);
  delete row.id; // don't patch primary key
  const rows = await sbFetch(`/leads?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(row),
  });
  return rows?.[0]?.data || updated;
}

export async function dbGetStats() {
  const rows = await sbFetch('/leads?select=status');
  const all = rows || [];
  return {
    total:           all.length,
    approvalPending: all.filter(r => r.status === 'APPROVAL_PENDING').length,
    qualified:       all.filter(r => r.status === 'QUALIFIED').length,
    converted:       all.filter(r => r.status === 'CONVERTED').length,
    rejected:        all.filter(r => r.status === 'REJECTED').length,
  };
}

// ── Reporting queries (use DB views) ─────────────────────────────────────
export async function dbGetMonthlyPipeline() {
  return sbFetch('/v_monthly_pipeline?select=*&limit=12');
}
export async function dbGetSourceSummary() {
  return sbFetch('/v_source_summary?select=*');
}
export async function dbGetOfficerPerformance() {
  return sbFetch('/v_officer_performance?select=*');
}
export async function dbGetStateSummary() {
  return sbFetch('/v_state_summary?select=*');
}

// ── HTTP helpers ──────────────────────────────────────────────────────────
export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function json(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(data));
}

export function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

// ── Static data ───────────────────────────────────────────────────────────
export const PINCODE_DB = {
  '110001': { state: 'Delhi', district: 'New Delhi', taluka: 'New Delhi' },
  '110011': { state: 'Delhi', district: 'South Delhi', taluka: 'Saket' },
  '110020': { state: 'Delhi', district: 'South West Delhi', taluka: 'Dwarka' },
  '201301': { state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', taluka: 'Noida' },
  '122001': { state: 'Haryana', district: 'Gurugram', taluka: 'Gurugram' },
  '400001': { state: 'Maharashtra', district: 'Mumbai City', taluka: 'Mumbai' },
  '400051': { state: 'Maharashtra', district: 'Mumbai Suburban', taluka: 'Andheri' },
  '411001': { state: 'Maharashtra', district: 'Pune', taluka: 'Pune City' },
  '500001': { state: 'Telangana', district: 'Hyderabad', taluka: 'Secunderabad' },
  '500032': { state: 'Telangana', district: 'Hyderabad', taluka: 'LB Nagar' },
  '500081': { state: 'Telangana', district: 'Hyderabad', taluka: 'Gachibowli' },
  '500003': { state: 'Telangana', district: 'Hyderabad', taluka: 'Trimulgherry' },
  '560001': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Shivajinagar' },
  '560014': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Koramangala' },
  '560045': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bengaluru North' },
  '560060': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Electronic City' },
  '560076': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'HSR Layout' },
  '580001': { state: 'Karnataka', district: 'Dharwad', taluka: 'Dharwad' },
  '590001': { state: 'Karnataka', district: 'Belagavi', taluka: 'Belgaum' },
  '520001': { state: 'Andhra Pradesh', district: 'Krishna', taluka: 'Vijayawada' },
  '522001': { state: 'Andhra Pradesh', district: 'Guntur', taluka: 'Guntur' },
  '530001': { state: 'Andhra Pradesh', district: 'Visakhapatnam', taluka: 'Visakhapatnam' },
  '600001': { state: 'Tamil Nadu', district: 'Chennai', taluka: 'Chennai North' },
  '600041': { state: 'Tamil Nadu', district: 'Chennai', taluka: 'Velachery' },
  '625001': { state: 'Tamil Nadu', district: 'Madurai', taluka: 'Madurai North' },
  '641001': { state: 'Tamil Nadu', district: 'Coimbatore', taluka: 'Coimbatore North' },
  '682001': { state: 'Kerala', district: 'Ernakulam', taluka: 'Kochi' },
  '695001': { state: 'Kerala', district: 'Thiruvananthapuram', taluka: 'Thiruvananthapuram' },
  '700001': { state: 'West Bengal', district: 'Kolkata', taluka: 'Kolkata North' },
  '800001': { state: 'Bihar', district: 'Patna', taluka: 'Patna City' },
  '302001': { state: 'Rajasthan', district: 'Jaipur', taluka: 'Jaipur City' },
  '380001': { state: 'Gujarat', district: 'Ahmedabad', taluka: 'Ahmedabad City' },
  '226001': { state: 'Uttar Pradesh', district: 'Lucknow', taluka: 'Lucknow' },
  '452001': { state: 'Madhya Pradesh', district: 'Indore', taluka: 'Indore' },
  '462001': { state: 'Madhya Pradesh', district: 'Bhopal', taluka: 'Bhopal' },
  '492001': { state: 'Chhattisgarh', district: 'Raipur', taluka: 'Raipur' },
  '834001': { state: 'Jharkhand', district: 'Ranchi', taluka: 'Ranchi' },
};

export const MOCK_LEADS = [
  {
    id: '000200920191', createdAt: '2024-01-17T09:40:00Z', createdBy: 'Ramesh', createdByRole: 'Field Officer', source: 'Field Scouting',
    name: 'Radhika Devi', mobile: '9090990909', work: 'Home Maker', leadType: 'Individual', leadSource: 'Field Scouting',
    loanAmount: 25000, loanPurpose: 'Business', productType: 'Micro Loan',
    pincode: '560045', state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bengaluru North', locality: 'Banaswadi',
    notes: 'Beside Maruthi Kirana Store', status: 'APPROVAL_PENDING', assignedTo: 'Gopal', office: 'Bengaluru North', center: 'Banaswadi C1',
    steps: [
      { id: 's1a', name: 'Basic Details', status: 'in_progress', completedAt: null, completedBy: null },
      { id: 's2a', name: 'Qualification', status: 'pending', completedAt: null, completedBy: null },
      { id: 's3a', name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
    ], callLogs: [], visitLogs: [],
  },
  {
    id: '000200920192', createdAt: '2024-01-17T10:15:00Z', createdBy: 'Krishna', createdByRole: 'Back Office', source: 'Back Office',
    name: 'Suguna', mobile: '9876543210', work: 'Vegetable Vendor', leadType: 'Individual', leadSource: 'Back Office',
    loanAmount: 15000, loanPurpose: 'Working Capital', productType: 'Micro Loan',
    pincode: '500001', state: 'Andhra Pradesh', district: 'Hyderabad', taluka: 'Secunderabad', locality: 'Secunderabad',
    notes: '', status: 'QUALIFIED', assignedTo: 'Suresh', office: 'Hyderabad Central', center: 'Secunderabad C1',
    steps: [
      { id: 's1b', name: 'Basic Details', status: 'completed', completedAt: '2024-01-17T11:00:00Z', completedBy: 'Manoj' },
      { id: 's2b', name: 'Qualification', status: 'completed', completedAt: '2024-01-17T12:00:00Z', completedBy: 'Arun' },
      { id: 's3b', name: 'Meet Lead', status: 'in_progress', completedAt: null, completedBy: null },
    ],
    callLogs: [
      { id: 'cl1', calledAt: '2024-11-22T11:30:00Z', customerPickedUp: true, leadTemp: 'Hot', notes: 'Introduced and asked for relevant details' },
      { id: 'cl2', calledAt: '2024-11-23T14:00:00Z', customerPickedUp: false, leadTemp: 'Hot', notes: 'Left a voicemail' },
    ], visitLogs: [],
  },
  {
    id: '000200920193', createdAt: '2024-01-17T11:30:00Z', createdBy: 'Amul', createdByRole: 'Field Officer', source: 'Inbound Call',
    name: 'Radhika Devi', mobile: '9123456789', work: 'Tailoring', leadType: 'Individual', leadSource: 'Inbound Call',
    loanAmount: 50000, loanPurpose: 'Business Expansion', productType: 'MSME Loan',
    pincode: '560001', state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bengaluru South', locality: 'Jayanagar',
    notes: '', status: 'CONVERTED', assignedTo: 'Ravi', office: 'Bengaluru South', center: 'Jayanagar C2',
    steps: [
      { id: 's1c', name: 'Basic Details', status: 'completed', completedAt: '2024-01-17T12:00:00Z', completedBy: 'Ravi' },
      { id: 's2c', name: 'Qualification', status: 'completed', completedAt: '2024-01-17T13:00:00Z', completedBy: 'Ravi' },
      { id: 's3c', name: 'Meet Lead', status: 'completed', completedAt: '2024-01-17T15:00:00Z', completedBy: 'Ravi' },
    ], callLogs: [], visitLogs: [],
  },
  {
    id: '000200920194', createdAt: '2024-01-18T08:50:00Z', createdBy: 'Sameer', createdByRole: 'Field Officer', source: 'Outbound Call',
    name: 'Vineeta Patel', mobile: '9988776655', work: 'Dairy Farming', leadType: 'Individual', leadSource: 'Outbound Call',
    loanAmount: 30000, loanPurpose: 'Asset Purchase', productType: 'Agri Loan',
    pincode: '580001', state: 'Karnataka', district: 'Dharwad', taluka: 'Dharwad', locality: 'Vidyanagar',
    notes: 'Interested in cattle loan', status: 'APPROVAL_PENDING', assignedTo: 'Suresh', office: 'Dharwad', center: 'Vidyanagar C1',
    steps: [
      { id: 's1d', name: 'Basic Details', status: 'in_progress', completedAt: null, completedBy: null },
      { id: 's2d', name: 'Qualification', status: 'pending', completedAt: null, completedBy: null },
      { id: 's3d', name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
    ], callLogs: [], visitLogs: [],
  },
  {
    id: '000200920195', createdAt: '2024-01-19T03:20:00Z', createdBy: 'Jagan', createdByRole: 'Field Officer', source: 'Field Scouting',
    name: 'Pooja Verma', mobile: '9771234567', work: 'Petty Shop', leadType: 'Individual', leadSource: 'Field Scouting',
    loanAmount: 20000, loanPurpose: 'Working Capital', productType: 'Micro Loan',
    pincode: '522001', state: 'Andhra Pradesh', district: 'Guntur', taluka: 'Guntur', locality: 'Brodipet',
    notes: '', status: 'QUALIFIED', assignedTo: 'Mohan', office: 'Guntur', center: 'Brodipet C1',
    steps: [
      { id: 's1e', name: 'Basic Details', status: 'completed', completedAt: '2024-01-19T04:00:00Z', completedBy: 'Mohan' },
      { id: 's2e', name: 'Qualification', status: 'in_progress', completedAt: null, completedBy: null },
      { id: 's3e', name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
    ], callLogs: [], visitLogs: [],
  },
  {
    id: '000200920196', createdAt: '2024-01-20T09:05:00Z', createdBy: 'Janardhan', createdByRole: 'Field Officer', source: 'Inbound Call',
    name: 'Suguna Rao', mobile: '9845678901', work: 'Flower Vendor', leadType: 'Individual', leadSource: 'Inbound Call',
    loanAmount: 12000, loanPurpose: 'Business', productType: 'Micro Loan',
    pincode: '500003', state: 'Andhra Pradesh', district: 'Hyderabad', taluka: 'Secunderabad', locality: 'Trimulgherry',
    notes: '', status: 'REJECTED', assignedTo: 'Arun', rejectionReason: 'Low Credit Score', office: 'Hyderabad East', center: 'Trimulgherry C1',
    steps: [
      { id: 's1f', name: 'Basic Details', status: 'completed', completedAt: '2024-01-20T10:00:00Z', completedBy: 'Arun' },
      { id: 's2f', name: 'Qualification', status: 'completed', completedAt: '2024-01-20T11:00:00Z', completedBy: 'Arun' },
      { id: 's3f', name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
    ], callLogs: [], visitLogs: [],
  },
];
