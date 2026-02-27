// Embedded local data store — no server required.
// Full CRUD in memory. Data persists for the duration of the app session.

let nextId = 100;

const leads = [
  {
    id: 'L001',
    name: 'Priya Sharma',
    mobile: '9876543210',
    work: 'Tailoring',
    leadType: 'Individual',
    leadSource: 'Field Scouting',
    loanAmount: 50000,
    loanPurpose: 'Business',
    productType: 'Micro Loan',
    pincode: '560045',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluka: 'Bengaluru North',
    locality: 'Banaswadi',
    notes: 'Interested in expanding tailoring shop',
    status: 'QUALIFIED',
    createdBy: 'Field Officer',
    createdByRole: 'Field Officer',
    assignedTo: 'Ravi Kumar',
    createdAt: '2026-02-20T10:30:00Z',
    steps: [
      { id: 's1', name: 'Basic Details', status: 'completed', completedAt: '2026-02-20T10:45:00Z', completedBy: 'Field Officer' },
      { id: 's2', name: 'Qualification', status: 'completed', completedAt: '2026-02-20T14:00:00Z', completedBy: 'Hub Team' },
      { id: 's3', name: 'Meet Lead', status: 'in_progress', completedAt: null, completedBy: null },
    ],
    callLogs: [
      { id: 'c1', date: '2026-02-20', time: '11:00', didPickup: true, leadType: 'Hot', notes: 'Very interested, asked about EMI options', followUp: true, followUpDate: '2026-02-22' },
    ],
  },
  {
    id: 'L002',
    name: 'Sunita Devi',
    mobile: '9812345678',
    work: 'Dairy Farming',
    leadType: 'Individual',
    leadSource: 'Referral',
    loanAmount: 75000,
    loanPurpose: 'Working Capital',
    productType: 'Agri Loan',
    pincode: '500001',
    state: 'Andhra Pradesh',
    district: 'Hyderabad',
    taluka: 'Secunderabad',
    locality: 'Trimulgherry',
    notes: 'Needs funds to buy more cattle',
    status: 'APPROVAL_PENDING',
    createdBy: 'Field Officer',
    createdByRole: 'Field Officer',
    assignedTo: null,
    createdAt: '2026-02-21T09:00:00Z',
    steps: [
      { id: 's1', name: 'Basic Details', status: 'completed', completedAt: '2026-02-21T09:15:00Z', completedBy: 'Field Officer' },
      { id: 's2', name: 'Qualification', status: 'pending', completedAt: null, completedBy: null },
      { id: 's3', name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
    ],
    callLogs: [],
  },
  {
    id: 'L003',
    name: 'Meena Bai',
    mobile: '9900112233',
    work: 'Petty Shop',
    leadType: 'Individual',
    leadSource: 'Inbound Call',
    loanAmount: 30000,
    loanPurpose: 'Business Expansion',
    productType: 'Micro Loan',
    pincode: '560045',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluka: 'Bengaluru North',
    locality: 'Jayanagar',
    notes: '',
    status: 'CONVERTED',
    createdBy: 'Hub Team',
    createdByRole: 'Hub Officer',
    assignedTo: 'Ravi Kumar',
    createdAt: '2026-02-18T08:00:00Z',
    steps: [
      { id: 's1', name: 'Basic Details', status: 'completed', completedAt: '2026-02-18T08:20:00Z', completedBy: 'Field Officer' },
      { id: 's2', name: 'Qualification', status: 'completed', completedAt: '2026-02-18T12:00:00Z', completedBy: 'Hub Team' },
      { id: 's3', name: 'Meet Lead', status: 'completed', completedAt: '2026-02-19T10:00:00Z', completedBy: 'Field Officer' },
    ],
    callLogs: [
      { id: 'c1', date: '2026-02-18', time: '09:00', didPickup: true, leadType: 'Hot', notes: 'Ready to proceed', followUp: false },
    ],
  },
  {
    id: 'L004',
    name: 'Rekha Verma',
    mobile: '9811223344',
    work: 'Vegetable Vendor',
    leadType: 'Group',
    leadSource: 'Field Scouting',
    loanAmount: 25000,
    loanPurpose: 'Working Capital',
    productType: 'Group Loan',
    pincode: '560045',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluka: 'Bengaluru North',
    locality: 'Vidyanagar',
    notes: 'Part of a JLG group',
    status: 'REJECTED',
    createdBy: 'Field Officer',
    createdByRole: 'Field Officer',
    rejectionReason: 'Insufficient Income',
    assignedTo: null,
    createdAt: '2026-02-17T11:00:00Z',
    steps: [
      { id: 's1', name: 'Basic Details', status: 'completed', completedAt: '2026-02-17T11:30:00Z', completedBy: 'Field Officer' },
      { id: 's2', name: 'Qualification', status: 'completed', completedAt: '2026-02-17T15:00:00Z', completedBy: 'Hub Team' },
      { id: 's3', name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
    ],
    callLogs: [],
  },
  {
    id: 'L005',
    name: 'Kamala Nair',
    mobile: '9988776655',
    work: 'Home Maker',
    leadType: 'Individual',
    leadSource: 'Outbound Call',
    loanAmount: 40000,
    loanPurpose: 'Business',
    productType: 'Micro Loan',
    pincode: '560045',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluka: 'Bengaluru North',
    locality: 'Banaswadi',
    notes: 'Wants to start a food stall',
    status: 'APPROVAL_PENDING',
    createdBy: 'Field Officer',
    createdByRole: 'Field Officer',
    assignedTo: null,
    createdAt: '2026-02-22T07:30:00Z',
    steps: [
      { id: 's1', name: 'Basic Details', status: 'completed', completedAt: '2026-02-22T07:45:00Z', completedBy: 'Field Officer' },
      { id: 's2', name: 'Qualification', status: 'pending', completedAt: null, completedBy: null },
      { id: 's3', name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
    ],
    callLogs: [],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function filterLeads(params = {}) {
  let list = leads;
  if (params.status && params.status !== 'ALL') {
    list = list.filter(l => l.status === params.status);
  }
  return list;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const store = {
  getLeads(params = {}) {
    return deepClone(filterLeads(params));
  },

  getLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) throw new Error(`Lead ${id} not found`);
    return deepClone(lead);
  },

  createLead(data) {
    const id = `L${String(++nextId).padStart(3, '0')}`;
    const newLead = {
      id,
      name: data.name || '',
      mobile: data.mobile || '',
      work: data.work || '',
      leadType: data.leadType || 'Individual',
      leadSource: data.leadSource || data.source || '',
      loanAmount: Number(data.loanAmount) || 0,
      loanPurpose: data.loanPurpose || '',
      productType: data.productType || '',
      pincode: data.pincode || '',
      state: data.state || '',
      district: data.district || '',
      taluka: data.taluka || '',
      locality: data.locality || '',
      notes: data.notes || '',
      status: 'APPROVAL_PENDING',
      createdBy: data.createdBy || 'Field Officer',
      createdByRole: data.createdByRole || 'Field Officer',
      assignedTo: data.assignedTo || null,
      createdAt: new Date().toISOString(),
      steps: [
        { id: 's1', name: 'Basic Details', status: 'completed', completedAt: new Date().toISOString(), completedBy: data.createdBy || 'Field Officer' },
        { id: 's2', name: 'Qualification', status: 'pending', completedAt: null, completedBy: null },
        { id: 's3', name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
      ],
      callLogs: [],
    };
    leads.unshift(newLead);
    return deepClone(newLead);
  },

  updateLead(id, updates) {
    const idx = leads.findIndex(l => l.id === id);
    if (idx === -1) throw new Error(`Lead ${id} not found`);
    Object.assign(leads[idx], updates);
    return deepClone(leads[idx]);
  },

  updateStep(leadId, stepId, updates) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);
    const step = lead.steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found`);
    Object.assign(step, updates);
    // Auto-advance next step to in_progress
    const idx = lead.steps.indexOf(step);
    if (updates.status === 'completed' && idx + 1 < lead.steps.length) {
      if (lead.steps[idx + 1].status === 'pending') {
        lead.steps[idx + 1].status = 'in_progress';
      }
    }
    // Auto-update lead status based on steps
    const allDone = lead.steps.every(s => s.status === 'completed');
    if (allDone && lead.status === 'QUALIFIED') {
      lead.status = 'CONVERTED';
    }
    return deepClone(lead);
  },

  createCallLog(leadId, data) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);
    const log = { id: `c${Date.now()}`, ...data };
    lead.callLogs = lead.callLogs || [];
    lead.callLogs.push(log);
    return deepClone(log);
  },

  getStats() {
    const total = leads.length;
    const pending = leads.filter(l => l.status === 'APPROVAL_PENDING').length;
    const qualified = leads.filter(l => l.status === 'QUALIFIED').length;
    const converted = leads.filter(l => l.status === 'CONVERTED').length;
    const rejected = leads.filter(l => l.status === 'REJECTED').length;
    return { total, pending, qualified, converted, rejected, sourcing: total, followups: pending };
  },
};
