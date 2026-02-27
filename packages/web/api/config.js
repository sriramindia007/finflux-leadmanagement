// ── Config microservice ───────────────────────────────────────────────────────
// Routes: GET /api/config, GET /api/config/:key, PUT /api/config/:key
import { cors, json, parseBody, sbGetConfig, sbPutConfig, USE_DB } from './_shared.js';

// ── Default configuration values ─────────────────────────────────────────────
export const DEFAULT_CONFIGS = {
  prequal: {
    rules: [
      { id: 'loan_amount',  label: 'Loan Amount',   field: 'loanAmount',  type: 'range',    min: 5000, max: 200000, weight: 20, required: true,  enabled: true },
      { id: 'lead_type',    label: 'Lead Type',     field: 'leadType',    type: 'required', weight: 10, required: true,  enabled: true },
      { id: 'mobile',       label: 'Mobile Number', field: 'mobile',      type: 'regex',    pattern: '^[6-9]\\d{9}$', weight: 15, required: true, enabled: true },
      { id: 'work',         label: 'Work Profile',  field: 'work',        type: 'required', weight: 15, required: false, enabled: true },
      { id: 'location',     label: 'Location',      field: 'state',       type: 'required', weight: 10, required: false, enabled: true },
      { id: 'product_type', label: 'Product Type',  field: 'productType', type: 'enum',     values: ['Micro Loan', 'MSME Loan', 'Agri Loan', 'Gold Loan'], weight: 10, required: false, enabled: true },
    ],
    bands: [
      { label: 'Excellent', minScore: 800, maxScore: 900, recommendation: 'PROCEED' },
      { label: 'Very Good', minScore: 740, maxScore: 799, recommendation: 'PROCEED' },
      { label: 'Good',      minScore: 670, maxScore: 739, recommendation: 'PROCEED' },
      { label: 'Fair',      minScore: 580, maxScore: 669, recommendation: 'CONDITIONAL' },
      { label: 'Poor',      minScore: 300, maxScore: 579, recommendation: 'DECLINE' },
    ],
  },
  workflow: {
    steps: [
      { id: 'basic_details', label: 'Basic Details', role: 'Field Officer', order: 1 },
      { id: 'qualification', label: 'Qualification', role: 'Hub Team',      order: 2 },
      { id: 'meet_lead',     label: 'Meet Lead',     role: 'Field Officer', order: 3 },
    ],
    statusTransitions: {
      APPROVAL_PENDING: ['QUALIFIED', 'REJECTED'],
      QUALIFIED:        ['CONVERTED', 'REJECTED'],
      CONVERTED:        [],
      REJECTED:         [],
    },
    // Note: requireFollowUpForApproval is controlled by `policies` config only (single source of truth)
  },
  fields: {
    leadSource:       ['Field Scouting', 'Inbound Call', 'Outbound Call', 'Back Office', 'Referral', 'Digital'],
    leadType:         ['Individual', 'JLG', 'Group'],
    work:             ['Home Maker', 'Vegetable Vendor', 'Tailoring', 'Petty Shop', 'Dairy Farming', 'Flower Vendor', 'Kirana Store', 'Auto Driver', 'Construction Worker', 'Other'],
    loanPurpose:      ['Business', 'Working Capital', 'Business Expansion', 'Asset Purchase', 'Agriculture', 'Education', 'Housing', 'Medical', 'Other'],
    productType:      ['Micro Loan', 'MSME Loan', 'Agri Loan', 'Gold Loan', 'Housing Loan'],
    leadTemp:         ['Hot', 'Warm', 'Cold'],
    rejectionReasons: ['Low Credit Score', 'Duplicate Lead', 'Outside Service Area', 'Insufficient Income', 'Age Criteria', 'Existing Loan Default', 'Customer Not Interested', 'Other'],
  },
  policies: {
    requireFollowUpForApproval: true,
    minCallLogsForApproval:     1,
    dedupCheckFields:           ['mobile', 'name'],
    fieldOfficers:              ['Ramesh', 'Krishna', 'Amul', 'Sameer', 'Jagan', 'Janardhan'],
    hubTeam:                    ['Gopal', 'Suresh', 'Mohan', 'Arun', 'Ravi'],
    autoAssignRoundRobin:       false,
  },
};

const VALID_KEYS = new Set(Object.keys(DEFAULT_CONFIGS));

async function getConfigValue(key) {
  if (!VALID_KEYS.has(key)) return null;
  if (!USE_DB) return DEFAULT_CONFIGS[key];
  return (await sbGetConfig(key)) ?? DEFAULT_CONFIGS[key];
}

// ── Vercel handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const url = new URL(req.url, 'http://x');
  // Key comes from ?key= query param (set by vercel.json rewrite) or from path segment
  const parts = url.pathname.split('/').filter(Boolean);
  const key = url.searchParams.get('key') || parts[2] || null;

  // GET /api/config  →  return all keys merged
  if (req.method === 'GET' && !key) {
    const all = {};
    for (const k of VALID_KEYS) all[k] = await getConfigValue(k);
    return json(res, all);
  }

  // GET /api/config/:key
  if (req.method === 'GET' && key) {
    if (!VALID_KEYS.has(key)) return json(res, { error: 'Unknown config key' }, 404);
    return json(res, await getConfigValue(key));
  }

  // PUT /api/config/:key  (requires ADMIN_API_KEY env var + X-Admin-Key request header)
  if (req.method === 'PUT' && key) {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey) {
      console.warn('[config] ADMIN_API_KEY not set — PUT /api/config is unprotected. Set this env var in Vercel dashboard.');
    } else {
      const provided = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
      if (provided !== adminKey) return json(res, { error: 'Unauthorized' }, 401);
    }
    if (!VALID_KEYS.has(key)) return json(res, { error: 'Unknown config key' }, 404);
    const body = await parseBody(req);
    if (USE_DB) {
      await sbPutConfig(key, body);
      return json(res, { ok: true, key, persisted: true });
    }
    // USE_DB=false: change is in-memory only for this serverless instance
    return json(res, { ok: true, key, persisted: false, warning: 'SUPABASE not configured — change is NOT persisted across restarts' });
  }

  return json(res, { error: 'Not found' }, 404);
}
