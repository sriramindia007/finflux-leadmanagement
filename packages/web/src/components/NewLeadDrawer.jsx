import React, { useState } from 'react';
import { api } from '../services/api';

const WORK = ['Home Maker', 'Vegetable Vendor', 'Tailoring', 'Dairy Farming', 'Petty Shop', 'Other'];
const LEAD_TYPES = ['Individual', 'Group'];
const SOURCES = ['Field Scouting', 'Inbound Call', 'Outbound Call', 'Back Office', 'Referral', 'DSA', 'Digital Campaign', 'Walk-in', 'WhatsApp'];
const PURPOSES = ['Business', 'Working Capital', 'Business Expansion', 'Asset Purchase', 'Education'];

// Hub-level master data: branches → villages → centres + officers
const HUB_OFFICERS = [
  { name: 'Ravi Kumar',   branch: 'Bengaluru South', village: 'Jayanagar',  centre: 'Jayanagar C2'  },
  { name: 'Amul Sharma',  branch: 'Bengaluru South', village: 'Jayanagar',  centre: 'Jayanagar C2'  },
  { name: 'Gopal Nair',   branch: 'Bengaluru North', village: 'Banaswadi',  centre: 'Banaswadi C1'  },
  { name: 'Jagan Reddy',  branch: 'Guntur',          village: 'Brodipet',   centre: 'Brodipet C1'   },
  { name: 'Mohan Das',    branch: 'Guntur',          village: 'Brodipet',   centre: 'Brodipet C1'   },
  { name: 'Sameer Khan',  branch: 'Dharwad',         village: 'Vidyanagar', centre: 'Vidyanagar C1' },
];
const HUB_BRANCHES = [...new Set(HUB_OFFICERS.map(o => o.branch))].sort();

const RULES = {
  name:       { required: true,  regex: /^[A-Za-z\s]{2,}$/,  msg: 'Enter a valid name (letters only, min 2 chars)' },
  mobile:     { required: true,  regex: /^[6-9]\d{9}$/,       msg: 'Enter a valid 10-digit Indian mobile number' },
  leadType:   { required: true,  regex: null,                  msg: 'Select a lead type' },
  loanAmount: { required: false, regex: /^[1-9]\d*$/,          msg: 'Enter a valid positive loan amount' },
  pincode:    { required: false, regex: /^\d{6}$/,             msg: 'Enter a valid 6-digit pincode' },
};

const STATUS_COLORS = { APPROVAL_PENDING: '#F59E0B', QUALIFIED: '#1874D0', CONVERTED: '#10B981', REJECTED: '#EF4444' };

function validate(field, value) {
  const rule = RULES[field];
  if (!rule) return '';
  if (rule.required && !value) return `${field === 'leadType' ? 'Lead Type' : field.charAt(0).toUpperCase() + field.slice(1)} is required`;
  if (value && rule.regex && !rule.regex.test(value)) return rule.msg;
  return '';
}

function Field({ label, children, required, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{error}</span>}
    </div>
  );
}

const baseInput = { padding: '8px 12px', borderRadius: 6, fontSize: 14, color: '#003366', outline: 'none', width: '100%', background: '#fff', boxSizing: 'border-box' };
const inputStyle = (err) => ({ ...baseInput, border: `1px solid ${err ? '#EF4444' : '#CFD6DD'}` });
const disabledStyle = { ...baseInput, border: '1px solid #CFD6DD', background: '#F1F3F4', color: '#9CA3AF' };

