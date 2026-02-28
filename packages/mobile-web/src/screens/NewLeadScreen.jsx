import React, { useState, useEffect } from 'react';
import { c, input, primaryBtn } from '../theme';
import { api } from '../services/api';

// Fallback options used when config API is unavailable
const FALLBACK_FIELDS = {
  leadSource:  ['Field Scouting', 'Inbound Call', 'Outbound Call', 'Back Office', 'Referral'],
  leadType:    ['Individual', 'JLG', 'Group'],
  work:        ['Home Maker', 'Vegetable Vendor', 'Tailoring', 'Petty Shop', 'Dairy Farming', 'Flower Vendor', 'Other'],
  loanPurpose: ['Business', 'Working Capital', 'Business Expansion', 'Asset Purchase'],
  productType: ['Micro Loan', 'MSME Loan', 'Agri Loan', 'Group Loan'],
};

const sel = (err) => ({ ...input(err), appearance: 'none', cursor: 'pointer' });

const RULES = {
  name:       { required: true,  regex: /^[A-Za-z\s]{2,}$/, msg: 'Enter a valid name (letters only, min 2 chars)' },
  mobile:     { required: true,  regex: /^[6-9]\d{9}$/,      msg: 'Enter a valid 10-digit Indian mobile number' },
  leadType:   { required: true,  regex: null,                 msg: 'Select a lead type' },
  leadSource: { required: true,  regex: null,                 msg: 'Select a lead source' },
  loanAmount: { required: true,  regex: /^[1-9]\d*$/,         msg: 'Enter a valid positive loan amount' },
  pincode:    { required: false, regex: /^\d{6}$/,            msg: 'Enter a valid 6-digit pincode' },
};

function validateField(field, value) {
  const rule = RULES[field];
  if (!rule) return '';
  if (rule.required && !value) return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
  if (value && rule.regex && !rule.regex.test(value)) return rule.msg;
  return '';
}

const labelStyle = { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4, display: 'block' };
const requiredStar = { color: '#EF4444' };
const errorStyle = { fontSize: 11, color: '#EF4444', marginTop: 2 };
const errorBorder = { borderColor: '#EF4444' };

