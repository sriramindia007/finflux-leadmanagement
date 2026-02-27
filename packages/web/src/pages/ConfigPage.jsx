import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const col = {
  navy:    '#003366',
  blue:    '#1874D0',
  bg:      '#F6F9FC',
  surface: '#FFFFFF',
  border:  '#E5E7EB',
  text:    '#1F2937',
  muted:   '#6B7280',
  success: '#10B981',
  warn:    '#F59E0B',
  danger:  '#EF4444',
};

const TABS = [
  { key: 'prequal',  label: 'Prequalification' },
  { key: 'workflow', label: 'Workflow' },
  { key: 'fields',   label: 'Lead Fields' },
  { key: 'policies', label: 'Policies' },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

function Section({ title, description, children }) {
  return (
    <div style={{ background: col.surface, borderRadius: 8, border: `1px solid ${col.border}`, padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: col.navy, marginBottom: description ? 2 : 14 }}>{title}</div>
      {description && <div style={{ fontSize: 12, color: col.muted, marginBottom: 14 }}>{description}</div>}
      {children}
    </div>
  );
}

function SaveBar({ saving, saved, tabLabel, onSave }) {
  const handleClick = () => {
    if (window.confirm(`Save changes to "${tabLabel}"? This will update production settings immediately.`)) {
      onSave();
    }
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 4 }}>
      {saved && <span style={{ fontSize: 13, color: col.success, fontWeight: 600 }}>✓ Saved successfully</span>}
      <button
        onClick={handleClick}
        disabled={saving}
        style={{
          padding: '10px 28px', background: saving ? '#9CA3AF' : col.blue, color: '#fff',
          border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 600,
        }}
      >
        {saving ? 'Saving...' : `Save ${tabLabel}`}
      </button>
    </div>
  );
}

