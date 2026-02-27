// ── Lead & Pincode microservice ───────────────────────────────────────────────
import {
  randomUUID, cors, json, parseBody,
  USE_DB, PINCODE_DB, MOCK_LEADS,
  dbGetLeads, dbGetLead, dbInsertLead, dbUpdateLead, dbGetStats,
  sbFetch, sbGetConfig, sbPutConfig,
} from './_shared.js';
import { runScoringEngine } from './prequal.js';
import { DEFAULT_CONFIGS }  from './config.js';

// ── In-memory fallback (local dev / no Supabase) ──────────────────────────────
let _memLeads = null;
function getMemLeads() {
  if (!_memLeads) _memLeads = MOCK_LEADS.map(l => JSON.parse(JSON.stringify(l)));
  return _memLeads;
}

// ── One-time seeding (only if DB is empty) ────────────────────────────────────
let seeded = false;
async function ensureSeeded() {
  if (!USE_DB || seeded) return;
  const rows = await sbFetch('/leads?select=id&limit=1');
  if (!rows?.length) {
    for (const l of MOCK_LEADS) {
      await sbFetch('/leads', {
        method: 'POST',
        body: JSON.stringify({ id: l.id, status: l.status, name: l.name, mobile: l.mobile, data: l }),
      });
    }
  }
  seeded = true;
}

// Guard: refuse to serve mock data in production (prevents accidental data leaks)
if (!USE_DB && process.env.NODE_ENV === 'production') {
  console.error('FATAL: SUPABASE_URL/SUPABASE_KEY not set in production. Refusing to start with in-memory data.');
}

