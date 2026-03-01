import React, { useState, useEffect } from 'react';
import { c, card } from '../theme';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

// ── Icons ──────────────────────────────────────────────────────────
const DoneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#10B981" />
    <polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ActiveIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#FA8D29" opacity="0.15" />
    <circle cx="12" cy="12" r="11" stroke="#FA8D29" strokeWidth="1.5" />
    <polyline points="12 7 12 12 15 14" stroke="#FA8D29" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PendingIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" stroke="#CFD6DD" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" fill="#CFD6DD" />
  </svg>
);

// ── Step row ───────────────────────────────────────────────────────
function StepRow({ step, onComplete, userRole }) {
  const done    = step.status === 'completed';
  const active  = step.status === 'in_progress';
  const pending = step.status === 'pending';

  const isFieldOfficerStep = step.name === 'Meet Lead';
  const canTap = active && (userRole !== 'FIELD_OFFICER' || isFieldOfficerStep);

  return (
    <div
      onClick={() => canTap && onComplete(step)}
      style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, cursor: canTap ? 'pointer' : 'default', opacity: pending ? 0.5 : 1 }}
    >
      <span style={{ flexShrink: 0 }}>
        {done ? <DoneIcon /> : active ? <ActiveIcon /> : <PendingIcon />}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: done ? c.stepDone : active ? c.stepActive : c.textMuted }}>{step.name}</div>
        {done && (
          <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
            {step.completedAt ? new Date(step.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''} • by {step.completedBy || 'Hub Team'}
          </div>
        )}
        {active && !isFieldOfficerStep && (
          <div style={{ fontSize: 11, color: '#FA8D29', marginTop: 2 }}>Hub team completing this step</div>
        )}
        {active && isFieldOfficerStep && (
          <div style={{ fontSize: 11, color: c.primary, marginTop: 2 }}>Tap to mark as complete</div>
        )}
      </div>
      {canTap && <span style={{ color: c.primary, fontSize: 16 }}>›</span>}
    </div>
  );
}