function ChipEditor({ items = [], onChange }) {
  const [inputVal, setInputVal] = useState('');

  const addItem = () => {
    const v = inputVal.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setInputVal('');
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, minHeight: 32 }}>
        {items.map(item => (
          <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 16 }}>
            <span style={{ fontSize: 12, color: '#1D4ED8' }}>{item}</span>
            <button
              onClick={() => onChange(items.filter(i => i !== item))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', fontSize: 15, lineHeight: 1, padding: 0, marginLeft: 2 }}
            >×</button>
          </span>
        ))}
        {items.length === 0 && <span style={{ fontSize: 12, color: col.muted, fontStyle: 'italic' }}>No items yet</span>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          placeholder="Type and press Enter to add..."
          style={{ flex: 1, padding: '6px 10px', border: `1px solid ${col.border}`, borderRadius: 6, fontSize: 13, outline: 'none' }}
        />
        <button
          onClick={addItem}
          style={{ padding: '6px 14px', background: col.blue, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >Add</button>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${col.border}`, color: col.muted, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', background: '#F9FAFB' }}>{children}</th>;
}
function Td({ children, style = {} }) {
  return <td style={{ padding: '10px 12px', borderBottom: `1px solid #F3F4F6`, verticalAlign: 'middle', ...style }}>{children}</td>;
}

// ── Tab: Prequalification ─────────────────────────────────────────────────────

function PrequalTab({ config, saving, saved, tabLabel, onDirty, onSave }) {
  const [rules, setRules] = useState(() => config?.rules || []);
  const [bands, setBands] = useState(() => config?.bands || []);

  const updateRule = (i, field, val) => { onDirty(); setRules(rs => rs.map((r, j) => j === i ? { ...r, [field]: val } : r)); };
  const removeRule = (i) => { onDirty(); setRules(rs => rs.filter((_, j) => j !== i)); };
  const addRule = () => { onDirty(); setRules(rs => [...rs, { id: `rule_${Date.now()}`, label: 'New Rule', field: '', type: 'required', weight: 10, required: false, enabled: true }]); };
  const updateBand = (i, field, val) => { onDirty(); setBands(bs => bs.map((b, j) => j === i ? { ...b, [field]: val } : b)); };

  const recBadge = (r) => {
    const bg = r === 'PROCEED' ? '#D1FAE5' : r === 'CONDITIONAL' ? '#FEF3C7' : '#FEE2E2';
    const fg = r === 'PROCEED' ? '#065F46' : r === 'CONDITIONAL' ? '#92400E' : '#991B1B';
    return <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>{r}</span>;
  };

  return (
    <div>
      <Section title="Scoring Rules" description="Field-level rules and weights. Score range: 300–900. Hard-block if a required rule fails.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>
              <Th>Label</Th><Th>Field</Th><Th>Type</Th><Th>Weight</Th><Th>Required</Th><Th>Enabled</Th><Th></Th>
            </tr></thead>
            <tbody>
              {rules.map((rule, i) => (
                <tr key={rule.id}>
                  <Td>
                    <input value={rule.label} onChange={e => updateRule(i, 'label', e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', border: `1px solid ${col.border}`, borderRadius: 4, fontSize: 13, fontWeight: 600 }} />
                  </Td>
                  <Td>
                    <input value={rule.field} onChange={e => updateRule(i, 'field', e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', border: `1px solid ${col.border}`, borderRadius: 4, fontSize: 12, fontFamily: 'monospace', color: col.muted }} />
                  </Td>
                  <Td>
                    <select value={rule.type} onChange={e => updateRule(i, 'type', e.target.value)}
                      style={{ padding: '4px 6px', border: `1px solid ${col.border}`, borderRadius: 4, fontSize: 12 }}>
                      {['required', 'range', 'regex', 'enum'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Td>
                  <Td>
                    <input
                      type="number" min="0" max="100" value={rule.weight}
                      onChange={e => updateRule(i, 'weight', Number(e.target.value))}
                      style={{ width: 64, padding: '4px 6px', border: `1px solid ${col.border}`, borderRadius: 4, fontSize: 13 }}
                    />
                  </Td>
                  <Td>
                    <input type="checkbox" checked={!!rule.required} onChange={e => updateRule(i, 'required', e.target.checked)} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                  </Td>
                  <Td>
                    <input type="checkbox" checked={rule.enabled !== false} onChange={e => updateRule(i, 'enabled', e.target.checked)} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                  </Td>
                  <Td>
                    <button onClick={() => removeRule(i)} title="Remove rule" style={{ background: 'none', border: 'none', cursor: 'pointer', color: col.danger, fontSize: 16 }}>×</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addRule} style={{ marginTop: 10, padding: '6px 14px', background: '#EFF6FF', color: col.blue, border: `1px solid #BFDBFE`, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Add Rule
        </button>
      </Section>

      <Section title="Scoring Bands" description="Map score ranges to qualification bands. Scores outside defined bands get 'CONDITIONAL'.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>
              <Th>Band Label</Th><Th>Min Score</Th><Th>Max Score</Th><Th>Recommendation</Th>
            </tr></thead>
            <tbody>
              {bands.map((band, i) => (
                <tr key={band.label}>
                  <Td style={{ fontWeight: 600 }}>{band.label}</Td>
                  <Td>
                    <input type="number" value={band.minScore} min="300" max="900"
                      onChange={e => updateBand(i, 'minScore', Number(e.target.value))}
                      style={{ width: 80, padding: '4px 6px', border: `1px solid ${col.border}`, borderRadius: 4, fontSize: 13 }}
                    />
                  </Td>
                  <Td>
                    <input type="number" value={band.maxScore} min="300" max="900"
                      onChange={e => updateBand(i, 'maxScore', Number(e.target.value))}
                      style={{ width: 80, padding: '4px 6px', border: `1px solid ${col.border}`, borderRadius: 4, fontSize: 13 }}
                    />
                  </Td>
                  <Td>{recBadge(band.recommendation)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <SaveBar saving={saving} saved={saved} tabLabel={tabLabel} onSave={() => onSave({ ...config, rules, bands })} />
    </div>
  );
}

// ── Tab: Workflow ─────────────────────────────────────────────────────────────

function WorkflowTab({ config, saving, saved, tabLabel, onDirty, onSave }) {
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(config || {})));

  const updateStep = (i, field, val) => { onDirty(); setLocal(l => ({ ...l, steps: l.steps.map((s, j) => j === i ? { ...s, [field]: val } : s) })); };

  return (
    <div>
      <Section title="Workflow Steps" description="Define the onboarding journey steps and the role responsible for each step.">
        {(local.steps || []).sort((a, b) => a.order - b.order).map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid #F3F4F6` }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: col.blue, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {step.order}
            </div>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{step.label}</div>
            <div style={{ fontSize: 12, color: col.muted }}>Assigned to:</div>
            <select
              value={step.role}
              onChange={e => updateStep(i, 'role', e.target.value)}
              style={{ padding: '5px 10px', border: `1px solid ${col.border}`, borderRadius: 5, fontSize: 13, cursor: 'pointer' }}
            >
              {['Field Officer', 'Hub Team', 'Branch Manager'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        ))}
      </Section>

      <Section title="Status Transitions" description="Allowed lead status changes (read-only — contact admin to modify state machine).">
        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 16px' }}>
          {Object.entries(local.statusTransitions || {}).map(([from, to]) => (
            <div key={from} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: col.navy, minWidth: 160, fontSize: 12 }}>{from}</span>
              <span style={{ color: col.muted }}>→</span>
              <span>
                {to.length === 0
                  ? <em style={{ color: col.muted, fontSize: 12 }}>terminal (no transitions)</em>
                  : to.map(t => (
                    <span key={t} style={{ marginRight: 6, padding: '2px 8px', background: '#EFF6FF', borderRadius: 12, color: '#1D4ED8', fontSize: 11, fontWeight: 600 }}>{t}</span>
                  ))}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#1D4ED8' }}>
        Follow-up and approval policies are managed in the <strong>Policies</strong> tab (single source of truth).
      </div>

      <SaveBar saving={saving} saved={saved} tabLabel={tabLabel} onSave={() => onSave(local)} />
    </div>
  );
}

// ── Tab: Lead Fields ──────────────────────────────────────────────────────────

const FIELD_LABELS = {
  leadSource:       'Lead Source',
  leadType:         'Lead Type',
  work:             'Work Profile',
  loanPurpose:      'Loan Purpose',
  productType:      'Product Type',
  leadTemp:         'Lead Temperature',
  rejectionReasons: 'Rejection Reasons',
};

function FieldsTab({ config, saving, saved, tabLabel, onDirty, onSave }) {
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(config || {})));

  return (
    <div>
      <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#713F12' }}>
        <strong>Note:</strong> Changes here update the dropdown options shown to Field Officers in the mobile app (fetched at login time).
      </div>
      {Object.entries(FIELD_LABELS).map(([key, label]) => (
        <Section key={key} title={label}>
          <ChipEditor
            items={local[key] || []}
            onChange={items => { onDirty(); setLocal(l => ({ ...l, [key]: items })); }}
          />
        </Section>
      ))}
      <SaveBar saving={saving} saved={saved} tabLabel={tabLabel} onSave={() => onSave(local)} />
    </div>
  );
}

// ── Tab: Policies ─────────────────────────────────────────────────────────────

function PoliciesTab({ config, saving, saved, tabLabel, onDirty, onSave }) {
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(config || {})));

  const toggleDedup = (field, checked) => {
    onDirty();
    setLocal(l => {
      const cur = l.dedupCheckFields || [];
      return { ...l, dedupCheckFields: checked ? [...cur, field] : cur.filter(x => x !== field) };
    });
  };

  return (
    <div>
      <Section title="Approval Policy">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!local.requireFollowUpForApproval}
              onChange={e => { onDirty(); setLocal(l => ({ ...l, requireFollowUpForApproval: e.target.checked })); }}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14 }}>Require follow-up (call log) before Hub Team can approve</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>Minimum call logs required for approval:</span>
            <input
              type="number" min="0" max="10"
              value={local.minCallLogsForApproval ?? 1}
              onChange={e => { onDirty(); setLocal(l => ({ ...l, minCallLogsForApproval: Number(e.target.value) })); }}
              style={{ width: 70, padding: '5px 8px', border: `1px solid ${col.border}`, borderRadius: 4, fontSize: 14 }}
            />
          </div>
        </div>
      </Section>

      <Section title="Deduplication" description="Fields checked to detect duplicate leads when a new lead is submitted.">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {['mobile', 'name', 'pincode'].map(f => (
            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={(local.dedupCheckFields || []).includes(f)}
                onChange={e => toggleDedup(f, e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14, textTransform: 'capitalize' }}>{f}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Field Officers" description="List of active Field Officers. Used in assignment dropdowns.">
        <ChipEditor
          items={local.fieldOfficers || []}
          onChange={items => { onDirty(); setLocal(l => ({ ...l, fieldOfficers: items })); }}
        />
      </Section>

      <Section title="Hub Team" description="List of active Hub Team members for lead review and approval.">
        <ChipEditor
          items={local.hubTeam || []}
          onChange={items => { onDirty(); setLocal(l => ({ ...l, hubTeam: items })); }}
        />
      </Section>

      <Section title="Assignment">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!local.autoAssignRoundRobin}
            onChange={e => { onDirty(); setLocal(l => ({ ...l, autoAssignRoundRobin: e.target.checked })); }}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 14 }}>Auto-assign new leads to Hub Team members using round-robin</span>
        </label>
      </Section>

      <SaveBar saving={saving} saved={saved} tabLabel={tabLabel} onSave={() => onSave(local)} />
    </div>
  );
}

// ── Main ConfigPage ───────────────────────────────────────────────────────────

export default function ConfigPage() {
  const [tab,     setTab]     = useState(0);
  const [dirty,   setDirty]   = useState(false); // unsaved changes on current tab
  const [config,  setConfig]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null); // key currently being saved
  const [saved,   setSaved]   = useState(null); // key just saved (for 2s feedback)
  const [error,   setError]   = useState('');

  const switchTab = (i) => {
    if (dirty && !window.confirm('You have unsaved changes on this tab. Leave without saving?')) return;
    setTab(i);
    setDirty(false);
  };

  useEffect(() => {
    api.getConfig()
      .then(setConfig)
      .catch(() => setError('Failed to load configuration. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const saveKey = async (key, value) => {
    setSaving(key);
    try {
      await api.putConfig(key, value);
      setConfig(c => ({ ...c, [key]: value }));
      setSaved(key);
      setDirty(false);
      setTimeout(() => setSaved(null), 2500);
    } catch (e) {
      alert('Save failed: ' + (e.message || 'Network error'));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: col.muted }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⚙️</div>
        Loading configuration...
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 40, textAlign: 'center', color: col.danger, fontSize: 15 }}>{error}</div>;
  }

  const currentKey = TABS[tab].key;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: col.navy, margin: '0 0 4px' }}>System Configuration</h1>
        <div style={{ fontSize: 13, color: col.muted }}>
          Manage prequalification scoring rules, workflow steps, dropdown options, and operational policies.
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', borderRadius: 8, padding: 4, marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => switchTab(i)}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === i ? 700 : 500,
              background: tab === i ? '#fff' : 'transparent',
              color: tab === i ? col.navy : col.muted,
              boxShadow: tab === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <PrequalTab  config={config?.prequal}  saving={saving === 'prequal'}  saved={saved === 'prequal'}  tabLabel="Prequalification" onDirty={() => setDirty(true)} onSave={v => saveKey('prequal',  v)} />}
      {tab === 1 && <WorkflowTab config={config?.workflow} saving={saving === 'workflow'} saved={saved === 'workflow'} tabLabel="Workflow"        onDirty={() => setDirty(true)} onSave={v => saveKey('workflow', v)} />}
      {tab === 2 && <FieldsTab   config={config?.fields}   saving={saving === 'fields'}   saved={saved === 'fields'}   tabLabel="Lead Fields"     onDirty={() => setDirty(true)} onSave={v => saveKey('fields',   v)} />}
      {tab === 3 && <PoliciesTab config={config?.policies} saving={saving === 'policies'} saved={saved === 'policies'} tabLabel="Policies"        onDirty={() => setDirty(true)} onSave={v => saveKey('policies', v)} />}
    </div>
  );
}
