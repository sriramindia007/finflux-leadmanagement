const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { mockLeads } = require('./mockData');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Mock pincode database — covers major Indian cities/towns
const PINCODE_DB = {
  '110001': { state: 'Delhi', district: 'New Delhi', taluka: 'New Delhi' },
  '110011': { state: 'Delhi', district: 'South Delhi', taluka: 'Saket' },
  '110020': { state: 'Delhi', district: 'South West Delhi', taluka: 'Dwarka' },
  '201301': { state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', taluka: 'Noida' },
  '122001': { state: 'Haryana', district: 'Gurugram', taluka: 'Gurugram' },
  '226001': { state: 'Uttar Pradesh', district: 'Lucknow', taluka: 'Lucknow' },
  '302001': { state: 'Rajasthan', district: 'Jaipur', taluka: 'Jaipur City' },
  '380001': { state: 'Gujarat', district: 'Ahmedabad', taluka: 'Ahmedabad City' },
  '395001': { state: 'Gujarat', district: 'Surat', taluka: 'Surat City' },
  '400001': { state: 'Maharashtra', district: 'Mumbai City', taluka: 'Mumbai' },
  '400051': { state: 'Maharashtra', district: 'Mumbai Suburban', taluka: 'Andheri' },
  '411001': { state: 'Maharashtra', district: 'Pune', taluka: 'Pune City' },
  '431001': { state: 'Maharashtra', district: 'Aurangabad', taluka: 'Aurangabad' },
  '440001': { state: 'Maharashtra', district: 'Nagpur', taluka: 'Nagpur City' },
  '452001': { state: 'Madhya Pradesh', district: 'Indore', taluka: 'Indore' },
  '462001': { state: 'Madhya Pradesh', district: 'Bhopal', taluka: 'Bhopal' },
  '492001': { state: 'Chhattisgarh', district: 'Raipur', taluka: 'Raipur' },
  '500001': { state: 'Telangana', district: 'Hyderabad', taluka: 'Secunderabad' },
  '500032': { state: 'Telangana', district: 'Hyderabad', taluka: 'LB Nagar' },
  '500081': { state: 'Telangana', district: 'Hyderabad', taluka: 'Gachibowli' },
  '520001': { state: 'Andhra Pradesh', district: 'Krishna', taluka: 'Vijayawada' },
  '530001': { state: 'Andhra Pradesh', district: 'Visakhapatnam', taluka: 'Visakhapatnam' },
  '533001': { state: 'Andhra Pradesh', district: 'East Godavari', taluka: 'Kakinada' },
  '560001': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bengaluru Central' },
  '560034': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Whitefield' },
  '560045': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bengaluru North' },
  '560068': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bengaluru South' },
  '571401': { state: 'Karnataka', district: 'Mandya', taluka: 'Mandya' },
  '577001': { state: 'Karnataka', district: 'Shivamogga', taluka: 'Shimoga' },
  '590001': { state: 'Karnataka', district: 'Belagavi', taluka: 'Belgaum' },
  '600001': { state: 'Tamil Nadu', district: 'Chennai', taluka: 'Chennai North' },
  '600041': { state: 'Tamil Nadu', district: 'Chennai', taluka: 'Velachery' },
  '641001': { state: 'Tamil Nadu', district: 'Coimbatore', taluka: 'Coimbatore North' },
  '625001': { state: 'Tamil Nadu', district: 'Madurai', taluka: 'Madurai North' },
  '682001': { state: 'Kerala', district: 'Ernakulam', taluka: 'Kochi' },
  '695001': { state: 'Kerala', district: 'Thiruvananthapuram', taluka: 'Thiruvananthapuram' },
  '700001': { state: 'West Bengal', district: 'Kolkata', taluka: 'Kolkata North' },
  '751001': { state: 'Odisha', district: 'Bhubaneswar', taluka: 'Bhubaneswar' },
  '800001': { state: 'Bihar', district: 'Patna', taluka: 'Patna City' },
  '834001': { state: 'Jharkhand', district: 'Ranchi', taluka: 'Ranchi' },
};

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/csv', limit: '5mb' }));

// In-memory leads store
let leads = [...mockLeads];

// In-memory bulk-upload job log
let uploadJobs = [];

// ── In-memory workflow / config store ─────────────────────────
let workflowConfig = {
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
};

// Helper: build steps array from workflowConfig for a new lead
function buildStepsFromConfig() {
  const sorted = [...(workflowConfig.steps || [])].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) {
    // Safety: if all steps were deleted via ConfigPage, fall back to 1 default step
    return [{ id: uuidv4(), name: 'Basic Details', stepDefId: 'basic_details', role: 'Field Officer', status: 'in_progress', completedAt: null, completedBy: null }];
  }
  return sorted.map((s, i) => ({
    id:          uuidv4(),
    name:        s.label,
    stepDefId:   s.id,      // link back to the config step definition
    role:        s.role,
    status:      i === 0 ? 'in_progress' : 'pending',
    completedAt: null,
    completedBy: null,
  }));
}

