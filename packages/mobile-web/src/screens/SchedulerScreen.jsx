import React, { useState, useEffect } from 'react';
import {
  calculateDuration, calculateChainedTravel, frequencyCheck,
  generateSlots, recommendSlot, scoreSlot, explainSlot,
  isSlotOccupied, minsToTime, timeToMins
} from '../lib/schedulerEngine';

// ── Data ────────────────────────────────────────────────────────────────────

const CENTRE_DB = {
  'Tumkur C1': {
    lat: 13.3392, lng: 77.1021, members: 20, attendance: 0.82, collection: 0.91,
    is_new: false, city: 'Tumkur', district: 'Tumakuru', state: 'Karnataka',
    pincode: '572101', staff: 'Vinay', centre_id: '109302', ext_id: '103873',
    activation: '23 Jan 2019', submission: '11 Dec 2022',
    next_meeting: '21 Jan 2024', frequency: 'Every 4 weeks, on Wednesday',
    leader: 'Lakshmi Devi', leader_id: '00920123', rating: 3.5,
  },
  'Tumkur C2 (New)': {
    lat: 13.3500, lng: 77.1100, members: 15, attendance: null, collection: null,
    is_new: true, city: 'Tumkur', district: 'Tumakuru', state: 'Karnataka',
    pincode: '572102', staff: 'Vinay', centre_id: 'NEW-8291', ext_id: 'PENDING',
    activation: 'Pending', submission: '22 Feb 2026',
    next_meeting: 'Unscheduled', frequency: 'Every 4 weeks',
    leader: 'Pending', leader_id: '-', rating: 0.0,
  },
};

const FO_BASE = { lat: 13.3300, lng: 77.0950 };
const DEFAULT_WINDOWS = [['08:00', '13:00'], ['14:00', '19:00']];

const INITIAL_SCHEDULE = [
  { centre: 'Tumkur North C2', lat: 13.3550, lng: 77.1150, start: '09:00', end: '10:20', color: '#C53434' },
  { centre: 'Tumkur South C3', lat: 13.3100, lng: 77.1000, start: '11:30', end: '12:50', color: '#C53434' },
  { centre: 'Tumkur West C1',  lat: 13.3300, lng: 77.0800, start: '15:00', end: '16:20', color: '#F4A246' },
];

