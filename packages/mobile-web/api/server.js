// Pure Vercel serverless handler — zero external dependencies
import { randomUUID } from 'crypto';

const PINCODE_DB = {
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
  // ── Bengaluru Urban ──
  '560001': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Shivajinagar' },
  '560002': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Ulsoor' },
  '560003': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Shivajinagar' },
  '560004': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Malleshwaram' },
  '560006': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Basavanagudi' },
  '560008': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Gandhi Nagar' },
  '560010': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Rajajinagar' },
  '560011': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Jayanagar' },
  '560012': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Indiranagar' },
  '560013': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Ulsoor' },
  '560014': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Koramangala' },
  '560016': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Sadashivanagar' },
  '560017': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Hebbal' },
  '560019': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'HBR Layout' },
  '560020': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Banaswadi' },
  '560022': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'RT Nagar' },
  '560024': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Horamavu' },
  '560025': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bommanahalli' },
  '560027': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Yeshwanthpur' },
  '560029': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Peenya' },
  '560030': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Basavangudi' },
  '560032': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Majestic' },
  '560033': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Hanumanthanagar' },
  '560034': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Whitefield' },
  '560036': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Uttarahalli' },
  '560037': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'JP Nagar' },
  '560040': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Vijayanagar' },
  '560041': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'RR Nagar' },
  '560043': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Banashankari' },
  '560045': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bengaluru North' },
  '560047': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Hebbal' },
  '560048': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Mallathahalli' },
  '560050': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Basavangudi' },
  '560052': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Begur' },
  '560053': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'BTM Layout' },
  '560054': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Kengeri' },
  '560060': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Electronic City' },
  '560061': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Kaggadasapura' },
  '560062': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Electronic City Phase 2' },
  '560064': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Vidyaranyapura' },
  '560065': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Yelahanka' },
  '560066': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'KR Puram' },
  '560068': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bengaluru South' },
  '560069': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Govindapura' },
  '560076': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'HSR Layout' },
  '560078': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Nagawara' },
  '560079': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Sahakaranagar' },
  '560083': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Horamavu' },
  '560085': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Thanisandra' },
  '560086': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Nagasandra' },
  '560091': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Uttarahalli' },
  '560097': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Gottigere' },
  '560099': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Kengeri Satellite Town' },
  '560103': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Channasandra' },
  '560109': { state: 'Karnataka', district: 'Bengaluru Urban', taluka: 'Bannerghatta Road' },
  // ── Bengaluru Rural / other Karnataka ──
  '562110': { state: 'Karnataka', district: 'Bengaluru Rural', taluka: 'Devanahalli' },
  '562130': { state: 'Karnataka', district: 'Bengaluru Rural', taluka: 'Doddaballapura' },
  '571401': { state: 'Karnataka', district: 'Mandya', taluka: 'Mandya' },
  '577001': { state: 'Karnataka', district: 'Shivamogga', taluka: 'Shimoga' },
  '580001': { state: 'Karnataka', district: 'Dharwad', taluka: 'Dharwad' },
  '590001': { state: 'Karnataka', district: 'Belagavi', taluka: 'Belgaum' },
  // ── Other states ──
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
  '751001': { state: 'Odisha', district: 'Bhubaneswar', taluka: 'Bhubaneswar' },
  '800001': { state: 'Bihar', district: 'Patna', taluka: 'Patna City' },
  '302001': { state: 'Rajasthan', district: 'Jaipur', taluka: 'Jaipur City' },
  '380001': { state: 'Gujarat', district: 'Ahmedabad', taluka: 'Ahmedabad City' },
  '226001': { state: 'Uttar Pradesh', district: 'Lucknow', taluka: 'Lucknow' },
  '452001': { state: 'Madhya Pradesh', district: 'Indore', taluka: 'Indore' },
  '462001': { state: 'Madhya Pradesh', district: 'Bhopal', taluka: 'Bhopal' },
  '492001': { state: 'Chhattisgarh', district: 'Raipur', taluka: 'Raipur' },
  '834001': { state: 'Jharkhand', district: 'Ranchi', taluka: 'Ranchi' },
};

