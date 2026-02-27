import React, { useState, useEffect } from 'react';
import { c, card } from '../theme';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

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

function StepRow({ step, onComplete, userRole }) {
  const done   = step.status === 'completed';
  const active = step.status === 'in_progress';
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

// ── Convert confirmation panel ───────────────────────────────────
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
          {converting ? 'Converting...' : 'Confirm & Convert'}
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

export default function OnboardingJourneyScreen({ navigate, lead: initialLead, user }) {
  const [lead, setLead]               = useState(initialLead);
  const [loading, setLoading]         = useState(true);
  const [showConvert, setShowConvert] = useState(false);
  const [converting, setConverting]   = useState(false);
  // Inline confirm state — replaces window.confirm (blocked in Android WebView)
  const [confirmStep, setConfirmStep] = useState(null);
  const userRole = user?.role || 'FIELD_OFFICER';

  // FIX 1: Always fetch fresh lead data on mount — ensures hub approvals are reflected
  useEffect(() => {
    api.getLead(initialLead.id)
      .then(setLead)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialLead.id]);

  const handleComplete = (step) => {
    // FIX 2: Use React state confirm instead of window.confirm (blocked in Capacitor/WebView)
    setConfirmStep(step);
  };

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
      <div style={{ fontSize: 14, color: c.textMuted }}>Loading...</div>
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
            <StatusBadge status={lead.status} />
          </div>
          <a href={`tel:${lead.mobile}`} style={{ width: 36, height: 36, borderRadius: 18, background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none' }}>📞</a>
        </div>

        {/* Steps */}
        <div style={{ fontSize: 15, fontWeight: 700, color: c.navy, margin: '8px 0 10px' }}>Steps</div>
        {(lead.steps || []).map(step => (
          <StepRow key={step.id} step={step} onComplete={handleComplete} userRole={userRole} />
        ))}

        {/* FIX 2: Inline step confirm dialog — replaces window.confirm */}
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

        {/* Convert banner — tap to expand confirmation */}
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

        {/* FIX 3: Single Reject Lead button — removed duplicate condition */}
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

        {lead.status === 'APPROVAL_PENDING' && (
          <div style={{ ...card, background: '#FEF6EC', border: '1.5px solid #FA8D29', textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>Awaiting Hub Team Approval</div>
            <div style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>Hub team will review and qualify this lead</div>
          </div>
        )}
      </div>
    </div>
  );
}
