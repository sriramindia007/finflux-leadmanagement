// ── Lead & Pincode microservice ───────────────────────────────────────────────
import {
  randomUUID, cors, json, parseBody,
  USE_DB, PINCODE_DB, MOCK_LEADS,
  dbGetLeads, dbGetLead, dbInsertLead, dbUpdateLead, dbGetStats,
  dbGetMonthlyPipeline, dbGetSourceSummary, dbGetOfficerPerformance, dbGetStateSummary, dbGetBranchSummary,
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
        body: JSON.stringify({
          id: l.id, status: l.status, name: l.name, mobile: l.mobile,
          source: l.source || l.leadSource || null,
          lead_type: l.leadType || null,
          loan_amount: l.loanAmount ? Number(l.loanAmount) : null,
          loan_purpose: l.loanPurpose || null,
          state: l.state || null, district: l.district || null,
          assigned_to: l.assignedTo || null, created_by: l.createdBy || null,
          created_at: l.createdAt || new Date().toISOString(),
          branch: l.office || null, village: l.locality || null, centre: l.center || null,
          data: l,
        }),
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
    const pin = pinMatch[1];
    const local = PINCODE_DB[pin];
    if (local) return json(res, local);
    // Fall back to India Post API for any pincode not in local DB
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await r.json();
      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0];
        return json(res, {
          state:    po.State,
          district: po.District,
          taluka:   po.Division || po.District,
          locality: po.Name,
        });
      }
    } catch (_) { /* fall through to 404 */ }
    return json(res, { error: 'Pincode not found' }, 404);
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

  // ── GET /api/leads/workload ─────────────────────────────────────────────────
  if (m === 'GET' && path === '/api/leads/workload') {
    const leads = USE_DB ? await dbGetLeads(null, null) : getMemLeads();
    const active = ['APPROVAL_PENDING', 'QUALIFIED'];
    const workload = {};
    for (const l of leads) {
      if (!l.assignedTo || !active.includes(l.status)) continue;
      workload[l.assignedTo] = (workload[l.assignedTo] || 0) + 1;
    }
    return json(res, workload);
  }

  // ── GET /api/leads ──────────────────────────────────────────────────────────
  if (m === 'GET' && path === '/api/leads') {
    const status     = url.searchParams.get('status');
    const search     = url.searchParams.get('search');
    const assignedTo = url.searchParams.get('assignedTo');
    if (USE_DB) {
      const leads = await dbGetLeads(status, search);
      const result = assignedTo ? leads.filter(l => l.assignedTo === assignedTo) : leads;
      return json(res, { data: result, total: result.length });
    }
    let result = [...getMemLeads()];
    if (status && status !== 'ALL') result = result.filter(l => l.status === status);
    if (assignedTo) result = result.filter(l => l.assignedTo === assignedTo);
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

  // ── GET /api/leads/template ─────────────────────────────────────────────────
  if (m === 'GET' && path === '/api/leads/template') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="lead-upload-template.csv"');
    res.end('name,mobile,work,leadType,leadSource,loanAmount,loanPurpose,pincode,branch,village,centre,notes\n');
    return;
  }

  // ── POST /api/leads/bulk ────────────────────────────────────────────────────
  if (m === 'POST' && path === '/api/leads/bulk') {
    // Read raw CSV text body (Content-Type: text/csv, no multipart)
    const csvText = await new Promise(resolve => {
      let body = '';
      req.on('data', c => (body += c));
      req.on('end', () => resolve(body));
    });

    const lines = csvText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return json(res, { error: 'CSV must contain a header row and at least one data row' }, 400);
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const results = { created: 0, duplicates: 0, failed: 0, errors: [] };

    // Fetch all existing leads for dedup check
    const existingLeads = USE_DB ? await dbGetLeads() : [...getMemLeads()];

    // Build workflow steps (same logic as POST /api/leads)
    const workflowConfig = USE_DB ? (await sbGetConfig('workflow')) : null;
    const stepDefs = workflowConfig?.steps || DEFAULT_CONFIGS.workflow.steps;
    const makeSteps = () =>
      (stepDefs.length ? stepDefs : DEFAULT_CONFIGS.workflow.steps)
        .sort((a, b) => a.order - b.order)
        .map((s, i) => ({
          id:          randomUUID(),
          name:        s.label,
          status:      i === 0 ? 'in_progress' : 'pending',
          completedAt: null,
          completedBy: null,
        }));

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });

      if (!row.name) {
        results.failed++;
        results.errors.push({ row: rowNum, mobile: row.mobile || '', reason: 'Name is required' });
        continue;
      }
      if (!row.mobile) {
        results.failed++;
        results.errors.push({ row: rowNum, mobile: '', reason: 'Mobile number is required' });
        continue;
      }
      if (!/^[6-9]\d{9}$/.test(row.mobile)) {
        results.failed++;
        results.errors.push({ row: rowNum, mobile: row.mobile, reason: 'Invalid mobile number — must be 10-digit starting with 6-9' });
        continue;
      }

      const dup = existingLeads.find(l => l.mobile === row.mobile);
      if (dup) {
        results.duplicates++;
        results.errors.push({ row: rowNum, mobile: row.mobile, reason: `Duplicate — existing Lead ID ${dup.id}` });
        continue;
      }

      const newLead = {
        id:          String(Date.now() + i).padStart(12, '0'),
        name:        row.name,
        mobile:      row.mobile,
        work:        row.work        || '',
        leadType:    row.leadtype    || 'Individual',
        leadSource:  row.leadsource  || 'Bulk Upload',
        loanAmount:  row.loanamount  ? Number(row.loanamount) : 0,
        loanPurpose: row.loanpurpose || '',
        pincode:     row.pincode     || '',
        branch:      row.branch      || '',
        village:     row.village     || '',
        centre:      row.centre      || '',
        notes:       row.notes       || '',
        source:      'Bulk Upload',
        createdAt:   new Date().toISOString(),
        createdBy:   'Bulk Upload',
        status:      'APPROVAL_PENDING',
        steps:       makeSteps(),
        callLogs:    [],
        visitLogs:   [],
      };

      if (USE_DB) {
        await dbInsertLead(newLead);
      } else {
        getMemLeads().unshift(newLead);
      }
      existingLeads.push(newLead); // keep local dedup list current
      results.created++;
    }

    return json(res, results);
  }

  // ── GET /api/reports ────────────────────────────────────────────────────────
  if (m === 'GET' && path === '/api/reports') {
    if (!USE_DB) {
      // Compute from mock data so the page is never blank in dev
      const leads = getMemLeads();
      const byMonth = {};
      leads.forEach(l => {
        const mk = l.createdAt ? l.createdAt.slice(0, 7) : 'Unknown';
        if (!byMonth[mk]) byMonth[mk] = { month: mk, total_leads: 0, pending: 0, qualified: 0, converted: 0, rejected: 0, converted_amount: 0 };
        byMonth[mk].total_leads++;
        if (l.status === 'APPROVAL_PENDING') byMonth[mk].pending++;
        if (l.status === 'QUALIFIED')        byMonth[mk].qualified++;
        if (l.status === 'CONVERTED')        { byMonth[mk].converted++; byMonth[mk].converted_amount += Number(l.loanAmount || 0); }
        if (l.status === 'REJECTED')         byMonth[mk].rejected++;
      });
      const bySource = {};
      leads.forEach(l => {
        const sk = l.source || 'Unknown';
        if (!bySource[sk]) bySource[sk] = { source: sk, total: 0, converted: 0, rejected: 0, converted_amount: 0 };
        bySource[sk].total++;
        if (l.status === 'CONVERTED') { bySource[sk].converted++; bySource[sk].converted_amount += Number(l.loanAmount || 0); }
        if (l.status === 'REJECTED')  bySource[sk].rejected++;
      });
      Object.values(bySource).forEach(r => { r.conversion_rate_pct = r.total ? +(r.converted * 100 / r.total).toFixed(1) : 0; });
      const byOfficer = {};
      leads.forEach(l => {
        const ok = l.assignedTo || 'Unassigned';
        if (!byOfficer[ok]) byOfficer[ok] = { officer: ok, branch: l.branch || l.office || '', total_leads: 0, converted: 0, rejected: 0, pending: 0, converted_amount: 0 };
        byOfficer[ok].total_leads++;
        if (l.status === 'CONVERTED')        { byOfficer[ok].converted++; byOfficer[ok].converted_amount += Number(l.loanAmount || 0); }
        if (l.status === 'REJECTED')         byOfficer[ok].rejected++;
        if (l.status === 'APPROVAL_PENDING') byOfficer[ok].pending++;
      });
      Object.values(byOfficer).forEach(r => { r.conversion_rate_pct = r.total_leads ? +(r.converted * 100 / r.total_leads).toFixed(1) : 0; });
      const byBranch = {};
      leads.forEach(l => {
        const bk = l.branch || l.office || 'Unknown';
        if (!byBranch[bk]) byBranch[bk] = { branch: bk, total_leads: 0, pending: 0, converted: 0, rejected: 0, converted_amount: 0 };
        byBranch[bk].total_leads++;
        if (l.status === 'APPROVAL_PENDING') byBranch[bk].pending++;
        if (l.status === 'CONVERTED') { byBranch[bk].converted++; byBranch[bk].converted_amount += Number(l.loanAmount || 0); }
        if (l.status === 'REJECTED')  byBranch[bk].rejected++;
      });
      Object.values(byBranch).forEach(r => { r.conversion_rate_pct = r.total_leads ? +(r.converted * 100 / r.total_leads).toFixed(1) : 0; });
      return json(res, {
        monthly:  Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month)),
        sources:  Object.values(bySource).sort((a, b) => b.total - a.total),
        officers: Object.values(byOfficer).sort((a, b) => b.converted - a.converted),
        branches: Object.values(byBranch).sort((a, b) => b.total_leads - a.total_leads),
        summary: {
          total: leads.length,
          approvalPending: leads.filter(l => l.status === 'APPROVAL_PENDING').length,
          qualified:       leads.filter(l => l.status === 'QUALIFIED').length,
          converted: leads.filter(l => l.status === 'CONVERTED').length,
          rejected:  leads.filter(l => l.status === 'REJECTED').length,
          totalDisbursed: leads.filter(l => l.status === 'CONVERTED').reduce((s, l) => s + Number(l.loanAmount || 0), 0),
        },
      });
    }
    const [monthly, sources, officers, branches] = await Promise.all([
      dbGetMonthlyPipeline(),
      dbGetSourceSummary(),
      dbGetOfficerPerformance(),
      dbGetBranchSummary(),
    ]);
    const stats = await dbGetStats();
    const allConverted = await sbFetch('/leads?select=loan_amount&status=eq.CONVERTED');
    const totalDisbursed = (allConverted || []).reduce((s, r) => s + Number(r.loan_amount || 0), 0);
    return json(res, { monthly, sources, officers, branches, summary: { ...stats, totalDisbursed } });
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

  // ── POST /api/leads/:id/notes ───────────────────────────────────────────────
  if (m === 'POST' && rest === '/notes') {
    const body = await parseBody(req);
    if (!body.text?.trim()) return json(res, { error: 'Note text is required' }, 400);
    const note = { id: randomUUID(), text: body.text.trim(), addedBy: body.addedBy || 'Hub Team', addedAt: new Date().toISOString() };
    if (USE_DB) {
      const lead = await dbGetLead(id);
      if (!lead) return json(res, { error: 'Lead not found' }, 404);
      const notesLog = [...(lead.notesLog || []), note];
      await dbUpdateLead(id, { notesLog });
      return json(res, note, 201);
    }
    const lead = getMemLeads().find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    if (!lead.notesLog) lead.notesLog = [];
    lead.notesLog.push(note);
    return json(res, note, 201);
  }

  // ── POST /api/leads/:id/start-over ──────────────────────────────────────────
  if (m === 'POST' && rest === '/start-over') {
    const body = await parseBody(req);
    const workflowConfig = USE_DB ? (await sbGetConfig('workflow')) : null;
    const stepDefs = workflowConfig?.steps || DEFAULT_CONFIGS.workflow.steps;
    const freshSteps = (stepDefs.length ? stepDefs : DEFAULT_CONFIGS.workflow.steps)
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({ id: randomUUID(), name: s.label, status: i === 0 ? 'in_progress' : 'pending', completedAt: null, completedBy: null }));
    const resetNote = { id: randomUUID(), text: `Lead restarted — steps reset to Approval Pending${body.reason ? `. Reason: ${body.reason}` : ''}`, addedBy: body.addedBy || 'Hub Team', addedAt: new Date().toISOString() };
    if (USE_DB) {
      const lead = await dbGetLead(id);
      if (!lead) return json(res, { error: 'Lead not found' }, 404);
      const notesLog = [...(lead.notesLog || []), resetNote];
      const updated = await dbUpdateLead(id, { status: 'APPROVAL_PENDING', steps: freshSteps, notesLog, rejectionReason: null });
      return json(res, updated);
    }
    const leads = getMemLeads();
    const lead  = leads.find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    lead.status = 'APPROVAL_PENDING';
    lead.steps  = freshSteps;
    if (!lead.notesLog) lead.notesLog = [];
    lead.notesLog.push(resetNote);
    lead.rejectionReason = null;
    return json(res, lead);
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