// ── GET /api/config ────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({ workflow: workflowConfig });
});

// ── GET /api/config/:key ───────────────────────────────────────
app.get('/api/config/:key', (req, res) => {
  if (req.params.key === 'workflow') return res.json(workflowConfig);
  res.status(404).json({ error: 'Unknown config key' });
});

// ── PUT /api/config/:key ───────────────────────────────────────
app.put('/api/config/:key', (req, res) => {
  if (req.params.key === 'workflow') {
    workflowConfig = { ...workflowConfig, ...req.body };
    return res.json({ ok: true, key: 'workflow', workflow: workflowConfig });
  }
  res.status(404).json({ error: 'Unknown config key' });
});

// ── GET /api/pincode/:pin ──────────────────────────────────────
app.get('/api/pincode/:pin', (req, res) => {
  const info = PINCODE_DB[req.params.pin];
  if (!info) return res.status(404).json({ error: 'Pincode not found' });
  res.json(info);
});

// ── GET /api/leads ─────────────────────────────────────────────
app.get('/api/leads', (req, res) => {
  const { status, search, assignedTo, isCorrection } = req.query;
  let result = [...leads];

  if (status && status !== 'ALL') {
    result = result.filter(l => l.status === status);
  }
  if (assignedTo) {
    result = result.filter(l => l.assignedTo === assignedTo);
  }
  if (isCorrection === 'true') {
    result = result.filter(l => l.isCorrection === true);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.id.includes(q) ||
      l.mobile.includes(q)
    );
  }

  res.json({ data: result, total: result.length });
});