export default function NewLeadDrawer({ user, onClose, onCreated }) {
  const isHubTeam = user?.role === 'Hub Team';

  // Hub assignment state (only used when isHubTeam)
  const [hubBranch,  setHubBranch]  = useState('');
  const [hubVillage, setHubVillage] = useState('');
  const [hubCentre,  setHubCentre]  = useState('');
  const [hubOfficer, setHubOfficer] = useState('');

  const branchOfficers  = HUB_OFFICERS.filter(o => o.branch === hubBranch);
  const branchVillages  = [...new Set(branchOfficers.map(o => o.village))];
  const villageCentres  = [...new Set(branchOfficers.filter(o => o.village === hubVillage).map(o => o.centre))];
  const centreOfficers  = branchOfficers.filter(o => o.centre === hubCentre);

  const handleHubBranch = (b) => { setHubBranch(b); setHubVillage(''); setHubCentre(''); setHubOfficer(''); };
  const handleHubVillage = (v) => { setHubVillage(v); setHubCentre(''); setHubOfficer(''); };
  const handleHubCentre  = (c) => { setHubCentre(c); setHubOfficer(''); };
  const handleHubOfficer = (name) => {
    setHubOfficer(name);
    const fo = HUB_OFFICERS.find(o => o.name === name);
    if (fo) { setHubBranch(fo.branch); setHubVillage(fo.village); setHubCentre(fo.centre); }
  };

  const [form, setForm] = useState({
    name: '', mobile: '', work: '', leadType: '', leadSource: '',
    loanAmount: '', loanPurpose: '', pincode: '', state: '', district: '',
    taluka: '', locality: '', notes: '',
    createdBy: user?.name || 'Hub Team', createdByRole: 'Back Office', source: 'Back Office',
  });
  const [errors, setErrors]         = useState({});
  const [touched, setTouched]       = useState({});
  const [saving, setSaving]         = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Dedup state
  const [dedup, setDedup]           = useState({ status: 'idle', lead: null }); // idle|checking|found|clear
  const [proceedReason, setProceedReason] = useState('');
  const [proceedingAnyway, setProceedingAnyway] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const touch = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(e => ({ ...e, [field]: validate(field, form[field]) }));
  };

  const setAndValidate = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (touched[k]) setErrors(e => ({ ...e, [k]: validate(k, v) }));
  };

  // ── Dedup check on mobile blur ────────────────────────────────
  const checkDedup = async (mobile) => {
    if (!/^[6-9]\d{9}$/.test(mobile)) return;
    setDedup({ status: 'checking', lead: null });
    try {
      const res = await api.getLeads({ search: mobile });
      const exact = (res.data || []).find(l => l.mobile === mobile);
      if (exact) setDedup({ status: 'found', lead: exact });
      else       setDedup({ status: 'clear', lead: null });
    } catch (_) {
      setDedup({ status: 'idle', lead: null });
    }
  };

  const handlePincode = async (v) => {
    set('pincode', v);
    if (touched['pincode']) setErrors(e => ({ ...e, pincode: validate('pincode', v) }));
    if (v.length < 6) { set('state', ''); set('district', ''); set('taluka', ''); return; }
    if (!/^\d{6}$/.test(v)) return;
    setPincodeLoading(true);
    try {
      const info = await api.lookupPincode(v);
      setForm(f => ({ ...f, pincode: v, state: info.state, district: info.district, taluka: info.taluka }));
    } catch (_) {
      setForm(f => ({ ...f, state: '', district: '', taluka: '' }));
    } finally { setPincodeLoading(false); }
  };

  const handleCreate = async () => {
    const allTouched = Object.keys(RULES).reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched(allTouched);
    const newErrors = Object.keys(RULES).reduce((a, k) => ({ ...a, [k]: validate(k, form[k]) }), {});
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    if (dedup.status === 'found' && !proceedingAnyway) return;

    setSaving(true); setSubmitError('');
    try {
      const payload = {
        ...form,
        loanAmount: Number(form.loanAmount),
        branch:     isHubTeam ? hubBranch  : (user?.branch  || ''),
        village:    isHubTeam ? hubVillage : (user?.village || ''),
        centre:     isHubTeam ? hubCentre  : (user?.centre  || ''),
        assignedTo: isHubTeam ? hubOfficer : '',
        createdBy: user?.name || 'Hub Team',
      };
      if (proceedingAnyway && proceedReason) payload.dedupOverrideReason = proceedReason;
      const lead = await api.createLead(payload);
      onCreated(lead);
    } catch (_) {
      setSubmitError('Failed to create lead. Ensure API server is running.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280' }}>←</button>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#003366' }}>New Lead</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hub Team: editable assignment; Field Officer: read-only */}
          {isHubTeam ? (
            <div style={{ background: '#F8FAFF', border: '1px solid #DBEAFE', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1874D0', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Assign to Branch / Officer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Branch</label>
                  <select style={{ ...inputStyle(false), padding: '7px 10px', fontSize: 13 }} value={hubBranch} onChange={e => handleHubBranch(e.target.value)}>
                    <option value="">Select branch</option>
                    {HUB_BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Village</label>
                  <select style={{ ...inputStyle(false), padding: '7px 10px', fontSize: 13 }} value={hubVillage} onChange={e => handleHubVillage(e.target.value)} disabled={!hubBranch}>
                    <option value="">Select village</option>
                    {branchVillages.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Centre</label>
                  <select style={{ ...inputStyle(false), padding: '7px 10px', fontSize: 13 }} value={hubCentre} onChange={e => handleHubCentre(e.target.value)} disabled={!hubVillage}>
                    <option value="">Select centre</option>
                    {villageCentres.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Assign Field Officer</label>
                  <select style={{ ...inputStyle(false), padding: '7px 10px', fontSize: 13 }} value={hubOfficer} onChange={e => handleHubOfficer(e.target.value)}>
                    <option value="">Select officer</option>
                    {(hubCentre ? centreOfficers : hubBranch ? branchOfficers : HUB_OFFICERS).map(o => <option key={o.name}>{o.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ) : user?.branch ? (
            <div style={{ background: '#EBF5FF', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 20 }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: '#1874D0', letterSpacing: 0.5, textTransform: 'uppercase' }}>Branch</div><div style={{ fontSize: 13, fontWeight: 600, color: '#003366', marginTop: 2 }}>{user.branch}</div></div>
              {user.centre && <div><div style={{ fontSize: 10, fontWeight: 700, color: '#1874D0', letterSpacing: 0.5, textTransform: 'uppercase' }}>Centre</div><div style={{ fontSize: 13, fontWeight: 600, color: '#003366', marginTop: 2 }}>{user.centre}</div></div>}
            </div>
          ) : null}
          <div style={{ borderLeft: '3px solid #1874D0', paddingLeft: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1874D0' }}>Basic Details</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Name" required error={touched.name && errors.name}>
              <input style={inputStyle(touched.name && errors.name)} value={form.name}
                onChange={e => setAndValidate('name', e.target.value)} onBlur={() => touch('name')} placeholder="Customer name" />
            </Field>

            {/* Mobile with dedup */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Mobile Number<span style={{ color: '#EF4444' }}> *</span></label>
              <input
                style={inputStyle(touched.mobile && errors.mobile)}
                value={form.mobile}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAndValidate('mobile', v);
                  if (v.length < 10) setDedup({ status: 'idle', lead: null });
                }}
                onBlur={() => { touch('mobile'); checkDedup(form.mobile); }}
                placeholder="10-digit number" type="tel" maxLength={10}
              />
              {touched.mobile && errors.mobile && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.mobile}</span>}

              {/* Dedup feedback */}
              {dedup.status === 'checking' && (
                <span style={{ fontSize: 11, color: '#6B7280' }}>Checking for duplicates...</span>
              )}
              {dedup.status === 'clear' && (
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 500 }}>✓ No duplicate found</span>
              )}
              {dedup.status === 'found' && !proceedingAnyway && (
                <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 6, padding: '10px 12px', marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>⚠️ Existing lead found</div>
                  <div style={{ fontSize: 12, color: '#78350F' }}>
                    <strong>{dedup.lead.name}</strong> &nbsp;•&nbsp;
                    <span style={{ color: STATUS_COLORS[dedup.lead.status] || '#374151', fontWeight: 600 }}>{dedup.lead.status}</span>
                    &nbsp;•&nbsp; ID: {dedup.lead.id}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => window.open(`/leads/${dedup.lead.id}`, '_blank')} style={{ fontSize: 12, color: '#003366', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>View Existing Lead ↗</button>
                    <button onClick={() => setProceedingAnyway(true)} style={{ fontSize: 12, color: '#92400E', background: 'none', border: '1px solid #F59E0B', borderRadius: 6, cursor: 'pointer', padding: '2px 8px' }}>Proceed Anyway</button>
                  </div>
                </div>
              )}
              {dedup.status === 'found' && proceedingAnyway && (
                <div style={{ marginTop: 4 }}>
                  <input
                    style={{ ...baseInput, border: '1px solid #F59E0B', fontSize: 12 }}
                    value={proceedReason}
                    onChange={e => setProceedReason(e.target.value)}
                    placeholder="Reason for proceeding with duplicate mobile..."
                  />
                </div>
              )}
            </div>

            <Field label="Work">
              <select style={inputStyle(false)} value={form.work} onChange={e => set('work', e.target.value)}>
                <option value="">Select</option>{WORK.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>

            <Field label="Lead Type" required error={touched.leadType && errors.leadType}>
              <select style={inputStyle(touched.leadType && errors.leadType)} value={form.leadType}
                onChange={e => setAndValidate('leadType', e.target.value)} onBlur={() => touch('leadType')}>
                <option value="">Select</option>{LEAD_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>

            <Field label="Lead Source">
              <select style={inputStyle(false)} value={form.leadSource} onChange={e => set('leadSource', e.target.value)}>
                <option value="">Select</option>{SOURCES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>

            <Field label="Loan Amount" error={touched.loanAmount && errors.loanAmount}>
              <input style={inputStyle(touched.loanAmount && errors.loanAmount)} value={form.loanAmount}
                onChange={e => setAndValidate('loanAmount', e.target.value.replace(/\D/g, ''))}
                onBlur={() => touch('loanAmount')} placeholder="Amount in ₹" type="text" inputMode="numeric" />
            </Field>
          </div>

          <Field label="Loan Purpose">
            <select style={inputStyle(false)} value={form.loanPurpose} onChange={e => set('loanPurpose', e.target.value)}>
              <option value="">Select</option>{PURPOSES.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>

          {/* Address */}
          <div style={{ borderLeft: '3px solid #1874D0', paddingLeft: 12, marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1874D0' }}>Address</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Pincode" error={touched.pincode && errors.pincode}>
              <div style={{ position: 'relative' }}>
                <input style={inputStyle(touched.pincode && errors.pincode)} value={form.pincode}
                  onChange={e => handlePincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={() => touch('pincode')} placeholder="6-digit" maxLength={6} />
                {pincodeLoading && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#6B7280' }}>…</span>}
              </div>
            </Field>
            <Field label="State"><input style={disabledStyle} value={form.state} readOnly placeholder="Auto-fill" /></Field>
            <Field label="District"><input style={disabledStyle} value={form.district} readOnly placeholder="Auto-fill" /></Field>
            <Field label="Taluka"><input style={disabledStyle} value={form.taluka} readOnly placeholder="Auto-fill" /></Field>
            <Field label="Locality">
              <select style={inputStyle(false)} value={form.locality} onChange={e => set('locality', e.target.value)}>
                <option value="">Select</option>
                {['Banaswadi', 'Jayanagar', 'Vidyanagar', 'Trimulgherry'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea style={{ ...baseInput, border: '1px solid #CFD6DD', minHeight: 72, resize: 'vertical' }}
              value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
          </Field>

          {submitError && <p style={{ color: '#EF4444', fontSize: 13 }}>{submitError}</p>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #CFD6DD', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}>Cancel</button>
          <button onClick={handleCreate} disabled={saving || (dedup.status === 'found' && !proceedingAnyway)}
            style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: saving || (dedup.status === 'found' && !proceedingAnyway) ? '#9CA3AF' : '#1874D0', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {saving ? 'Creating...' : dedup.status === 'found' && !proceedingAnyway ? 'Resolve Duplicate First' : 'Create'}
          </button>
        </div>
      </div>
    </>
  );
}
