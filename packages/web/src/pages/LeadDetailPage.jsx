import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import AddCallLogDrawer from '../components/AddCallLogDrawer';
import { api } from '../services/api';

const FO_LIST = ['Ravi Kumar', 'Jagan Reddy', 'Sameer Khan', 'Amul Sharma', 'Gopal Nair', 'Mohan Das'];

// ── Start Over modal ─────────────────────────────────────────────
function StartOverModal({ onConfirm, onClose, saving }) {
  const [reason, setReason] = useState('');
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: 440, zIndex: 301, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', padding: '20px 24px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Start Over</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>This will reset the lead back to Approval Pending and clear all completed steps.</div>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Reason for starting over</label>
          <textarea
            autoFocus
            rows={4}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe why this lead needs to restart the workflow…"
            style={{ padding: '10px 12px', border: '1px solid #CFD6DD', borderRadius: 8, fontSize: 13, color: '#003366', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400E' }}>
            All onboarding steps will be reset. Call logs and notes are preserved.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 24px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 16px', border: '1px solid #CFD6DD', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || saving} style={{ padding: '8px 20px', border: 'none', borderRadius: 4, background: !reason.trim() || saving ? '#9CA3AF' : '#F59E0B', color: '#fff', cursor: !reason.trim() || saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
            {saving ? 'Resetting...' : 'Confirm Start Over'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Activity Timeline ────────────────────────────────────────────
function ActivityTimeline({ lead }) {
  const events = [];

  // Lead created
  if (lead.createdAt) events.push({ ts: lead.createdAt, icon: '🌱', label: 'Lead created', sub: `by ${lead.createdBy || 'Hub Team'}`, color: '#1874D0' });

  // Step completions
  (lead.steps || []).filter(s => s.status === 'completed' && s.completedAt).forEach(s => {
    events.push({ ts: s.completedAt, icon: '✓', label: `${s.name} completed`, sub: s.completedBy ? `by ${s.completedBy}` : '', color: '#10B981' });
  });

  // Call logs — normalize web (customerPickedUp/leadTemp) and mobile (outcome/leadTemperature)
  (lead.callLogs || []).forEach(log => {
    const answered = log.customerPickedUp || log.outcome === 'Answered';
    const temp = log.leadTemp || log.leadTemperature || '';
    events.push({ ts: log.calledAt, icon: '📞', label: answered ? 'Call — Answered' : `Call — ${log.outcome || 'No answer'}`, sub: `${temp}${log.notes ? (temp ? ' · ' : '') + log.notes.slice(0, 40) : ''}`.trim(), color: '#F59E0B' });
  });

  // Visit logs
  (lead.visitLogs || []).forEach(v => {
    events.push({ ts: v.visitedAt, icon: '📍', label: 'Visit recorded', sub: v.outcome || v.notes || '', color: '#10B981' });
  });

  // Notes log
  (lead.notesLog || []).forEach(n => {
    events.push({ ts: n.addedAt, icon: '📝', label: 'Note added', sub: n.text?.slice(0, 50) || '', color: '#8B5CF6' });
  });

  // Status changes (inferred from current status)
  if (lead.status === 'QUALIFIED') events.push({ ts: lead.updatedAt || lead.createdAt, icon: '✅', label: 'Approved — Qualified', sub: '', color: '#10B981' });
  if (lead.status === 'REJECTED')  events.push({ ts: lead.updatedAt || lead.createdAt, icon: '❌', label: 'Rejected', sub: lead.rejectionReason || '', color: '#EF4444' });
  if (lead.status === 'CONVERTED') events.push({ ts: lead.convertedAt || lead.updatedAt, icon: '🎉', label: 'Converted to Loan', sub: '', color: '#10B981' });

  events.sort((a, b) => new Date(b.ts) - new Date(a.ts));

  if (events.length === 0) return null;

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Activity</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {events.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
            {i < events.length - 1 && <div style={{ position: 'absolute', left: 12, top: 22, bottom: 0, width: 1, background: '#E5E7EB' }} />}
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: e.color + '22', border: `1.5px solid ${e.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{e.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937', lineHeight: 1.3 }}>{e.label}</div>
              {e.sub && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1, lineHeight: 1.3 }}>{e.sub}</div>}
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                {e.ts ? new Date(e.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step sidebar ────────────────────────────────────────────────
function StepSidebar({ steps }) {
  return (
    <div style={s.sidebar}>
      {(steps || []).map((step, i) => {
        const done   = step.status === 'completed';
        const active = step.status === 'in_progress';
        return (
          <div key={step.id} style={s.stepRow}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? '#10B981' : active ? '#FFF7ED' : 'transparent', border: `2px solid ${done ? '#10B981' : active ? '#F59E0B' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? 12 : 11, fontWeight: 700, color: done ? '#fff' : active ? '#F59E0B' : '#9CA3AF' }}>
                {done ? '✓' : active ? '●' : i + 1}
              </div>
              {i < steps.length - 1 && <div style={{ width: 2, flex: 1, background: done ? '#10B981' : '#E5E7EB', margin: '4px 0' }} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: done ? 500 : active ? 600 : 400, color: done ? '#10B981' : active ? '#F59E0B' : '#9CA3AF', paddingTop: 2 }}>{step.name}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Info panel ──────────────────────────────────────────────────
function InfoPanel({ title, data, onEdit }) {
  return (
    <div style={s.infoPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ borderLeft: '3px solid #1874D0', paddingLeft: 8, fontSize: 14, fontWeight: 600, color: '#1874D0' }}>{title}</div>
        {onEdit && <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#1874D0' }}>✏️</button>}
      </div>
      {Object.entries(data).map(([k, v]) => v ? (
        <div key={k} style={s.infoRow}>
          <span style={s.infoLabel}>{k}</span>
          <span style={s.infoValue}>{v}</span>
        </div>
      ) : null)}
    </div>
  );
}

// ── Convert to Loan Application modal ───────────────────────────
function ConvertModal({ lead, onConfirm, onClose, converting }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: 480, zIndex: 301, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        {/* Modal header */}
        <div style={{ background: 'linear-gradient(135deg,#1874D0,#003366)', padding: '20px 24px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Convert to Loan Application</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>All onboarding steps are complete. Please review and confirm.</div>
        </div>

        {/* Lead summary */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Customer Name',  lead.name],
            ['Mobile',         lead.mobile],
            ['Lead Type',      lead.leadType],
            ['Lead Source',    lead.leadSource],
            ['Loan Amount',    lead.loanAmount ? `₹ ${Number(lead.loanAmount).toLocaleString('en-IN')}` : '—'],
            ['Loan Purpose',   lead.loanPurpose || '—'],
            ['Address',        [lead.locality, lead.district, lead.state].filter(Boolean).join(', ') || '—'],
            ['Field Officer',  lead.assignedTo || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{k}</span>
              <span style={{ fontSize: 13, color: '#003366', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}

          {/* Steps summary */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Onboarding Steps Completed</div>
            {(lead.steps || []).map(step => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#10B981', fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 13, color: '#374151' }}>{step.name}</span>
                {step.completedBy && (
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>by {step.completedBy}</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#065F46', marginTop: 4 }}>
            This will create a Loan Application for <strong>{lead.name}</strong> and move the lead to CONVERTED status.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} disabled={converting} style={{ padding: '8px 20px', border: '1px solid #CFD6DD', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}>Cancel</button>
          <button onClick={onConfirm} disabled={converting} style={{ padding: '8px 24px', border: 'none', borderRadius: 4, background: converting ? '#9CA3AF' : '#10B981', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {converting ? 'Converting...' : 'Confirm & Convert'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Reject modal ─────────────────────────────────────────────────
const REJECT_REASONS = ['Not Interested', 'Ineligible Income', 'Already has Loan', 'Wrong Number', 'Duplicate Lead', 'Other'];

function RejectModal({ onConfirm, onClose, saving }) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');
  const finalReason = reason === 'Other' ? custom : reason;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 10, width: 400, zIndex: 301, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB', fontSize: 15, fontWeight: 600, color: '#EF4444' }}>Reject Lead</div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px' }}>Select a rejection reason:</p>
          {REJECT_REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8, border: `2px solid ${reason === r ? '#EF4444' : '#E5E7EB'}`, background: reason === r ? '#FEF2F2' : '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: reason === r ? '#EF4444' : '#374151', fontWeight: reason === r ? 600 : 400 }}>
              {r}
            </button>
          ))}
          {reason === 'Other' && (
            <input autoFocus value={custom} onChange={e => setCustom(e.target.value)} placeholder="Describe the reason..." style={{ marginTop: 4, padding: '8px 12px', border: '1px solid #CFD6DD', borderRadius: 4, fontSize: 14, color: '#003366', outline: 'none' }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #CFD6DD', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onConfirm(finalReason)} disabled={!finalReason || saving} style={{ padding: '8px 16px', border: 'none', borderRadius: 4, background: !finalReason || saving ? '#9CA3AF' : '#EF4444', color: '#fff', cursor: !finalReason || saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
            {saving ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Re-assign modal (with workload) ──────────────────────────────
function ReassignModal({ current, onConfirm, onClose, saving, error }) {
  const [selected, setSelected] = useState(current || '');
  const [workload, setWorkload] = useState({});
  useEffect(() => { api.getWorkload().then(setWorkload).catch(() => {}); }, []);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 10, width: 400, zIndex: 301, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB', fontSize: 15, fontWeight: 600, color: '#003366' }}>Re-assign Field Officer</div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {FO_LIST.map(fo => {
            const load = workload[fo] || 0;
            const overloaded = load >= 15;
            return (
              <button key={fo} onClick={() => setSelected(fo)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `2px solid ${selected === fo ? '#1874D0' : '#E5E7EB'}`, background: selected === fo ? '#EFF6FF' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: selected === fo ? '#1874D0' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: selected === fo ? '#fff' : '#6B7280', flexShrink: 0 }}>{fo.charAt(0)}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, color: '#003366', fontWeight: selected === fo ? 600 : 400 }}>{fo}</div>
                  <div style={{ fontSize: 11, color: overloaded ? '#DC2626' : '#9CA3AF', marginTop: 1 }}>
                    {load} active lead{load !== 1 ? 's' : ''}{overloaded ? ' ⚠ High load' : ''}
                  </div>
                </div>
                {current === fo && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>current</span>}
              </button>
            );
          })}
        </div>
        {error && <div style={{ margin: '0 20px 8px', padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 13, color: '#B91C1C' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 20px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #CFD6DD', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onConfirm(selected)} disabled={!selected || saving} style={{ padding: '8px 16px', border: 'none', borderRadius: 4, background: !selected || saving ? '#9CA3AF' : '#1874D0', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Reassign'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Prequalify panel ────────────────────────────────────────────
const SCORE_COLOR = { Excellent: '#10B981', 'Very Good': '#10B981', Good: '#1874D0', Fair: '#F59E0B', Poor: '#EF4444' };
const REC_COLOR   = { PROCEED: '#10B981', CONDITIONAL: '#F59E0B', DECLINE: '#EF4444' };

function PrequalifyPanel({ result }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: SCORE_COLOR[result.band] || '#003366' }}>{result.score}</span>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{result.band}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: (REC_COLOR[result.recommendation] || '#9CA3AF') + '22', color: REC_COLOR[result.recommendation] || '#374151' }}>
          {result.recommendation}
        </span>
      </div>
      {(result.rules || []).map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #F9FAFB', fontSize: 12 }}>
          <span style={{ color: r.pass ? '#10B981' : '#EF4444', fontSize: 14, width: 16 }}>{r.pass ? '✓' : '✗'}</span>
          <span style={{ color: '#374151', flex: 1 }}>{r.rule}</span>
          <span style={{ color: '#6B7280' }}>{r.value}</span>
        </div>
      ))}
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Checked {new Date(result.checkedAt).toLocaleString('en-IN')}</div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showCallLog, setShowCallLog] = useState(false);
  const [actioning, setActioning]     = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [converting, setConverting]   = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [reassigning, setReassigning]   = useState(false);
  const [reassignError, setReassignError] = useState('');
  const [showReject, setShowReject]     = useState(false);
  const [prequalify, setPrequalify]     = useState({ status: 'idle', result: null }); // idle|loading|done|error
  const [showStartOver, setShowStartOver] = useState(false);
  const [startingOver, setStartingOver]   = useState(false);
  const [noteText, setNoteText]           = useState('');
  const [addingNote, setAddingNote]       = useState(false);

  const load = async () => {
    try { const d = await api.getLead(id); setLead(d); } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    setActioning(true);
    try {
      await api.updateLead(id, { status: 'QUALIFIED', assignedTo: lead.assignedTo || 'Field Officer' });
      const basicStep = lead.steps?.find(s => s.name === 'Basic Details' && s.status !== 'completed');
      if (basicStep) {
        // Mark Basic Details complete — server auto-advances Qualification to in_progress
        await api.updateStep(id, basicStep.id, { status: 'completed', completedAt: new Date().toISOString(), completedBy: 'Hub Team' });
      } else {
        // Basic Details already done — manually advance Qualification if still pending
        const qualStep = lead.steps?.find(s => s.name === 'Qualification' && s.status === 'pending');
        if (qualStep) await api.updateStep(id, qualStep.id, { status: 'in_progress', completedAt: null, completedBy: null });
      }
      await load();
    } finally { setActioning(false); }
  };

  const handleReject = async (reason) => {
    if (!reason) return;
    setActioning(true);
    try {
      await api.updateLead(id, { status: 'REJECTED', rejectionReason: reason });
      await load();
    } finally {
      setActioning(false);
      setShowReject(false);
    }
  };

  const handleActivityComplete = async () => {
    const activeStep = lead.steps?.find(s => s.status === 'in_progress') || lead.steps?.find(s => s.status === 'pending');
    if (!activeStep) return;
    setActioning(true);
    try {
      await api.updateStep(id, activeStep.id, { status: 'completed', completedAt: new Date().toISOString(), completedBy: 'Hub Team' });
      await load();
    } finally { setActioning(false); }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      await api.updateLead(id, { status: 'CONVERTED', convertedAt: new Date().toISOString() });
      setShowConvert(false);
      await load();
    } finally { setConverting(false); }
  };

  const handleStartOver = async (reason) => {
    setStartingOver(true);
    try {
      await api.startOver(id, { reason, startedBy: 'Hub Team' });
      setShowStartOver(false);
      await load();
    } finally { setStartingOver(false); }
  };

  const handleAddNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    setAddingNote(true);
    try {
      await api.addNote(id, { text, addedBy: 'Hub Team' });
      setNoteText('');
      await load();
    } finally { setAddingNote(false); }
  };

  const handlePrequalify = async () => {
    setPrequalify({ status: 'loading', result: null });
    try {
      const result = await api.prequalify(id);
      setPrequalify({ status: 'done', result });
    } catch (_) {
      setPrequalify({ status: 'error', result: null });
    }
  };

  const handleReassign = async (foName) => {
    setReassigning(true);
    setReassignError('');
    try {
      await api.updateLead(id, { assignedTo: foName });
      setShowReassign(false);
      await load();
    } catch (_) {
      setReassignError('Failed to reassign. Please try again.');
    } finally { setReassigning(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>;
  if (!lead)   return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>Lead not found</div>;

  const isTerminal    = ['CONVERTED', 'REJECTED'].includes(lead.status);
  const isMeetLeadActive = lead.steps?.find(s => s.status === 'in_progress')?.name === 'Meet Lead';
  const allStepsDone  = lead.steps?.every(s => s.status === 'completed');
  const canConvert    = lead.status === 'QUALIFIED' && allStepsDone;
  // Follow-up validation
  const hasCallLog   = (lead.callLogs?.length || 0) > 0;
  const sortedLogs   = [...(lead.callLogs || [])].sort((a, b) => new Date(a.calledAt) - new Date(b.calledAt));
  // A followUpAt is resolved only when a SUBSEQUENT call log exists with calledAt >= followUpAt date.
  // This covers both future dates (impossible to resolve yet) and overdue past dates (no log recorded).
  const pendingFollowUpLog = sortedLogs.find(log => {
    if (!log.followUpAt) return false;
    const due = new Date(log.followUpAt);
    return !sortedLogs.some(l => l !== log && new Date(l.calledAt) >= due);
  }) || null;
  const hasPendingFollowUp  = !!pendingFollowUpLog;
  const followUpIsFuture    = hasPendingFollowUp && new Date(pendingFollowUpLog.followUpAt) > new Date();
  const canApprove          = hasCallLog && !hasPendingFollowUp;

  const basicData = {
    Mobile: lead.mobile,
    Work: lead.work,
    'Lead Type': lead.leadType,
    'Lead Source': lead.leadSource,
    'Created By': lead.createdBy ? `${lead.createdBy}${lead.createdByRole ? ` (${lead.createdByRole})` : ''}` : '',
    'Created Via': lead.source === 'Field Scouting' || lead.createdByRole === 'Field Officer' ? '📱 Mobile App' : '🖥 Web',
    'Created On': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '',
    'Loan Amount': lead.loanAmount ? `₹ ${Number(lead.loanAmount).toLocaleString('en-IN')}` : '',
    'Loan Purpose': lead.loanPurpose,
    Address: [lead.locality, lead.district, lead.state, lead.pincode].filter(Boolean).join(', '),
    Notes: lead.notes,
  };
  const foData = {
    Branch: lead.branch || lead.office,
    Village: lead.village || lead.locality,
    Centre: lead.centre || lead.center,
    'Assigned Officer': lead.assignedTo || '—',
    ...(lead.createdBy && lead.createdByRole === 'Field Officer' && lead.createdBy !== lead.assignedTo
      ? { 'Originally Created By': `${lead.createdBy} (Field Officer)` }
      : {}),
  };
  const activeStep = lead.steps?.find(s => s.status === 'in_progress') || lead.steps?.find(s => s.status === 'pending');

  return (
    <div style={s.page}>
      {/* Lead Header */}
      <div style={s.leadHeader}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#003366', marginRight: 12 }}>←</button>
        <div style={s.avatar}>{lead.name?.charAt(0)?.toUpperCase() || '?'}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#003366' }}>{lead.name}</div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>{lead.leadType} Lead</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>ID: {lead.id}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={s.toolbar}>
        {['Raise Pendency', 'Validations', 'Notes', 'Queries'].map(a => (
          <button key={a} style={s.toolbarBtn}>{a}</button>
        ))}
      </div>

      <div style={s.body}>
        {/* Left Step Sidebar + Activity Timeline */}
        <div style={s.leftPane}>
          <StepSidebar steps={lead.steps} />
          <ActivityTimeline lead={lead} />
        </div>

        {/* Main Content */}
        <div style={s.mainPane}>
          {/* Active Step Header */}
          <div style={s.qualHeader}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#003366' }}>
                {isTerminal
                  ? (lead.status === 'CONVERTED' ? 'Lead Converted' : 'Lead Rejected')
                  : canConvert
                    ? 'All Steps Complete — Ready to Convert'
                    : (activeStep?.name || 'All Steps Complete')}
              </span>
              {!isTerminal && !canConvert && lead.assignedTo && activeStep && !isMeetLeadActive && (
                <span style={{ fontSize: 13, color: '#F59E0B', marginLeft: 12 }}>
                  Due in 2h • Assigned to {lead.assignedTo}{' '}
                  <button onClick={() => setShowReassign(true)} style={{ background: 'none', border: 'none', color: '#1874D0', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                    Re-assign
                  </button>
                </span>
              )}
              {isMeetLeadActive && (
                <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 12 }}>Field officer will complete this step on mobile</span>
              )}
              {isTerminal && lead.rejectionReason && (
                <span style={{ fontSize: 13, color: '#EF4444', marginLeft: 12 }}>Reason: {lead.rejectionReason}</span>
              )}
            </div>
          </div>

          {/* Correction Banner — shown when hub sent lead back for FO correction */}
          {lead.isCorrection && (
            <div style={{ background: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Sent Back for Correction</div>
                <div style={{ fontSize: 13, color: '#78350F' }}>
                  This lead was returned to the field officer for correction. It is now pending their response.
                </div>
                {lead.correctionNote && (
                  <div style={{ marginTop: 8, background: '#FEF3C7', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#92400E', fontStyle: 'italic' }}>
                    "{lead.correctionNote}"
                  </div>
                )}
                {lead.correctionBy && (
                  <div style={{ fontSize: 11, color: '#B45309', marginTop: 6 }}>
                    Sent by {lead.correctionBy} on {lead.correctionAt ? new Date(lead.correctionAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Banner: no call log yet */}
          {lead.status === 'APPROVAL_PENDING' && !hasCallLog && (
            <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>Call log required before approval</div>
                <div style={{ fontSize: 13, color: '#78350F', marginTop: 4 }}>
                  At least one call log must be recorded to confirm contact with the customer before this lead can be approved.
                </div>
                <button
                  onClick={() => setShowCallLog(true)}
                  style={{ marginTop: 8, padding: '6px 14px', background: '#F59E0B', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add Call Log
                </button>
              </div>
            </div>
          )}

          {/* Banner: pending follow-up not yet resolved */}
          {lead.status === 'APPROVAL_PENDING' && hasCallLog && hasPendingFollowUp && (
            <div style={{ background: followUpIsFuture ? '#EFF6FF' : '#FEF3C7', border: `1.5px solid ${followUpIsFuture ? '#93C5FD' : '#F59E0B'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{followUpIsFuture ? '📅' : '⏰'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: followUpIsFuture ? '#1E40AF' : '#92400E' }}>
                  {followUpIsFuture ? 'Follow-up scheduled — cannot approve yet' : 'Follow-up overdue — log the call to proceed'}
                </div>
                <div style={{ fontSize: 13, color: followUpIsFuture ? '#1D4ED8' : '#78350F', marginTop: 4 }}>
                  {followUpIsFuture
                    ? <>Follow-up call due on <strong>{new Date(pendingFollowUpLog.followUpAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</strong>. Once you have made the follow-up call, add a new call log to unlock approval.</>
                    : <>Follow-up was due on <strong>{new Date(pendingFollowUpLog.followUpAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</strong>. Record what happened in a new call log to proceed with approval.</>
                  }
                </div>
                <button
                  onClick={() => setShowCallLog(true)}
                  style={{ marginTop: 8, padding: '6px 14px', background: followUpIsFuture ? '#3B82F6' : '#F59E0B', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add Follow-up Call Log
                </button>
              </div>
            </div>
          )}

          {/* Convert to Loan Application banner — shown when all steps done */}
          {canConvert && (
            <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>All onboarding steps are complete</div>
                <div style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>Ready to convert this lead into a loan application</div>
              </div>
              <button onClick={() => setShowConvert(true)} style={{ padding: '10px 20px', background: '#10B981', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 16 }}>
                Convert to Loan Application →
              </button>
            </div>
          )}

          {/* Two-panel Grid */}
          <div style={s.panelGrid}>
            <InfoPanel title="Basic Details" data={basicData} />
            <div>
              <InfoPanel title="Field Officer" data={foData} onEdit={isTerminal ? undefined : () => setShowReassign(true)} />
              {/* Call Logs */}
              <div style={{ ...s.infoPanel, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ borderLeft: '3px solid #1874D0', paddingLeft: 8, fontSize: 14, fontWeight: 600, color: '#1874D0' }}>Call Logs</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowCallLog(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#1874D0' }}>+</button>
                    <button onClick={() => navigate(`/leads/${id}/call-logs`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#1874D0' }}>→</button>
                  </div>
                </div>
                {(lead.callLogs || []).slice(-2).reverse().map((log, i) => (
                  <div key={log.id} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#003366' }}>Call {lead.callLogs.length - i}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {log.customerPickedUp ? 'Picked up' : log.outcome || 'No answer'} • {log.leadTemp || log.leadTemperature || '—'} • {new Date(log.calledAt).toLocaleDateString('en-IN')}
                    </div>
                    {log.notes && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>{log.notes}</div>}
                  </div>
                ))}
                {(!lead.callLogs || lead.callLogs.length === 0) && <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>No call logs yet</p>}
              </div>

              {/* Prequalify */}
              <div style={{ ...s.infoPanel, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ borderLeft: '3px solid #1874D0', paddingLeft: 8, fontSize: 14, fontWeight: 600, color: '#1874D0' }}>Pre-qualification</div>
                  {prequalify.status !== 'loading' && (
                    <button onClick={handlePrequalify} style={{ fontSize: 12, color: '#1874D0', background: 'none', border: '1px solid #1874D0', borderRadius: 4, cursor: 'pointer', padding: '4px 10px' }}>
                      {prequalify.status === 'done' ? 'Re-run' : 'Run'}
                    </button>
                  )}
                </div>
                {prequalify.status === 'idle'    && <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Not yet run</p>}
                {prequalify.status === 'loading' && <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Running...</p>}
                {prequalify.status === 'error'   && <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>Failed. Try again.</p>}
                {prequalify.status === 'done' && prequalify.result && <PrequalifyPanel result={prequalify.result} />}
              </div>

              {/* Visit Logs */}
              <div style={{ ...s.infoPanel, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ borderLeft: '3px solid #10B981', paddingLeft: 8, fontSize: 14, fontWeight: 600, color: '#10B981' }}>Visit Logs</div>
                </div>
                {(lead.visitLogs || []).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No visits recorded yet — field officer logs visits from the mobile app</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...(lead.visitLogs || [])].reverse().map((v, i) => (
                      <div key={v.id || i} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '9px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>📍 {v.location || 'Customer Location'}</div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>{v.visitedAt ? new Date(v.visitedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</div>
                        </div>
                        {v.outcome && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>Outcome: {v.outcome}</div>}
                        {v.notes && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{v.notes}</div>}
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>By: {v.visitedBy || lead.assignedTo || 'Field Officer'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes Log */}
              <div style={{ ...s.infoPanel, marginTop: 16 }}>
                <div style={{ borderLeft: '3px solid #8B5CF6', paddingLeft: 8, fontSize: 14, fontWeight: 600, color: '#8B5CF6', marginBottom: 12 }}>Notes Log</div>

                {/* Add note form */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add a note…"
                    style={{ flex: 1, padding: '7px 10px', border: '1px solid #CFD6DD', borderRadius: 6, fontSize: 13, color: '#003366', outline: 'none' }}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || addingNote}
                    style={{ padding: '7px 14px', border: 'none', borderRadius: 6, background: !noteText.trim() || addingNote ? '#E5E7EB' : '#8B5CF6', color: !noteText.trim() || addingNote ? '#9CA3AF' : '#fff', cursor: !noteText.trim() || addingNote ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    {addingNote ? '…' : 'Add'}
                  </button>
                </div>

                {/* Notes list */}
                {(lead.notesLog || []).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No notes yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...(lead.notesLog || [])].reverse().map(n => (
                      <div key={n.id} style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, padding: '9px 12px' }}>
                        <div style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.5 }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                          {n.addedBy} · {new Date(n.addedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={s.footer}>
        {!isTerminal && (
          <button onClick={() => setShowReject(true)} disabled={actioning} style={{ ...s.footerBtn, border: '1px solid #EF4444', color: '#EF4444', background: '#fff' }}>Reject</button>
        )}
        {!isTerminal && (
          <button onClick={() => setShowStartOver(true)} disabled={actioning} style={{ ...s.footerBtn, border: '1px solid #F59E0B', background: '#fff', color: '#D97706' }}>↺ Start Over</button>
        )}

        {lead.status === 'APPROVAL_PENDING' && (
          <button
            onClick={handleApprove}
            disabled={actioning || !canApprove}
            title={!hasCallLog ? 'Add a call log first' : hasPendingFollowUp ? 'Complete the scheduled follow-up first' : ''}
            style={{ ...s.footerBtn, background: actioning || !canApprove ? '#9CA3AF' : '#1874D0', color: '#fff', border: 'none', cursor: !canApprove ? 'not-allowed' : 'pointer' }}
          >
            {actioning ? 'Approving...' : !hasCallLog ? 'Call Log Required' : hasPendingFollowUp ? (followUpIsFuture ? 'Follow-up Pending' : 'Follow-up Overdue') : 'Approve Lead'}
          </button>
        )}
        {lead.status === 'QUALIFIED' && !canConvert && !isMeetLeadActive && (
          <button onClick={handleActivityComplete} disabled={actioning || !activeStep} style={{ ...s.footerBtn, background: actioning || !activeStep ? '#9CA3AF' : '#1874D0', color: '#fff', border: 'none' }}>
            {actioning ? 'Saving...' : 'Activity Complete'}
          </button>
        )}
        {lead.status === 'QUALIFIED' && isMeetLeadActive && !canConvert && (
          <span style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', padding: '8px 4px' }}>
            Awaiting field officer to complete meeting
          </span>
        )}
        {canConvert && (
          <button onClick={() => setShowConvert(true)} style={{ ...s.footerBtn, background: '#10B981', color: '#fff', border: 'none', fontWeight: 700 }}>
            Convert to Loan Application
          </button>
        )}
        {lead.status === 'CONVERTED' && (
          <button disabled style={{ ...s.footerBtn, background: '#10B981', color: '#fff', border: 'none', cursor: 'default' }}>Converted ✓</button>
        )}
        {lead.status === 'REJECTED' && (
          <button disabled style={{ ...s.footerBtn, background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB', cursor: 'default' }}>Rejected</button>
        )}
      </div>

      {showCallLog && (
        <AddCallLogDrawer leadId={id} onClose={() => setShowCallLog(false)} onSaved={() => { setShowCallLog(false); load(); }} />
      )}
      {showConvert && (
        <ConvertModal lead={lead} onConfirm={handleConvert} onClose={() => setShowConvert(false)} converting={converting} />
      )}
      {showReassign && (
        <ReassignModal current={lead.assignedTo} onConfirm={handleReassign} onClose={() => { setShowReassign(false); setReassignError(''); }} saving={reassigning} error={reassignError} />
      )}
      {showReject && (
        <RejectModal onConfirm={handleReject} onClose={() => setShowReject(false)} saving={actioning} />
      )}
      {showStartOver && (
        <StartOverModal onConfirm={handleStartOver} onClose={() => setShowStartOver(false)} saving={startingOver} />
      )}
    </div>
  );
}

const s = {
  page: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' },
  leadHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB' },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: '#1874D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff' },
  toolbar: { display: 'flex', gap: 0, padding: '0 24px', background: '#fff', borderBottom: '1px solid #E5E7EB' },
  toolbarBtn: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  leftPane: { width: 220, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '20px 16px', overflowY: 'auto' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 0 },
  stepRow: { display: 'flex', gap: 10, minHeight: 48 },
  mainPane: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  qualHeader: { marginBottom: 16 },
  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  infoPanel: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB' },
  infoLabel: { fontSize: 13, color: '#6B7280', fontWeight: 500 },
  infoValue: { fontSize: 13, color: '#374151', textAlign: 'right', maxWidth: '60%' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '12px 24px', background: '#fff', borderTop: '1px solid #E5E7EB' },
  footerBtn: { padding: '8px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
};