// ── GET /api/leads/stats ───────────────────────────────────────
app.get('/api/leads/stats', (req, res) => {
  // Per-source breakdown
  const sourceMap = {};
  leads.forEach(l => {
    const src = l.source || l.leadSource || 'Unknown';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  res.json({
    total: leads.length,
    approvalPending: leads.filter(l => l.status === 'APPROVAL_PENDING').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    converted: leads.filter(l => l.status === 'CONVERTED').length,
    rejected: leads.filter(l => l.status === 'REJECTED').length,
    bySource: sourceMap,
  });
});

// ── GET /api/leads/template ────────────────────────────────────
app.get('/api/leads/template', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="lead-upload-template.csv"');
  res.send('name,mobile,work,leadType,leadSource,loanAmount,loanPurpose,pincode,notes\n');
});

// ── POST /api/leads/bulk ───────────────────────────────────────
const VALID_LEAD_TYPES   = ['individual', 'group', 'jlg'];
const VALID_LOAN_PURPOSE = ['business', 'working capital', 'asset purchase', 'business expansion', 'education', 'home improvement', 'agriculture', 'dairy farming', 'other'];

app.post('/api/leads/bulk', (req, res) => {
  // Accept CSV as text/csv body (from web app) or multipart file
  let csvText = '';
  if (req.headers['content-type'] && req.headers['content-type'].includes('text/csv')) {
    // Raw CSV body (web api.js sends it this way)
    csvText = req.body && typeof req.body === 'string' ? req.body : '';
    if (!csvText) {
      // body may have been parsed differently — try to reconstruct
      return res.status(400).json({ error: 'Empty CSV body' });
    }
  } else {
    return res.status(400).json({ error: 'Content-Type must be text/csv' });
  }

  const content = csvText.replace(/\r/g, '');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return res.status(400).json({ error: 'CSV must contain a header row and at least one data row' });
  }

  // Parse header — lowercase+trim for loose matching
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const results = { jobId: uuidv4(), created: 0, duplicates: 0, failed: 0, errors: [], filename: 'upload.csv', uploadedAt: new Date().toISOString() };
  const seenMobiles = new Set(); // intra-batch duplicate check

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // human-readable row number (1=header)
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });

    // ── Required: name ──────────────────────────────────────────
    if (!row.name || row.name.trim().length < 2) {
      results.failed++;
      results.errors.push({ row: rowNum, mobile: row.mobile || '', reason: 'Name is required (min 2 characters)' });
      continue;
    }

    // ── Required: mobile ────────────────────────────────────────
    if (!row.mobile) {
      results.failed++;
      results.errors.push({ row: rowNum, mobile: '', reason: 'Mobile number is required' });
      continue;
    }
    if (!/^[6-9]\d{9}$/.test(row.mobile)) {
      results.failed++;
      results.errors.push({ row: rowNum, mobile: row.mobile, reason: 'Invalid mobile — must be 10 digits starting with 6-9' });
      continue;
    }

    // ── Intra-batch duplicate check ──────────────────────────────
    if (seenMobiles.has(row.mobile)) {
      results.duplicates++;
      results.errors.push({ row: rowNum, mobile: row.mobile, reason: 'Duplicate within this file — same mobile appears in an earlier row' });
      continue;
    }
    seenMobiles.add(row.mobile);

    // ── Dedup: same mobile in existing leads ─────────────────────
    const existing = leads.find(l => l.mobile === row.mobile);
    if (existing) {
      results.duplicates++;
      results.errors.push({ row: rowNum, mobile: row.mobile, reason: `Duplicate — already exists as Lead ID ${existing.id}` });
      continue;
    }

    // ── Optional: loanAmount range ───────────────────────────────
    if (row.loanamount || row.loanAmount) {
      const amt = Number(row.loanamount || row.loanAmount);
      if (isNaN(amt) || amt < 1000 || amt > 500000) {
        results.failed++;
        results.errors.push({ row: rowNum, mobile: row.mobile, reason: 'Loan amount must be between ₹1,000 and ₹5,00,000' });
        continue;
      }
    }

    // ── Optional: leadType validation ────────────────────────────
    const rawLeadType = (row.leadtype || row.leadType || '').toLowerCase();
    if (rawLeadType && !VALID_LEAD_TYPES.includes(rawLeadType)) {
      results.failed++;
      results.errors.push({ row: rowNum, mobile: row.mobile, reason: `Invalid Lead Type "${row.leadtype || row.leadType}" — must be Individual, Group, or JLG` });
      continue;
    }

    // ── Optional: pincode format ─────────────────────────────────
    if (row.pincode && !/^\d{6}$/.test(row.pincode)) {
      results.failed++;
      results.errors.push({ row: rowNum, mobile: row.mobile, reason: 'Invalid pincode — must be exactly 6 digits' });
      continue;
    }

    // ── Create lead ──────────────────────────────────────────────
    const newLead = {
      id: String(Date.now() + i).padStart(12, '0'),
      name: row.name,
      mobile: row.mobile,
      work: row.work || '',
      leadType: rawLeadType ? (rawLeadType.charAt(0).toUpperCase() + rawLeadType.slice(1)) : 'Individual',
      leadSource: row.leadsource || row.leadSource || 'Bulk Upload',
      loanAmount: row.loanamount || row.loanAmount ? Number(row.loanamount || row.loanAmount) : 0,
      loanPurpose: row.loanpurpose || row.loanPurpose || '',
      pincode: row.pincode || '',
      notes: row.notes || '',
      source: 'Bulk Upload',
      createdAt: new Date().toISOString(),
      createdBy: 'Bulk Upload',
      status: 'APPROVAL_PENDING',
      steps: buildStepsFromConfig(),
      callLogs: [],
      visitLogs: [],
    };
    leads.unshift(newLead);
    results.created++;
  }

  // Store job for monitor
  uploadJobs.unshift({ ...results, totalRows: lines.length - 1 });
  if (uploadJobs.length > 50) uploadJobs = uploadJobs.slice(0, 50);

  res.status(200).json(results);
});

// ── GET /api/bulk-uploads ──────────────────────────────────────
app.get('/api/bulk-uploads', (req, res) => {
  // Return jobs summary (without per-row errors to keep response small)
  const summary = uploadJobs.map(j => ({
    jobId: j.jobId,
    filename: j.filename,
    uploadedAt: j.uploadedAt,
    totalRows: j.totalRows,
    created: j.created,
    duplicates: j.duplicates,
    failed: j.failed,
    errorCount: j.errors ? j.errors.length : 0,
  }));
  res.json({ data: summary });
});