function Field({ label, required, error, touched, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={labelStyle}>
        {label}{required && <span style={requiredStar}> *</span>}
      </label>
      {children}
      {touched && error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}

export default function NewLeadScreen({ navigate, user }) {
  const [fields, setFields] = useState(null); // dynamic field options from config

  useEffect(() => {
    const CACHE_KEY = 'lm_config_fields';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) { setFields(data); return; }
      }
    } catch (_) { /* ignore */ }
    api.getConfigKey('fields')
      .then(data => {
        setFields(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch (_) { /* ignore */ }
      })
      .catch(() => setFields(FALLBACK_FIELDS));
  }, []);

  const opts = (key) => fields?.[key] || FALLBACK_FIELDS[key] || [];

  const [form, setForm] = useState({
    name: '', mobile: '', work: '', leadType: '', leadSource: '',
    loanAmount: '', loanPurpose: '', productType: '',
    pincode: '', state: '', district: '', taluka: '', locality: '', notes: '',
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving]   = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [dedup, setDedup]     = useState({ status: 'idle', lead: null }); // idle|checking|found|clear
  const [proceedReason, setProceedReason]     = useState('');
  const [proceedingAnyway, setProceedingAnyway] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setAndValidate = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setTouched(t => ({ ...t, [k]: true }));
    setErrors(e => ({ ...e, [k]: validateField(k, v) }));
  };

  const touch = (k) => {
    setTouched(t => ({ ...t, [k]: true }));
    setErrors(e => ({ ...e, [k]: validateField(k, form[k]) }));
  };

  const handlePincode = async (v) => {
    const cleaned = v.replace(/\D/g, '').slice(0, 6);
    setForm(f => ({ ...f, pincode: cleaned }));
    setTouched(t => ({ ...t, pincode: true }));
    setErrors(e => ({ ...e, pincode: validateField('pincode', cleaned) }));
    if (cleaned.length < 6) { setForm(f => ({ ...f, state: '', district: '', taluka: '' })); return; }
    setPincodeLoading(true);
    try {
      const info = await api.lookupPincode(cleaned);
      setForm(f => ({ ...f, pincode: cleaned, state: info.state, district: info.district, taluka: info.taluka }));
      setErrors(e => ({ ...e, pincode: '' }));
    } catch (_) {
      setForm(f => ({ ...f, state: '', district: '', taluka: '' }));
      setErrors(e => ({ ...e, pincode: 'Pincode not found' }));
    } finally {
      setPincodeLoading(false);
    }
  };

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

  const handleSave = async () => {
    const allTouched = Object.keys(RULES).reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched(allTouched);
    const newErrors = Object.keys(RULES).reduce((a, k) => ({ ...a, [k]: validateField(k, form[k]) }), {});
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      setMsg('Please fix the highlighted fields.');
      return;
    }
    if (dedup.status === 'found' && !proceedingAnyway) {
      setMsg('Resolve the duplicate mobile number before saving.');
      return;
    }
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...form, loanAmount: Number(form.loanAmount),
        source: form.leadSource, createdBy: user?.name || 'Field Officer', createdByRole: 'Field Officer',
        branch:  user?.branch  || '',
        village: user?.village || '',
        centre:  user?.centre  || '',
      };
      if (proceedingAnyway && proceedReason) payload.dedupOverrideReason = proceedReason;
      await api.createLead(payload);
      setMsg('✅ Lead created! Pending hub team approval.');
      setTimeout(() => navigate('leads'), 1500);
    } catch (_) {
      setMsg('❌ Failed — is the API server running?');
    } finally {
      setSaving(false);
    }
  };

  const t = touched;
  const e = errors;

  const inputStyle = (field) => input(t[field] && e[field]);
  const selStyle   = (field) => sel(t[field] && e[field]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F5F6FA' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px', background: '#F5F6FA' }}>
        <button onClick={() => navigate('leads')} style={{ width: 36, height: 36, borderRadius: 18, background: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 18 }}>←</button>
        <span style={{ fontSize: 18, fontWeight: 700, color: c.navy }}>New Lead</span>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>

        {/* Officer assignment — auto-populated, read-only */}
        {(user?.branch || user?.village || user?.centre) && (
          <div style={{ background: '#EBF5FF', borderRadius: 10, padding: '10px 14px', marginBottom: 14, marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {user.branch  && <div><div style={{ fontSize: 10, fontWeight: 700, color: '#1874D0', letterSpacing: 0.5, textTransform: 'uppercase' }}>Branch</div><div style={{ fontSize: 13, fontWeight: 600, color: '#003366', marginTop: 2 }}>{user.branch}</div></div>}
            {user.village && <div><div style={{ fontSize: 10, fontWeight: 700, color: '#1874D0', letterSpacing: 0.5, textTransform: 'uppercase' }}>Village</div><div style={{ fontSize: 13, fontWeight: 600, color: '#003366', marginTop: 2 }}>{user.village}</div></div>}
            {user.centre  && <div><div style={{ fontSize: 10, fontWeight: 700, color: '#1874D0', letterSpacing: 0.5, textTransform: 'uppercase' }}>Centre</div><div style={{ fontSize: 13, fontWeight: 600, color: '#003366', marginTop: 2 }}>{user.centre}</div></div>}
          </div>
        )}

        {/* Basic Info */}
        <div style={{ fontSize: 13, fontWeight: 700, color: c.navy, margin: '4px 0 10px' }}>Basic Info</div>

        <Field label="Name" required error={e.name} touched={t.name}>
          <input style={inputStyle('name')} placeholder="Customer full name"
            value={form.name}
            onChange={ev => setAndValidate('name', ev.target.value)}
            onBlur={() => touch('name')} />
        </Field>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Mobile Number<span style={requiredStar}> *</span></label>
          <input
            style={inputStyle('mobile')}
            placeholder="10-digit number"
            type="tel"
            value={form.mobile}
            onChange={ev => {
              const v = ev.target.value.replace(/\D/g, '').slice(0, 10);
              setAndValidate('mobile', v);
              if (v.length < 10) setDedup({ status: 'idle', lead: null });
            }}
            onBlur={() => { touch('mobile'); checkDedup(form.mobile); }}
            maxLength={10}
          />
          {t.mobile && e.mobile && <div style={errorStyle}>{e.mobile}</div>}
          {dedup.status === 'checking' && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Checking duplicates...</div>}
          {dedup.status === 'clear'    && <div style={{ fontSize: 11, color: '#10B981', fontWeight: 500, marginTop: 4 }}>✓ No duplicate found</div>}
          {dedup.status === 'found' && !proceedingAnyway && (
            <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 6, padding: '10px 12px', marginTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>⚠️ Existing lead found</div>
              <div style={{ fontSize: 12, color: '#78350F' }}>
                <strong>{dedup.lead.name}</strong> &nbsp;•&nbsp; {dedup.lead.status} &nbsp;•&nbsp; ID: {dedup.lead.id}
              </div>
              <button onClick={() => setProceedingAnyway(true)} style={{ marginTop: 8, fontSize: 12, color: '#92400E', background: 'none', border: '1px solid #F59E0B', borderRadius: 4, cursor: 'pointer', padding: '2px 8px' }}>
                Proceed Anyway
              </button>
            </div>
          )}
          {dedup.status === 'found' && proceedingAnyway && (
            <div style={{ marginTop: 6 }}>
              <input
                style={{ ...input(false), border: '1px solid #F59E0B', fontSize: 12 }}
                value={proceedReason}
                onChange={ev => setProceedReason(ev.target.value)}
                placeholder="Reason for proceeding with duplicate..."
              />
            </div>
          )}
        </div>

        <Field label="Work">
          <select style={sel(false)} value={form.work} onChange={ev => set('work', ev.target.value)}>
            <option value="">Select</option>
            {opts('work').map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Lead Type" required error={e.leadType} touched={t.leadType}>
          <select style={selStyle('leadType')} value={form.leadType}
            onChange={ev => setAndValidate('leadType', ev.target.value)}
            onBlur={() => touch('leadType')}>
            <option value="">Select</option>
            {opts('leadType').map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Lead Source" required error={e.leadSource} touched={t.leadSource}>
          <select style={selStyle('leadSource')} value={form.leadSource}
            onChange={ev => setAndValidate('leadSource', ev.target.value)}
            onBlur={() => touch('leadSource')}>
            <option value="">Select</option>
            {opts('leadSource').map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Loan Amount (₹)" required error={e.loanAmount} touched={t.loanAmount}>
          <input style={inputStyle('loanAmount')} placeholder="e.g. 25000" type="number"
            value={form.loanAmount}
            onChange={ev => setAndValidate('loanAmount', ev.target.value.replace(/\D/g, ''))}
            onBlur={() => touch('loanAmount')} />
        </Field>

        <Field label="Loan Purpose">
          <select style={sel(false)} value={form.loanPurpose} onChange={ev => set('loanPurpose', ev.target.value)}>
            <option value="">Select</option>
            {opts('loanPurpose').map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Product Type">
          <select style={sel(false)} value={form.productType} onChange={ev => set('productType', ev.target.value)}>
            <option value="">Select</option>
            {opts('productType').map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        {/* Address */}
        <div style={{ fontSize: 13, fontWeight: 700, color: c.navy, margin: '8px 0 10px' }}>Address</div>

        <Field label={pincodeLoading ? 'Pincode (looking up...)' : 'Pincode'} error={e.pincode} touched={t.pincode}>
          <input style={inputStyle('pincode')} placeholder="6-digit pincode" type="number"
            value={form.pincode} onChange={ev => handlePincode(ev.target.value)} maxLength={6} />
        </Field>

        <Field label="State">
          <input style={{ ...input(false), background: '#F1F3F4', color: c.textMuted }} placeholder="Auto-fill" value={form.state} readOnly />
        </Field>
        <Field label="District">
          <input style={{ ...input(false), background: '#F1F3F4', color: c.textMuted }} placeholder="Auto-fill" value={form.district} readOnly />
        </Field>
        <Field label="Taluka">
          <input style={{ ...input(false), background: '#F1F3F4', color: c.textMuted }} placeholder="Auto-fill" value={form.taluka} readOnly />
        </Field>

        <Field label="Locality">
          <select style={sel(false)} value={form.locality} onChange={ev => set('locality', ev.target.value)}>
            <option value="">Select</option>
            {['Banaswadi', 'Jayanagar', 'Vidyanagar', 'Trimulgherry', 'Brodipet'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Notes">
          <textarea style={{ ...input(false), minHeight: 72, resize: 'vertical' }} placeholder="Optional notes"
            value={form.notes} onChange={ev => set('notes', ev.target.value)} />
        </Field>

        {msg && (
          <div style={{ fontSize: 13, color: msg.startsWith('✅') ? c.converted : '#EF4444', marginBottom: 10, textAlign: 'center' }}>
            {msg}
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: `1px solid ${c.borderLight}` }}>
        <button
          style={primaryBtn(saving || (dedup.status === 'found' && !proceedingAnyway))}
          onClick={handleSave}
          disabled={saving || (dedup.status === 'found' && !proceedingAnyway)}
        >
          {saving ? 'Saving...' : dedup.status === 'found' && !proceedingAnyway ? 'Resolve Duplicate First' : 'Save Lead'}
        </button>
      </div>
    </div>
  );
}