// ── Route handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (!USE_DB && process.env.NODE_ENV === 'production') {
    return json(res, { error: 'Database not configured. Set SUPABASE_URL and SUPABASE_KEY.' }, 503);
  }
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (USE_DB) await ensureSeeded();

  const url  = new URL(req.url, 'http://x');
  const path = url.pathname;
  const m    = req.method;

  // ── Config routes: GET /api/config, GET /api/config/:key, PUT /api/config/:key ──
  const configMatch = path.match(/^\/api\/config(?:\/([^/]+))?$/);
  if (configMatch) {
    const VALID_KEYS = new Set(Object.keys(DEFAULT_CONFIGS));
    const configKey  = configMatch[1] || null;

    // GET /api/config  →  all configs
    if (m === 'GET' && !configKey) {
      const all = {};
      for (const k of VALID_KEYS) {
        all[k] = USE_DB ? ((await sbGetConfig(k)) ?? DEFAULT_CONFIGS[k]) : DEFAULT_CONFIGS[k];
      }
      return json(res, all);
    }

    // GET /api/config/:key
    if (m === 'GET' && configKey) {
      if (!VALID_KEYS.has(configKey)) return json(res, { error: 'Unknown config key' }, 404);
      const val = USE_DB ? ((await sbGetConfig(configKey)) ?? DEFAULT_CONFIGS[configKey]) : DEFAULT_CONFIGS[configKey];
      return json(res, val);
    }

    // PUT /api/config/:key  (requires X-Admin-Key header if ADMIN_API_KEY env is set)
    if (m === 'PUT' && configKey) {
      const adminKey = process.env.ADMIN_API_KEY;
      if (adminKey) {
        const provided = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
        if (provided !== adminKey) return json(res, { error: 'Unauthorized' }, 401);
      } else {
        console.warn('[config] ADMIN_API_KEY not set — PUT /api/config is unprotected.');
      }
      if (!VALID_KEYS.has(configKey)) return json(res, { error: 'Unknown config key' }, 404);
      const body = await parseBody(req);
      if (USE_DB) {
        await sbPutConfig(configKey, body);
        return json(res, { ok: true, key: configKey, persisted: true });
      }
      return json(res, { ok: true, key: configKey, persisted: false, warning: 'SUPABASE not configured — change is NOT persisted' });
    }

    return json(res, { error: 'Method not allowed' }, 405);
  }

  // ── GET /api/pincode/:pin ───────────────────────────────────────────────────
  const pinMatch = path.match(/^\/api\/pincode\/(\d+)$/);
  if (m === 'GET' && pinMatch) {
    const info = PINCODE_DB[pinMatch[1]];
    return info ? json(res, info) : json(res, { error: 'Pincode not found' }, 404);
  }

  // ── GET /api/leads/stats ────────────────────────────────────────────────────
  if (m === 'GET' && path === '/api/leads/stats') {
    if (USE_DB) return json(res, await dbGetStats());
    const leads = getMemLeads();
    return json(res, {
      total:          leads.length,
      approvalPending: leads.filter(l => l.status === 'APPROVAL_PENDING').length,
      qualified:      leads.filter(l => l.status === 'QUALIFIED').length,
      converted:      leads.filter(l => l.status === 'CONVERTED').length,
      rejected:       leads.filter(l => l.status === 'REJECTED').length,
    });
  }

  // ── GET /api/leads ──────────────────────────────────────────────────────────
  if (m === 'GET' && path === '/api/leads') {
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    if (USE_DB) {
      const leads = await dbGetLeads(status, search);
      return json(res, { data: leads, total: leads.length });
    }
    let result = [...getMemLeads()];
    if (status && status !== 'ALL') result = result.filter(l => l.status === status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name?.toLowerCase().includes(q) || l.id?.includes(q) || l.mobile?.includes(q));
    }
    return json(res, { data: result, total: result.length });
  }

  // ── POST /api/leads ─────────────────────────────────────────────────────────
  if (m === 'POST' && path === '/api/leads') {
    const body = await parseBody(req);

    // Workflow steps from config (or defaults)
    const workflowConfig = USE_DB ? (await sbGetConfig('workflow')) : null;
    const stepDefs = workflowConfig?.steps || DEFAULT_CONFIGS.workflow.steps;
    const steps = (stepDefs.length ? stepDefs : DEFAULT_CONFIGS.workflow.steps)
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({
        id:          randomUUID(),
        name:        s.label,
        status:      i === 0 ? 'in_progress' : 'pending',
        completedAt: null,
        completedBy: null,
      }));

    const newLead = {
      ...body,
      id:        String(Date.now()).padStart(12, '0'),
      createdAt: new Date().toISOString(),
      status:    'APPROVAL_PENDING',
      steps,
      callLogs:  [],
      visitLogs: [],
    };

    if (USE_DB) return json(res, await dbInsertLead(newLead), 201);
    getMemLeads().unshift(newLead);
    return json(res, newLead, 201);
  }

  // ── Routes with :id ─────────────────────────────────────────────────────────
  const idMatch = path.match(/^\/api\/leads\/([^/]+)(\/.*)?$/);
  if (!idMatch) return json(res, { error: 'Not found' }, 404);

  const id   = idMatch[1];
  const rest = idMatch[2] || '';

  // ── GET /api/leads/:id ──────────────────────────────────────────────────────
  if (m === 'GET' && rest === '') {
    if (USE_DB) {
      const lead = await dbGetLead(id);
      return lead ? json(res, lead) : json(res, { error: 'Lead not found' }, 404);
    }
    const lead = getMemLeads().find(l => l.id === id);
    return lead ? json(res, lead) : json(res, { error: 'Lead not found' }, 404);
  }

  // ── PATCH /api/leads/:id ────────────────────────────────────────────────────
  if (m === 'PATCH' && rest === '') {
    const body = await parseBody(req);
    if (USE_DB) {
      const updated = await dbUpdateLead(id, body);
      return updated ? json(res, updated) : json(res, { error: 'Lead not found' }, 404);
    }
    const leads = getMemLeads();
    const idx = leads.findIndex(l => l.id === id);
    if (idx === -1) return json(res, { error: 'Lead not found' }, 404);
    leads[idx] = { ...leads[idx], ...body };
    return json(res, leads[idx]);
  }

  // ── POST /api/leads/:id/call-logs ───────────────────────────────────────────
  if (m === 'POST' && rest === '/call-logs') {
    const body = await parseBody(req);
    const log  = { id: randomUUID(), ...body, calledAt: new Date().toISOString() };
    if (USE_DB) {
      const lead = await dbGetLead(id);
      if (!lead) return json(res, { error: 'Lead not found' }, 404);
      lead.callLogs = [...(lead.callLogs || []), log];
      await dbUpdateLead(id, { callLogs: lead.callLogs });
      return json(res, log, 201);
    }
    const lead = getMemLeads().find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    lead.callLogs.push(log);
    return json(res, log, 201);
  }

  // ── POST /api/leads/:id/visit-logs ──────────────────────────────────────────
  if (m === 'POST' && rest === '/visit-logs') {
    const body = await parseBody(req);
    const log  = { id: randomUUID(), ...body, visitedAt: body.visitedAt || new Date().toISOString() };
    if (USE_DB) {
      const lead = await dbGetLead(id);
      if (!lead) return json(res, { error: 'Lead not found' }, 404);
      lead.visitLogs = [...(lead.visitLogs || []), log];
      await dbUpdateLead(id, { visitLogs: lead.visitLogs });
      return json(res, log, 201);
    }
    const lead = getMemLeads().find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    if (!lead.visitLogs) lead.visitLogs = [];
    lead.visitLogs.push(log);
    return json(res, log, 201);
  }

  // ── POST /api/leads/:id/prequalify ──────────────────────────────────────────
  if (m === 'POST' && rest === '/prequalify') {
    const lead = USE_DB ? await dbGetLead(id) : getMemLeads().find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);

    // Load prequal config — falls back to defaults if not in DB
    const prequalConfig = USE_DB ? ((await sbGetConfig('prequal')) ?? DEFAULT_CONFIGS.prequal) : DEFAULT_CONFIGS.prequal;
    const result = runScoringEngine(lead, prequalConfig);

    if (USE_DB) {
      await dbUpdateLead(id, { prequalResult: result });
    } else {
      const l = getMemLeads().find(l => l.id === id);
      if (l) l.prequalResult = result;
    }
    return json(res, result);
  }

  // ── PATCH /api/leads/:id/steps/:stepId ─────────────────────────────────────
  const stepMatch = rest.match(/^\/steps\/([^/]+)$/);
  if (m === 'PATCH' && stepMatch) {
    const body = await parseBody(req);
    if (USE_DB) {
      const lead = await dbGetLead(id);
      if (!lead) return json(res, { error: 'Lead not found' }, 404);
      const steps   = lead.steps || [];
      const stepIdx = steps.findIndex(s => s.id === stepMatch[1]);
      if (stepIdx === -1) return json(res, { error: 'Step not found' }, 404);
      Object.assign(steps[stepIdx], body);
      // Auto-advance next step to in_progress when current completes
      if (body.status === 'completed' && stepIdx + 1 < steps.length) {
        if (steps[stepIdx + 1].status === 'pending') steps[stepIdx + 1].status = 'in_progress';
      }
      return json(res, await dbUpdateLead(id, { steps }));
    }
    const leads   = getMemLeads();
    const lead    = leads.find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    const stepIdx = lead.steps.findIndex(s => s.id === stepMatch[1]);
    if (stepIdx === -1) return json(res, { error: 'Step not found' }, 404);
    Object.assign(lead.steps[stepIdx], body);
    if (body.status === 'completed' && stepIdx + 1 < lead.steps.length) {
      if (lead.steps[stepIdx + 1].status === 'pending') lead.steps[stepIdx + 1].status = 'in_progress';
    }
    return json(res, lead);
  }

  return json(res, { error: 'Not found' }, 404);
}