// ── GET /api/bulk-uploads/:jobId ───────────────────────────────
app.get('/api/bulk-uploads/:jobId', (req, res) => {
  const job = uploadJobs.find(j => j.jobId === req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// ── GET /api/leads/:id ─────────────────────────────────────────
app.get('/api/leads/:id', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// ── POST /api/leads ────────────────────────────────────────────
app.post('/api/leads', (req, res) => {
  const body = req.body || {};
  // Field Officers always produce Field Scouting leads — not overridable
  const resolvedSource = body.createdByRole === 'Field Officer'
    ? 'Field Scouting'
    : (body.source || body.leadSource || 'Back Office');
  const newLead = {
    ...body,
    source: resolvedSource,
    leadSource: resolvedSource,
    id: String(Date.now()).padStart(12, '0'),
    createdAt: new Date().toISOString(),
    status: 'APPROVAL_PENDING',
    steps: buildStepsFromConfig(),
    callLogs: [],
    visitLogs: []
  };
  leads.unshift(newLead);
  res.status(201).json(newLead);
});

// ── PATCH /api/leads/:id ───────────────────────────────────────
app.patch('/api/leads/:id', (req, res) => {
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  leads[idx] = { ...leads[idx], ...req.body };
  res.json(leads[idx]);
});

// ── POST /api/leads/:id/call-logs ──────────────────────────────
app.post('/api/leads/:id/call-logs', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const log = { id: uuidv4(), ...req.body, calledAt: new Date().toISOString() };
  lead.callLogs.push(log);
  res.status(201).json(log);
});

// ── POST /api/leads/:id/prequalify ─────────────────────────────
app.post('/api/leads/:id/prequalify', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const seed = lead.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const score = 580 + (seed % 320);
  const band = score >= 800 ? 'Excellent' : score >= 740 ? 'Very Good' : score >= 670 ? 'Good' : score >= 580 ? 'Fair' : 'Poor';
  const recommendation = score >= 670 ? 'PROCEED' : score >= 580 ? 'CONDITIONAL' : 'DECLINE';

  const rules = [
    { rule: 'Loan Amount',  value: lead.loanAmount ? `₹${Number(lead.loanAmount).toLocaleString('en-IN')}` : '—', pass: Number(lead.loanAmount) >= 5000 && Number(lead.loanAmount) <= 200000, detail: '₹5,000 – ₹2,00,000' },
    { rule: 'Lead Type',    value: lead.leadType || '—',  pass: !!lead.leadType,  detail: 'Individual or Group' },
    { rule: 'Mobile',       value: lead.mobile || '—',    pass: /^[6-9]\d{9}$/.test(lead.mobile || ''), detail: 'Valid 10-digit Indian number' },
    { rule: 'Work Profile', value: lead.work || '—',      pass: !!lead.work,      detail: 'Occupation must be specified' },
    { rule: 'Location',     value: lead.state || '—',     pass: !!lead.state,     detail: 'State must be filled' },
  ];
  const eligibilityPass = rules.every(r => r.pass);
  const factors = [
    { name: 'Payment History',    rating: Math.min(5, 2 + (seed % 4)),         label: ['Poor','Fair','Good','Very Good','Excellent'][Math.min(4, 1 + (seed % 4))] },
    { name: 'Credit Utilization', rating: Math.min(5, 1 + ((seed * 3) % 5)),  label: ['Poor','Fair','Good','Very Good','Excellent'][Math.min(4, (seed * 3) % 5)] },
    { name: 'Account Age',        rating: Math.min(5, 3 + (seed % 3)),         label: ['Good','Very Good','Excellent'][Math.min(2, seed % 3)] },
  ];

  const result = { score, band, recommendation, eligibilityPass, rules, factors, checkedAt: new Date().toISOString() };
  lead.prequalResult = result;
  res.json(result);
});

// ── POST /api/leads/:id/visit-logs ─────────────────────────────
app.post('/api/leads/:id/visit-logs', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.visitLogs) lead.visitLogs = [];
  const log = { id: uuidv4(), ...req.body, visitedAt: req.body.visitedAt || new Date().toISOString() };
  lead.visitLogs.push(log);
  res.status(201).json(log);
});

// ── POST /api/leads/:id/start-over ────────────────────────────
app.post('/api/leads/:id/start-over', (req, res) => {
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });

  const { reason, by } = req.body || {};
  leads[idx] = {
    ...leads[idx],
    status: 'APPROVAL_PENDING',
    isCorrection: true,
    correctionNote: reason || '',
    correctionBy:   by   || 'Hub Manager',
    correctionAt:   new Date().toISOString(),
    steps: buildStepsFromConfig(),
  };
  res.json(leads[idx]);
});