// ── Convert confirmation panel ─────────────────────────────────────
function ConvertPanel({ lead, onConfirm, onCancel, converting }) {
  return (
    <div style={{ ...card, background: '#F0FDF4', border: '1.5px solid #86EFAC', marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>Convert to Loan Application</div>
      <div style={{ fontSize: 13, color: '#047857', marginBottom: 14 }}>All onboarding steps are complete. Please review and confirm.</div>

      {[
        ['Customer',    lead.name],
        ['Mobile',      lead.mobile],
        ['Lead Type',   lead.leadType],
        ['Loan Amount', lead.loanAmount ? `₹ ${Number(lead.loanAmount).toLocaleString('en-IN')}` : '—'],
        ['Purpose',     lead.loanPurpose || '—'],
      ].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #D1FAE5' }}>
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{k}</span>
          <span style={{ fontSize: 12, color: '#003366', fontWeight: 600 }}>{v}</span>
        </div>
      ))}

      <div style={{ background: '#DCFCE7', borderRadius: 6, padding: '8px 12px', margin: '12px 0', fontSize: 12, color: '#065F46' }}>
        This will create a Loan Application and mark the lead as CONVERTED.
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onConfirm}
          disabled={converting}
          style={{ flex: 1, padding: '12px', borderRadius: 40, background: converting ? '#9CA3AF' : '#10B981', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          {converting ? 'Converting…' : 'Confirm & Convert'}
        </button>
        <button
          onClick={onCancel}
          disabled={converting}
          style={{ flex: 1, padding: '12px', borderRadius: 40, background: '#fff', border: '1px solid #D1D5DB', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Bottom sheet backdrop ──────────────────────────────────────────
function Sheet({ onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      {/* Panel */}
      <div style={{ position: 'relative', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 4, margin: '0 auto 16px' }} />
        {children}
      </div>
    </div>
  );
}

// ── Call Log Sheet ─────────────────────────────────────────────────
const CALL_OUTCOMES = ['Answered', 'No Answer', 'Busy', 'Wrong Number', 'Will Call Back'];

function CallLogSheet({ lead, user, onClose, onSaved }) {
  const [outcome,    setOutcome]    = useState('');
  const [temp,       setTemp]       = useState('');
  const [notes,      setNotes]      = useState('');
  const [followUp,   setFollowUp]   = useState('');
  const [saving,     setSaving]     = useState(false);

  const canSave = outcome.trim();

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await api.createCallLog(lead.id, {
        outcome,
        leadTemperature: temp || undefined,
        notes:           notes.trim() || undefined,
        // Use followUpAt (ISO string) so web's follow-up validation reads it correctly
        followUpAt:      followUp ? `${followUp}T10:00:00.000Z` : undefined,
        calledBy:        user?.name || 'Field Officer',
        calledAt:        new Date().toISOString(),
      });
      onSaved();
      onClose();
    } catch (_) {
      alert('Failed to save call log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 700, color: c.navy, marginBottom: 16 }}>📞 Log Call</div>

      <label style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: 6 }}>Call Outcome *</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {CALL_OUTCOMES.map(o => (
          <button
            key={o}
            onClick={() => setOutcome(o)}
            style={{ padding: '7px 14px', borderRadius: 40, border: `1.5px solid ${outcome === o ? c.primary : c.border}`, background: outcome === o ? c.primary : '#fff', color: outcome === o ? '#fff' : c.textSecondary, fontSize: 13, fontWeight: outcome === o ? 600 : 400, cursor: 'pointer' }}
          >
            {o}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: 6 }}>Lead Temperature</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['Hot', 'Warm', 'Cold'].map(t => {
          const colors = { Hot: '#EF4444', Warm: '#FA8D29', Cold: '#6B7280' };
          const active = temp === t;
          return (
            <button
              key={t}
              onClick={() => setTemp(active ? '' : t)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 40, border: `1.5px solid ${active ? colors[t] : c.border}`, background: active ? colors[t] : '#fff', color: active ? '#fff' : c.textSecondary, fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer' }}
            >
              {t === 'Hot' ? '🔥' : t === 'Warm' ? '🌤' : '❄'} {t}
            </button>
          );
        })}
      </div>

      <label style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: 6 }}>Notes</label>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="What was discussed…"
        rows={3}
        style={{ width: '100%', padding: '12px', border: `1.5px solid ${c.border}`, borderRadius: 12, fontSize: 14, color: c.navy, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', marginBottom: 16 }}
      />

      <label style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: 6 }}>Follow-up Date</label>
      <input
        type="date"
        value={followUp}
        onChange={e => setFollowUp(e.target.value)}
        style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${c.border}`, borderRadius: 12, fontSize: 14, color: c.navy, outline: 'none', boxSizing: 'border-box', marginBottom: 20 }}
      />

      <button
        onClick={save}
        disabled={!canSave || saving}
        style={{ width: '100%', padding: '14px', borderRadius: 40, background: !canSave || saving ? '#CFD6DD' : c.primary, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: !canSave || saving ? 'not-allowed' : 'pointer' }}
      >
        {saving ? 'Saving…' : 'Save Call Log'}
      </button>
    </Sheet>
  );
}

// ── Visit Log Sheet ────────────────────────────────────────────────
const VISIT_OUTCOMES = ['Met Lead', 'Not Available', 'Rescheduled', 'Completed Visit'];

function VisitLogSheet({ lead, user, onClose, onSaved }) {
  const [outcome,  setOutcome]  = useState('');
  const [location, setLocation] = useState('');
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const canSave = outcome.trim();

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await api.addVisitLog(lead.id, {
        outcome,
        location:  location.trim() || undefined,
        notes:     notes.trim() || undefined,
        visitedBy: user?.name || 'Field Officer',
        visitedAt: new Date().toISOString(),
      });
      onSaved();
      onClose();
    } catch (_) {
      alert('Failed to save visit log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 700, color: c.navy, marginBottom: 16 }}>🏠 Log Visit</div>

      <label style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: 6 }}>Visit Outcome *</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {VISIT_OUTCOMES.map(o => (
          <button
            key={o}
            onClick={() => setOutcome(o)}
            style={{ padding: '7px 14px', borderRadius: 40, border: `1.5px solid ${outcome === o ? '#10B981' : c.border}`, background: outcome === o ? '#10B981' : '#fff', color: outcome === o ? '#fff' : c.textSecondary, fontSize: 13, fontWeight: outcome === o ? 600 : 400, cursor: 'pointer' }}
          >
            {o}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: 6 }}>Location</label>
      <input
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder="Village / address visited…"
        style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${c.border}`, borderRadius: 12, fontSize: 14, color: c.navy, outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}
      />

      <label style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: 6 }}>Notes</label>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="What happened during the visit…"
        rows={3}
        style={{ width: '100%', padding: '12px', border: `1.5px solid ${c.border}`, borderRadius: 12, fontSize: 14, color: c.navy, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', marginBottom: 20 }}
      />

      <button
        onClick={save}
        disabled={!canSave || saving}
        style={{ width: '100%', padding: '14px', borderRadius: 40, background: !canSave || saving ? '#CFD6DD' : '#10B981', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: !canSave || saving ? 'not-allowed' : 'pointer' }}
      >
        {saving ? 'Saving…' : 'Save Visit Log'}
      </button>
    </Sheet>
  );
}

// ── Activity Log panel ─────────────────────────────────────────────
function ActivityLog({ lead }) {
  const logs = [
    ...(lead.callLogs  || []).map(l => ({ ts: l.calledAt  || l.createdAt, icon: '📞', text: `Call: ${l.outcome}${l.leadTemperature ? ` · ${l.leadTemperature}` : ''}`, sub: l.notes, by: l.calledBy })),
    ...(lead.visitLogs || []).map(l => ({ ts: l.visitedAt || l.createdAt, icon: '🏠', text: `Visit: ${l.outcome}${l.location ? ` · ${l.location}` : ''}`, sub: l.notes, by: l.visitedBy })),
    ...(lead.notesLog  || []).map(l => ({ ts: l.createdAt, icon: '📝', text: l.text, sub: null, by: l.addedBy })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

  if (logs.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: c.navy, marginBottom: 10 }}>Activity Log</div>
      {logs.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{l.icon}</div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '8px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.navy }}>{l.text}</div>
            {l.sub && <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>{l.sub}</div>}
            <div style={{ fontSize: 10, color: c.textMuted, marginTop: 4 }}>
              {l.by || 'Field Officer'} · {l.ts ? new Date(l.ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
export default function OnboardingJourneyScreen({ navigate, lead: initialLead, user }) {
  const [lead, setLead]               = useState(initialLead);
  const [loading, setLoading]         = useState(true);
  const [showConvert, setShowConvert] = useState(false);
  const [converting, setConverting]   = useState(false);
  const [confirmStep, setConfirmStep] = useState(null);
  const [showCallLog, setShowCallLog] = useState(false);
  const [showVisitLog, setShowVisitLog] = useState(false);
  const userRole = user?.role || 'FIELD_OFFICER';

  const refreshLead = () =>
    api.getLead(lead.id).then(setLead).catch(() => {});

  useEffect(() => {
    api.getLead(initialLead.id)
      .then(setLead)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialLead.id]);

  const handleComplete = (step) => setConfirmStep(step);

  const doComplete = async () => {
    const step = confirmStep;
    setConfirmStep(null);
    try {
      await api.updateStep(lead.id, step.id, { status: 'completed', completedAt: new Date().toISOString(), completedBy: user?.name || 'Field Officer' });
      const updated = await api.getLead(lead.id);
      setLead(updated);
    } catch (_) { alert('Failed — is the API running?'); }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      await api.updateLead(lead.id, { status: 'CONVERTED', convertedAt: new Date().toISOString() });
      const updated = await api.getLead(lead.id);
      setLead(updated);
      setShowConvert(false);
    } catch (_) { alert('Failed to convert lead. Please try again.'); }
    finally { setConverting(false); }
  };

  const handleReject = () => navigate('rejection', lead);

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg }}>
      <div style={{ fontSize: 14, color: c.textMuted }}>Loading…</div>
    </div>
  );

  const allStepsDone = (lead.steps || []).every(s => s.status === 'completed');
  const canConvert   = lead.status === 'QUALIFIED' && allStepsDone;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: c.bg, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 10px' }}>
        <button onClick={() => navigate('leads')} style={{ width: 36, height: 36, borderRadius: 18, background: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 18 }}>←</button>
        <span style={{ fontSize: 18, fontWeight: 700, color: c.navy }}>Lead Onboarding</span>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Lead Info Card */}
        <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.navy }}>{lead.name}</div>
            <div style={{ fontSize: 12, color: c.textSecondary }}>ID: {lead.id}</div>
            {lead.mobile && <div style={{ fontSize: 12, color: c.textMuted }}>{lead.mobile}</div>}
            <StatusBadge status={lead.status} />
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <a href={`tel:${lead.mobile}`} style={{ width: 36, height: 36, borderRadius: 18, background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none' }}>📞</a>
          </div>
        </div>

        {/* Quick action pills: Log Call + Log Visit */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setShowCallLog(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 40, background: '#EBF5FF', border: `1.5px solid ${c.primary}`, color: c.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            📞 Log Call
          </button>
          <button
            onClick={() => setShowVisitLog(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 40, background: '#F0FDF4', border: '1.5px solid #10B981', color: '#059669', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            🏠 Log Visit
          </button>
        </div>

        {/* Steps */}
        <div style={{ fontSize: 15, fontWeight: 700, color: c.navy, margin: '8px 0 10px' }}>Steps</div>
        {(lead.steps || []).map(step => (
          <StepRow key={step.id} step={step} onComplete={handleComplete} userRole={userRole} />
        ))}

        {/* Inline step confirm dialog */}
        {confirmStep && (
          <div style={{ ...card, background: '#EFF6FF', border: '1.5px solid #93C5FD', marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.navy, marginBottom: 10 }}>
              Mark "{confirmStep.name}" as complete?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={doComplete} style={{ flex: 1, padding: '10px', borderRadius: 40, background: c.primary, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Yes, Complete
              </button>
              <button onClick={() => setConfirmStep(null)} style={{ flex: 1, padding: '10px', borderRadius: 40, background: '#fff', border: '1px solid #D1D5DB', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Convert banner */}
        {canConvert && !showConvert && (
          <button
            onClick={() => setShowConvert(true)}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 40, background: '#10B981', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <span>Convert to Loan Application</span>
            <span>→</span>
          </button>
        )}

        {/* Convert confirmation panel */}
        {canConvert && showConvert && (
          <ConvertPanel
            lead={lead}
            onConfirm={handleConvert}
            onCancel={() => setShowConvert(false)}
            converting={converting}
          />
        )}

        {/* Reject Lead button */}
        {lead.status === 'QUALIFIED' && !canConvert && (
          <button onClick={handleReject} style={{ width: '100%', padding: 14, borderRadius: 40, background: '#fff', border: `1.5px solid ${c.rejected}`, color: c.rejected, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
            Reject Lead
          </button>
        )}

        {/* Converted state */}
        {lead.status === 'CONVERTED' && (
          <div style={{ ...card, background: '#D1FAE5', border: '1.5px solid #10B981', textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#065F46' }}>Lead Converted ✅</div>
            <div style={{ fontSize: 12, color: '#065F46', marginTop: 4 }}>Loan Application has been created</div>
          </div>
        )}

        {/* Correction banner — shown when hub team sent lead back for correction */}
        {lead.isCorrection && (
          <div style={{ background: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: 14, padding: '14px 16px', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>Correction Required</span>
            </div>
            <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
              Hub team has sent this lead back for correction.
            </div>
            {lead.correctionNote && (
              <div style={{ marginTop: 8, background: '#FEF3C7', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#92400E', fontStyle: 'italic' }}>
                "{lead.correctionNote}"
              </div>
            )}
            {lead.correctionBy && (
              <div style={{ fontSize: 11, color: '#B45309', marginTop: 6 }}>
                Sent by {lead.correctionBy} · {lead.correctionAt ? new Date(lead.correctionAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            )}
          </div>
        )}

        {/* Approval pending state */}
        {lead.status === 'APPROVAL_PENDING' && !lead.isCorrection && (
          <div style={{ ...card, background: '#FEF6EC', border: '1.5px solid #FA8D29', textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>Awaiting Hub Team Approval</div>
            <div style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>Hub team will review and qualify this lead</div>
          </div>
        )}

        {/* Activity Log */}
        <ActivityLog lead={lead} />

      </div>

      {/* Bottom sheets */}
      {showCallLog && (
        <CallLogSheet
          lead={lead}
          user={user}
          onClose={() => setShowCallLog(false)}
          onSaved={refreshLead}
        />
      )}
      {showVisitLog && (
        <VisitLogSheet
          lead={lead}
          user={user}
          onClose={() => setShowVisitLog(false)}
          onSaved={refreshLead}
        />
      )}

    </div>
  );
}