const MOCK_LEADS = [
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

// In-memory store — resets on cold start, mock data always present
let leads = MOCK_LEADS.map(l => JSON.parse(JSON.stringify(l)));

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const url  = new URL(req.url, 'http://x');
  const path = url.pathname;
  const m    = req.method;

  // GET /api/pincode/:pin
  const pinMatch = path.match(/^\/api\/pincode\/(\d+)$/);
  if (m === 'GET' && pinMatch) {
    const info = PINCODE_DB[pinMatch[1]];
    if (!info) return json(res, { error: 'Pincode not found' }, 404);
    return json(res, info);
  }

  // GET /api/leads/stats
  if (m === 'GET' && path === '/api/leads/stats') {
    return json(res, {
      total: leads.length,
      approvalPending: leads.filter(l => l.status === 'APPROVAL_PENDING').length,
      qualified:  leads.filter(l => l.status === 'QUALIFIED').length,
      converted:  leads.filter(l => l.status === 'CONVERTED').length,
      rejected:   leads.filter(l => l.status === 'REJECTED').length,
    });
  }

  // GET /api/leads
  if (m === 'GET' && path === '/api/leads') {
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    let result = [...leads];
    if (status && status !== 'ALL') result = result.filter(l => l.status === status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.id.includes(q) || l.mobile.includes(q));
    }
    return json(res, { data: result, total: result.length });
  }

  // POST /api/leads
  if (m === 'POST' && path === '/api/leads') {
    const body = await parseBody(req);
    const newLead = {
      ...body,
      id: String(Date.now()).padStart(12, '0'),
      createdAt: new Date().toISOString(),
      status: 'APPROVAL_PENDING',
      steps: [
        { id: randomUUID(), name: 'Basic Details', status: 'in_progress', completedAt: null, completedBy: null },
        { id: randomUUID(), name: 'Qualification', status: 'pending', completedAt: null, completedBy: null },
        { id: randomUUID(), name: 'Meet Lead', status: 'pending', completedAt: null, completedBy: null },
      ],
      callLogs: [], visitLogs: [],
    };
    leads.unshift(newLead);
    return json(res, newLead, 201);
  }

  // routes with :id
  const idMatch = path.match(/^\/api\/leads\/([^/]+)(\/.*)?$/);
  if (!idMatch) return json(res, { error: 'Not found' }, 404);

  const id   = idMatch[1];
  const rest = idMatch[2] || '';

  // GET /api/leads/:id
  if (m === 'GET' && rest === '') {
    const lead = leads.find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    return json(res, lead);
  }

  // PATCH /api/leads/:id
  if (m === 'PATCH' && rest === '') {
    const idx = leads.findIndex(l => l.id === id);
    if (idx === -1) return json(res, { error: 'Lead not found' }, 404);
    const body = await parseBody(req);
    leads[idx] = { ...leads[idx], ...body };
    return json(res, leads[idx]);
  }

  // POST /api/leads/:id/call-logs
  if (m === 'POST' && rest === '/call-logs') {
    const lead = leads.find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    const body = await parseBody(req);
    const log = { id: randomUUID(), ...body, calledAt: new Date().toISOString() };
    lead.callLogs.push(log);
    return json(res, log, 201);
  }

  // POST /api/leads/:id/prequalify
  if (m === 'POST' && rest === '/prequalify') {
    const lead = leads.find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    const seed  = lead.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const score = 580 + (seed % 320);
    const band  = score >= 800 ? 'Excellent' : score >= 740 ? 'Very Good' : score >= 670 ? 'Good' : score >= 580 ? 'Fair' : 'Poor';
    const recommendation = score >= 670 ? 'PROCEED' : score >= 580 ? 'CONDITIONAL' : 'DECLINE';
    const rules = [
      { rule: 'Loan Amount',  value: lead.loanAmount ? `₹${Number(lead.loanAmount).toLocaleString('en-IN')}` : '—', pass: Number(lead.loanAmount) >= 5000 && Number(lead.loanAmount) <= 200000 },
      { rule: 'Lead Type',    value: lead.leadType || '—',  pass: !!lead.leadType },
      { rule: 'Mobile',       value: lead.mobile || '—',    pass: /^[6-9]\d{9}$/.test(lead.mobile || '') },
      { rule: 'Work Profile', value: lead.work || '—',      pass: !!lead.work },
      { rule: 'Location',     value: lead.state || '—',     pass: !!lead.state },
    ];
    const result = { score, band, recommendation, eligibilityPass: rules.every(r => r.pass), rules, checkedAt: new Date().toISOString() };
    lead.prequalResult = result;
    return json(res, result);
  }

  // POST /api/leads/:id/visit-logs
  if (m === 'POST' && rest === '/visit-logs') {
    const lead = leads.find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    if (!lead.visitLogs) lead.visitLogs = [];
    const body = await parseBody(req);
    const log = { id: randomUUID(), ...body, visitedAt: body.visitedAt || new Date().toISOString() };
    lead.visitLogs.push(log);
    return json(res, log, 201);
  }

  // PATCH /api/leads/:id/steps/:stepId
  const stepMatch = rest.match(/^\/steps\/([^/]+)$/);
  if (m === 'PATCH' && stepMatch) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return json(res, { error: 'Lead not found' }, 404);
    const stepIdx = lead.steps.findIndex(s => s.id === stepMatch[1]);
    if (stepIdx === -1) return json(res, { error: 'Step not found' }, 404);
    const body = await parseBody(req);
    Object.assign(lead.steps[stepIdx], body);
    if (body.status === 'completed' && stepIdx + 1 < lead.steps.length) {
      if (lead.steps[stepIdx + 1].status === 'pending') lead.steps[stepIdx + 1].status = 'in_progress';
    }
    return json(res, lead);
  }

  return json(res, { error: 'Not found' }, 404);
}