const MEET_DATE = new Date(2026, 1, 24);

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  screen:   { height: '100%', display: 'flex', flexDirection: 'column', background: '#F5F6FA', overflow: 'hidden' },
  header:   { background: '#fff', borderBottom: '1px solid #E2E5E8', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  title:    { fontSize: 17, fontWeight: 700, color: '#003366' },
  switchBtn:{ padding: '6px 14px', borderRadius: 20, border: '1px solid #CFD6DD', background: '#fff', color: '#003366', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  scroll:   { flex: 1, overflowY: 'auto', padding: '12px 16px 24px' },
  card:     { background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' },
  accent:   { position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#2196F3' },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#003366', marginBottom: 12 },
  row:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #F5F6F7' },
  rowLabel: { fontSize: 12, fontWeight: 600, color: '#6684A3' },
  rowValue: { fontSize: 12, fontWeight: 600, color: '#003366', textAlign: 'right', maxWidth: '55%' },
  aiRow:    { background: '#E9F4FE', border: '1px solid #D3EAFD', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 12 },
  aiTime:   { fontSize: 22, fontWeight: 800, color: '#2196F3', lineHeight: 1 },
  aiLabel:  { fontSize: 10, fontWeight: 700, color: '#6684A3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  aiBtn:    { background: '#2196F3', color: '#fff', borderRadius: 20, padding: '8px 14px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' },
  statRow:  { display: 'flex', gap: 8, marginBottom: 12 },
  statChip: { flex: 1, background: '#F5F6FA', border: '1px solid #E2E5E8', borderRadius: 10, padding: '8px 10px' },
  statLabel:{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  statVal:  { fontSize: 15, fontWeight: 700, color: '#003366', marginTop: 2 },
  groupItem:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F5F6F7' },
  avatar:   { width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 },
  // Modal
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', flexDirection: 'column' },
  modal:    { background: '#fff', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  mHeader:  { background: '#F8F9FB', borderBottom: '1px solid #E2E5E8', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 },
  mTitle:   { fontSize: 16, fontWeight: 700, color: '#1E293B' },
  mSub:     { fontSize: 11, color: '#6B7280', marginTop: 3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, background: '#E5E7EB', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  mBody:    { padding: 16, flex: 1 },
  recBox:   { background: 'linear-gradient(135deg,#EEF2FF,#EFF6FF)', border: '1px solid #C7D2FE', borderRadius: 16, padding: 18, marginBottom: 16 },
  recTime:  { fontSize: 44, fontWeight: 900, color: '#4338CA', letterSpacing: -2 },
  confirmBtn:{ width: '100%', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 14 },
  slotsGrid:{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 },
  slotBtn:  { padding: '10px 4px', borderRadius: 10, border: '2px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center', color: '#374151' },
  schedList:{ background: '#F8F9FB', borderRadius: 12, padding: 12 },
  schedItem:{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #F0F1F2' },
  insightBox:{ background: '#F8F9FB', borderRadius: 12, padding: 12, marginTop: 12 },
  insightItem:{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 6 },
  savedBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, textAlign: 'center' },
};

// ── Star renderer ────────────────────────────────────────────────────────────

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: '#F4A246', fontSize: 18, letterSpacing: 2 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

function SchedulerModal({ centreName, centreData, onClose, onConfirm }) {
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [recSlot, setRecSlot]   = useState(null);
  const [recScore, setRecScore] = useState(null);
  const [aiBestSlot, setAiBestSlot] = useState(null);
  const [allFeasible, setAllFeasible] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [insights, setInsights]   = useState([]);
  const [chainedTravel, setChainedTravel] = useState({ mins: 0, km: 0 });
  const [freqMsg, setFreqMsg]     = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [isSaved, setIsSaved]     = useState(false);

  const isNew = centreData.is_new;
  const att   = isNew ? 0.78 : centreData.attendance;
  const col   = isNew ? 0.82 : centreData.collection;

  useEffect(() => {
    const travel = calculateChainedTravel(schedule, centreData.lat, centreData.lng, FO_BASE.lat, FO_BASE.lng);
    setChainedTravel(travel);

    const freqRes = frequencyCheck(centreData.frequency, MEET_DATE);
    setFreqMsg(freqRes.message);

    const { duration, allFeasible: all } = recommendSlot(centreData.members, DEFAULT_WINDOWS, att, col, travel.mins, isNew);

    const available = all.filter(f => !isSlotOccupied(f.slot, duration, schedule, centreName).occupied);

    if (available.length > 0) {
      const best = available[0].slot;
      setAiBestSlot(best);
      setRecSlot(best);
      setRecScore(available[0].score);
      setSelectedSlot(best);
      const { breakdown: bd } = scoreSlot(best, att, col, travel.mins / 60, isNew);
      setBreakdown(bd);
      setInsights(explainSlot(best, bd, duration, isNew));
    }
    setAllFeasible(available);
  }, []);

  const duration = calculateDuration(centreData.members);
  const endTime  = selectedSlot ? minsToTime(timeToMins(selectedSlot) + duration) : '—';
  const allSlots = generateSlots();

  const handleConfirm = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      if (selectedSlot) onConfirm(selectedSlot);
    }, 600);
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.mHeader}>
          <div style={{ flex: 1 }}>
            <div style={S.mTitle}>🗓️ Smart Meeting Scheduler</div>
            <div style={S.mSub}>{centreName} · FO: {centreData.staff} · {MEET_DATE.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{freqMsg}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.mBody}>
          {isSaved ? (
            <div style={S.savedBox}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#065F46', marginBottom: 8 }}>Meeting Scheduled!</div>
              <div style={{ fontSize: 14, color: '#065F46' }}>{centreName} booked for {selectedSlot} – {endTime}</div>
              <button style={{ ...S.confirmBtn, background: '#059669', marginTop: 24 }} onClick={onClose}>Return to Overview</button>
            </div>
          ) : (
            <>
              {/* Stats strip */}
              <div style={S.statRow}>
                <div style={S.statChip}><div style={S.statLabel}>Members</div><div style={S.statVal}>{centreData.members}</div></div>
                <div style={S.statChip}><div style={S.statLabel}>Attendance</div><div style={{ ...S.statVal, color: att >= 0.75 ? '#065F46' : '#B91C1C' }}>{Math.floor(att * 100)}%</div></div>
                <div style={S.statChip}><div style={S.statLabel}>Collection</div><div style={{ ...S.statVal, color: col >= 0.80 ? '#065F46' : '#B91C1C' }}>{Math.floor(col * 100)}%</div></div>
                <div style={S.statChip}><div style={S.statLabel}>Travel</div><div style={S.statVal}>{chainedTravel.mins}m</div></div>
              </div>

              {/* AI Recommended slot */}
              {recSlot ? (
                <div style={S.recBox}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>⭐ AI Recommended</div>
                  <div style={{ color: '#64748B', fontSize: 12, marginBottom: 6 }}>{MEET_DATE.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
                  <div style={S.recTime}>{recSlot}</div>
                  <div style={{ fontSize: 14, color: '#6366F1', fontWeight: 600, marginTop: 4 }}>to {minsToTime(timeToMins(recSlot) + duration)} · {duration} min · Score {recScore?.toFixed(2)}</div>

                  {selectedSlot !== aiBestSlot && (
                    <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: 10, marginTop: 10, fontSize: 11, color: '#92400E' }}>
                      ⚠️ You have overridden the AI recommendation. The selected slot may be suboptimal.
                    </div>
                  )}

                  <button style={S.confirmBtn} onClick={handleConfirm} disabled={isSaving}>
                    {isSaving ? '⏳ Saving...' : '✅ Confirm This Slot'}
                  </button>

                  {/* Insights toggle */}
                  {insights.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowInsights(!showInsights)}
                        style={{ width: '100%', background: 'none', border: 'none', color: '#4338CA', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 10, textAlign: 'left', padding: '4px 0' }}
                      >
                        {showInsights ? '▲' : '▼'} Why did AI pick this time?
                      </button>
                      {showInsights && (
                        <div style={S.insightBox}>
                          {insights.map((ins, i) => <div key={i} style={S.insightItem}>{ins}</div>)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚫</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#991B1B' }}>No Feasible Slots</div>
                  <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>Schedule is full or no slots fit within availability windows.</div>
                </div>
              )}

              {/* Slot grid */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Select a Time Slot</div>
              <div style={S.slotsGrid}>
                {allSlots.map(slot => {
                  const occ    = isSlotOccupied(slot, duration, schedule, centreName);
                  const isAI   = slot === aiBestSlot;
                  const isSel  = slot === selectedSlot;
                  if (occ.occupied) {
                    return (
                      <div key={slot} style={{ ...S.slotBtn, background: '#FEF2F2', border: '2px solid #FECACA', color: '#B91C1C', opacity: 0.6, cursor: 'not-allowed', fontSize: 10 }}>
                        {slot}<br /><span style={{ fontSize: 9 }}>{occ.centreName?.split(' ').slice(0,2).join(' ')}</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setRecSlot(slot);
                        const fm = allFeasible.find(f => f.slot === slot);
                        setRecScore(fm ? fm.score : 0);
                        const { breakdown: bd } = scoreSlot(slot, att, col, chainedTravel.mins / 60, isNew);
                        setBreakdown(bd);
                        setInsights(explainSlot(slot, bd, duration, isNew));
                      }}
                      style={{
                        ...S.slotBtn,
                        background: isAI ? '#4F46E5' : isSel ? '#EEF2FF' : '#fff',
                        border: isAI ? '2px solid #4F46E5' : isSel ? '2px solid #6366F1' : '2px solid #E5E7EB',
                        color: isAI ? '#fff' : isSel ? '#4338CA' : '#374151',
                      }}
                    >
                      {isAI ? '⭐' : isSel ? '✓' : ''} {slot}
                    </button>
                  );
                })}
              </div>

              {/* Today's schedule */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Today's Schedule</div>
              <div style={S.schedList}>
                {schedule.map((s, i) => (
                  <div key={i} style={{ ...S.schedItem, borderBottom: i < schedule.length - 1 ? '1px solid #F0F1F2' : 'none', marginBottom: i < schedule.length - 1 ? 10 : 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{s.start} – {s.end}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{s.centre}</div>
                    </div>
                  </div>
                ))}
                {selectedSlot && !isSaved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#EEF2FF', borderRadius: 8, marginTop: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: '#6366F1', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4338CA' }}>{selectedSlot} – {endTime}</div>
                      <div style={{ fontSize: 11, color: '#6366F1' }}>{centreName} (proposed)</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SchedulerScreen() {
  const [centreName, setCentreName] = useState('Tumkur C1');
  const [meetingTime, setMeetingTime] = useState('10:00 AM');
  const [modalOpen, setModalOpen]   = useState(false);

  const c = CENTRE_DB[centreName];

  const switchCentre = () => {
    if (centreName === 'Tumkur C1') { setCentreName('Tumkur C2 (New)'); setMeetingTime('Unscheduled'); }
    else { setCentreName('Tumkur C1'); setMeetingTime('10:00 AM'); }
  };

  const handleConfirm = (slot) => {
    const [hStr, mStr] = slot.split(':');
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    setMeetingTime(`${h12}:${mStr} ${ampm}`);
    setModalOpen(false);
  };

  const GROUPS = [
    { initials: 'T1', name: 'Tumkur C1G1', id: '000032489260', bg: '#E2E5E8', color: '#003366' },
    { initials: 'RD', name: 'Radhika Devi', id: '000032489261', bg: '#D1ECCC', color: '#1A9F00' },
    { initials: 'T2', name: 'Tumkur C1G2', id: '000032489262', bg: '#D3EAFD', color: '#2196F3' },
    { initials: 'T3', name: 'Tumkur C1G3', id: '000032489263', bg: '#FDECDA', color: '#F4A246' },
  ];

  return (
    <div style={S.screen}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>Centre Profile</div>
        <button style={S.switchBtn} onClick={switchCentre}>
          {centreName === 'Tumkur C1' ? 'Switch → New' : '← Tumkur C1'}
        </button>
      </div>

      <div style={S.scroll}>

        {/* Overview card */}
        <div style={S.card}>
          <div style={S.accent} />
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>🏘️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#003366' }}>{centreName}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F5E5', border: '1px solid #D1ECCC', color: '#1A9F00', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginTop: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#1A9F00' }} /> ACTIVE
            </div>
          </div>
          {[
            ['Staff Assigned', c.staff, true],
            ['Center ID', c.centre_id],
            ['External ID', c.ext_id],
            ['Activation', c.activation],
            ['Submission', c.submission],
            ['City', c.city],
            ['District', c.district],
            ['State', c.state],
            ['Pincode', c.pincode],
          ].map(([label, val, highlight], i) => (
            <div key={i} style={{ ...S.row, borderBottom: i < 8 ? '1px solid #F5F6F7' : 'none', marginBottom: i < 8 ? 10 : 0 }}>
              <span style={S.rowLabel}>{label}</span>
              <span style={{ ...S.rowValue, color: highlight ? '#2196F3' : '#003366' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Meeting details */}
        <div style={S.card}>
          <div style={S.accent} />
          <div style={S.sectionTitle}>Meeting Details</div>
          <div style={{ ...S.row }}>
            <span style={S.rowLabel}>Next Meeting Date</span>
            <span style={S.rowValue}>{c.next_meeting}</span>
          </div>
          <div style={{ ...S.row, borderBottom: 'none', marginBottom: 0 }}>
            <span style={S.rowLabel}>Frequency</span>
            <span style={{ ...S.rowValue, maxWidth: '60%' }}>{c.frequency}</span>
          </div>
        </div>

        {/* AI Slot button */}
        <div style={S.aiRow} onClick={() => setModalOpen(true)}>
          <div>
            <div style={S.aiLabel}>📅 Meeting Time</div>
            <div style={S.aiTime}>{meetingTime}</div>
          </div>
          <button style={S.aiBtn}>Get AI Slot →</button>
        </div>

        {/* Performance */}
        <div style={S.card}>
          <div style={S.accent} />
          <div style={S.sectionTitle}>Centre Leader</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: '#D3EAFD', color: '#2196F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>LD</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#003366' }}>{c.leader}</div>
              <div style={{ fontSize: 12, color: '#6684A3' }}>ID: {c.leader_id}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #F5F6F7', paddingTop: 14, marginTop: 4 }}>
            <div style={S.sectionTitle}>Performance</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#003366' }}>{c.rating.toFixed(1)}</span>
              <Stars rating={c.rating} />
            </div>
            <div style={S.row}><span style={S.rowLabel}>Attendance Rate</span><span style={{ ...S.rowValue, color: '#1A9F00' }}>{c.attendance ? `${Math.round(c.attendance * 100)}%` : 'N/A'}</span></div>
            <div style={S.row}><span style={S.rowLabel}>Collection Rate</span><span style={{ ...S.rowValue, color: '#1A9F00' }}>{c.collection ? `${Math.round(c.collection * 100)}%` : 'N/A'}</span></div>
            <div style={{ ...S.row, borderBottom: 'none', marginBottom: 0 }}><span style={{ ...S.rowLabel, fontWeight: 700, color: '#003366' }}>Total Members</span><span style={{ ...S.rowValue, fontSize: 15, fontWeight: 800 }}>{c.members}</span></div>
          </div>
        </div>

        {/* Groups */}
        <div style={S.card}>
          <div style={S.accent} />
          <div style={S.sectionTitle}>Groups</div>
          {GROUPS.map((g, i) => (
            <div key={i} style={{ ...S.groupItem, borderBottom: i < GROUPS.length - 1 ? '1px solid #F5F6F7' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ ...S.avatar, background: g.bg, color: g.color }}>{g.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#003366' }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: '#6684A3' }}>ID: {g.id}</div>
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#C5CBD1' }}>›</span>
            </div>
          ))}
        </div>

      </div>

      {/* Modal */}
      {modalOpen && (
        <SchedulerModal
          centreName={centreName}
          centreData={c}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