// ── CRM Integration Endpoints ─────────────────────────────────
// Simple API-key middleware for CRM consumer authentication
const CRM_API_KEY = process.env.CRM_API_KEY || 'crm-secret-key-2025';

function requireCrmKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== CRM_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized — invalid or missing X-API-Key' });
  }
  next();
}

// POST /api/crm/leads — CRM pushes a new lead into the system
app.post('/api/crm/leads', requireCrmKey, (req, res) => {
  const {
    externalId,         // CRM's own lead ID (for dedup + status check)
    name, mobile, work,
    leadType, loanAmount, loanPurpose,
    pincode, state, district, taluka,
    locality, notes,
    branch, centre,
    assignedTo,
  } = req.body || {};

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'name is required (min 2 characters)' });
  }
  if (!mobile || !/^[6-9]\d{9}$/.test(String(mobile))) {
    return res.status(400).json({ error: 'mobile must be a valid 10-digit Indian number starting 6-9' });
  }

  // Dedup by mobile
  const existing = leads.find(l => l.mobile === String(mobile));
  if (existing) {
    return res.status(409).json({ error: `Lead already exists with this mobile — Lead ID ${existing.id}` });
  }

  // Dedup by externalId
  if (externalId) {
    const byExtId = leads.find(l => l.crmExternalId === String(externalId));
    if (byExtId) {
      return res.status(409).json({ error: `Lead already exists for CRM external ID ${externalId} — Lead ID ${byExtId.id}` });
    }
  }

  const newLead = {
    id: String(Date.now()).padStart(12, '0'),
    crmExternalId: externalId ? String(externalId) : null,
    source: 'CRM',
    leadSource: 'CRM',
    createdBy: 'CRM Integration',
    createdByRole: 'CRM',
    createdAt: new Date().toISOString(),
    status: 'APPROVAL_PENDING',
    name: String(name).trim(),
    mobile: String(mobile),
    work: work || '',
    leadType: leadType || 'Individual',
    loanAmount: loanAmount ? Number(loanAmount) : 0,
    loanPurpose: loanPurpose || '',
    pincode: pincode || '',
    state: state || '',
    district: district || '',
    taluka: taluka || '',
    locality: locality || '',
    notes: notes || '',
    branch: branch || '',
    centre: centre || '',
    assignedTo: assignedTo || '',
    steps: buildStepsFromConfig(),
    callLogs: [],
    visitLogs: [],
  };
  leads.unshift(newLead);
  res.status(201).json({ id: newLead.id, crmExternalId: newLead.crmExternalId, status: newLead.status });
});

// GET /api/crm/leads/:externalId — CRM polls status of a previously submitted lead
app.get('/api/crm/leads/:externalId', requireCrmKey, (req, res) => {
  const lead = leads.find(l => l.crmExternalId === req.params.externalId);
  if (!lead) return res.status(404).json({ error: 'Lead not found for this CRM external ID' });
  res.json({
    id: lead.id,
    crmExternalId: lead.crmExternalId,
    name: lead.name,
    mobile: lead.mobile,
    status: lead.status,
    assignedTo: lead.assignedTo || null,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt || null,
  });
});

// ── PATCH /api/leads/:id/steps/:stepId ────────────────────────
const STEP_ALLOWED_FIELDS = new Set(['status', 'completedAt', 'completedBy', 'notes']);

app.patch('/api/leads/:id/steps/:stepId', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const stepIdx = lead.steps.findIndex(s => s.id === req.params.stepId);
  if (stepIdx === -1) return res.status(404).json({ error: 'Step not found' });
  // Only allow safe mutable fields — never overwrite id, name, stepDefId, role
  const patch = {};
  Object.keys(req.body).forEach(k => { if (STEP_ALLOWED_FIELDS.has(k)) patch[k] = req.body[k]; });
  Object.assign(lead.steps[stepIdx], patch);
  // Auto-advance next step to in_progress when current is completed
  if (patch.status === 'completed' && stepIdx + 1 < lead.steps.length) {
    if (lead.steps[stepIdx + 1].status === 'pending') {
      lead.steps[stepIdx + 1].status = 'in_progress';
    }
  }
  // Note: conversion is explicit — use PATCH /api/leads/:id with status:CONVERTED
  res.json(lead);
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Finflux Lead API running at http://localhost:${PORT}`);
    console.log(`   GET  http://localhost:${PORT}/api/leads`);
    console.log(`   POST http://localhost:${PORT}/api/leads`);
    console.log(`   GET  http://localhost:${PORT}/api/leads/stats\n`);
  });
}

module.exports = app;
