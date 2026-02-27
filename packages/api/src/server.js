const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { mockLeads } = require('./mockData');

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

// In-memory leads store
let leads = [...mockLeads];

// ── GET /api/pincode/:pin ──────────────────────────────────────
app.get('/api/pincode/:pin', (req, res) => {
  const info = PINCODE_DB[req.params.pin];
  if (!info) return res.status(404).json({ error: 'Pincode not found' });
  res.json(info);
});

// ── GET /api/leads ─────────────────────────────────────────────
app.get('/api/leads', (req, res) => {
  const { status, search } = req.query;
  let result = [...leads];

  if (status && status !== 'ALL') {
    result = result.filter(l => l.status === status);
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
  res.json({
    total: leads.length,
    approvalPending: leads.filter(l => l.status === 'APPROVAL_PENDING').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    converted: leads.filter(l => l.status === 'CONVERTED').length,
    rejected: leads.filter(l => l.status === 'REJECTED').length,
  });
});

// ── GET /api/leads/:id ─────────────────────────────────────────
app.get('/api/leads/:id', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// ── POST /api/leads ────────────────────────────────────────────
app.post('/api/leads', (req, res) => {
  const newLead = {
    ...req.body,
    id: String(Date.now()).padStart(12, '0'),
    createdAt: new Date().toISOString(),
    status: 'APPROVAL_PENDING',
    steps: [
      { id: uuidv4(), name: 'Basic Details', status: 'in_progress', completedAt: null, completedBy: null },
      { id: uuidv4(), name: 'Qualification', status: 'pending', completedAt: null, completedBy: null },
      { id: uuidv4(), name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null }
    ],
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

// ── PATCH /api/leads/:id/steps/:stepId ────────────────────────
app.patch('/api/leads/:id/steps/:stepId', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const stepIdx = lead.steps.findIndex(s => s.id === req.params.stepId);
  if (stepIdx === -1) return res.status(404).json({ error: 'Step not found' });
  Object.assign(lead.steps[stepIdx], req.body);
  // Auto-advance next step to in_progress when current is completed
  if (req.body.status === 'completed' && stepIdx + 1 < lead.steps.length) {
    if (lead.steps[stepIdx + 1].status === 'pending') {
      lead.steps[stepIdx + 1].status = 'in_progress';
    }
  }
  // Note: conversion is explicit — use PATCH /api/leads/:id with status:CONVERTED
  res.json(lead);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Finflux Lead API running at http://localhost:${PORT}`);
  console.log(`   GET  http://localhost:${PORT}/api/leads`);
  console.log(`   POST http://localhost:${PORT}/api/leads`);
  console.log(`   GET  http://localhost:${PORT}/api/leads/stats\n`);
});
