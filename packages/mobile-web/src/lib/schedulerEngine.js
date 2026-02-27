// Ported from schedulerEngine.ts — TypeScript types removed

export const SLOT_SIZE = 30;

export function calculateDuration(totalMembers, baseMin = 10, minPerMember = 3, bufferMin = 10) {
    return baseMin + (totalMembers * minPerMember) + bufferMin;
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371.0;
    const toRad = (v) => (v * Math.PI) / 180;
    const dlat = toRad(lat2 - lat1);
    const dlon = toRad(lon2 - lon1);
    const a = Math.pow(Math.sin(dlat / 2), 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.pow(Math.sin(dlon / 2), 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function calculateChainedTravel(foSchedule, targetLat, targetLng, foBaseLat, foBaseLng) {
    if (!foSchedule || foSchedule.length === 0) {
        const dist = haversineDistance(foBaseLat, foBaseLng, targetLat, targetLng);
        const mins = Math.max(5, Math.floor((dist * 1.4 / 25) * 60));
        return { mins, km: Number((dist * 1.4).toFixed(1)) };
    }
    const sorted = [...foSchedule].sort((a, b) => a.end.localeCompare(b.end));
    const last = sorted[sorted.length - 1];
    const dist = haversineDistance(last.lat, last.lng, targetLat, targetLng);
    const mins = Math.max(5, Math.floor((dist * 1.4 / 25) * 60));
    return { mins, km: Number((dist * 1.4).toFixed(1)) };
}

const DAY_NAMES = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

export function frequencyCheck(frequencyStr, meetingDate) {
    if (!frequencyStr || !meetingDate) return { isValid: true, message: "Frequency not configured" };
    const freqLower = frequencyStr.toLowerCase();
    const dateWeekday = meetingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const formatted = meetingDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    let matchedDay = null;
    for (const day of DAY_NAMES) { if (freqLower.includes(day)) { matchedDay = day; break; } }
    if (!matchedDay) return { isValid: true, message: "Flexible cadence — no specific day constraint" };
    const cap = matchedDay.charAt(0).toUpperCase() + matchedDay.slice(1);
    if (dateWeekday === matchedDay) return { isValid: true, message: `✅ Centre meets on ${cap}s — Today is a ${cap} ✅` };
    return { isValid: false, message: `⚠️ Centre meets on ${cap}s, but ${formatted} is a ${dateWeekday.charAt(0).toUpperCase() + dateWeekday.slice(1)}` };
}

export function timeToMins(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

export function minsToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isSlotOccupied(startStr, durMins, schedule, ignoreCentre) {
    const s = timeToMins(startStr);
    const e = s + durMins;
    for (const b of schedule) {
        if (ignoreCentre && b.centre === ignoreCentre) continue;
        const bs = timeToMins(b.start);
        const be = timeToMins(b.end);
        if (Math.max(s, bs) < Math.min(e, be)) return { occupied: true, centreName: b.centre };
    }
    return { occupied: false, centreName: null };
}

export function generateSlots(start = "09:00", end = "19:30") {
    const slots = [];
    let cur = timeToMins(start);
    const endM = timeToMins(end);
    while (cur < endM) { slots.push(minsToTime(cur)); cur += SLOT_SIZE; }
    return slots;
}

export function slotsNeeded(duration) { return Math.ceil(duration / SLOT_SIZE); }

export function insideWindow(slotStart, nSlots, windows) {
    const s = timeToMins(slotStart);
    const e = s + (nSlots * SLOT_SIZE);
    for (const w of windows) {
        if (s >= timeToMins(w[0]) && e <= timeToMins(w[1])) return true;
    }
    return false;
}

function timeOfDayPreference(slotStart) {
    const [hStr, mStr] = slotStart.split(':');
    const hour = parseInt(hStr, 10) + parseInt(mStr, 10) / 60.0;
    if (hour >= 8.5 && hour <= 11.5) return 1.0 - Math.abs(hour - 10.0) / 3.0;
    else if (hour > 11.5 && hour <= 13.0) return 0.4 - (hour - 11.5) * 0.2;
    else if (hour > 13.0 && hour <= 14.5) return 0.1;
    else if (hour > 14.5 && hour <= 16.0) return 0.3 + (hour - 14.5) * 0.1;
    else return Math.max(0.0, 0.45 - (hour - 16.0) * 0.2);
}

export function scoreSlot(slotStart, attendance, collection, travelHours, isNewCenter = false) {
    const tod = timeOfDayPreference(slotStart);
    const travelPenalty = Math.min(travelHours, 1.0);
    const attContrib = Number((attendance * 0.40).toFixed(4));
    const collContrib = Number((collection * 0.30).toFixed(4));
    const travelContrib = Number((travelPenalty * 0.15).toFixed(4));
    const todContrib = Number((tod * 0.15).toFixed(4));
    const total = Number((attContrib + collContrib - travelContrib + todContrib).toFixed(4));
    return { total, breakdown: { attendance_rate: attendance, collection_rate: collection, travel_hours: travelHours, travel_penalty: travelPenalty, time_of_day_score: Number(tod.toFixed(4)), att_contribution: attContrib, coll_contribution: collContrib, travel_contribution: travelContrib, tod_contribution: todContrib, total } };
}

export function explainSlot(slotStart, breakdown, durationMins, isNewCenter = false) {
    const reasons = [];
    const hour = parseInt(slotStart.split(':')[0], 10);
    const { time_of_day_score: tod, attendance_rate: att, collection_rate: col, travel_hours: tHr } = breakdown;
    if (tod >= 0.8) reasons.push(`🌅 Peak morning window — MFI members show highest attendance before 11:30 AM.`);
    else if (tod >= 0.5) reasons.push(`☀️ Good morning slot — Member availability is above average at ${slotStart}.`);
    else if (hour >= 13 && hour <= 14) reasons.push(`⚠️ Post-lunch window — Attendance dips slightly after lunch.`);
    else reasons.push(`🕐 Afternoon slot — Secondary availability window; earlier slots had conflicts.`);
    if (isNewCenter) reasons.push(`🌱 New Centre — Using conservative ${Math.floor(att * 100)}% baseline attendance.`);
    else if (att >= 0.85) reasons.push(`✅ High attendance — ${Math.floor(att * 100)}% historical attendance.`);
    else if (att >= 0.70) reasons.push(`📊 Average attendance — ${Math.floor(att * 100)}%; peak time maximises turnout.`);
    else reasons.push(`⚠️ Low attendance — ${Math.floor(att * 100)}%; best time slot is critical.`);
    if (col >= 0.90) reasons.push(`💰 Excellent collection — ${Math.floor(col * 100)}% rate boosts this slot's priority.`);
    else if (col >= 0.80) reasons.push(`💳 Good collection — ${Math.floor(col * 100)}% reinforces value of this slot.`);
    const travelMins = Math.round(tHr * 60);
    if (travelMins <= 15) reasons.push(`🚗 Short travel — Only ${travelMins} min from last location.`);
    else if (travelMins <= 30) reasons.push(`🚗 Moderate travel — ${travelMins} min drive factored into score.`);
    else reasons.push(`🚗 Travel noted — ${travelMins} min drive; attendance strength outweighs travel cost.`);
    reasons.push(`⏱️ Duration — ${durationMins} min estimated (${Math.floor(durationMins / 60)}h ${durationMins % 60}m).`);
    return reasons;
}

export function recommendSlot(totalMembers, availabilityWindows, attendance, collection, travelTimeMins, isNewCenter = false) {
    const duration = calculateDuration(totalMembers);
    const needed = slotsNeeded(duration);
    const slots = generateSlots();
    const travelHours = travelTimeMins / 60.0;
    const feasible = [];
    for (const slot of slots) {
        if (insideWindow(slot, needed, availabilityWindows)) {
            const { total } = scoreSlot(slot, attendance, collection, travelHours, isNewCenter);
            feasible.push({ slot, score: total });
        }
    }
    feasible.sort((a, b) => b.score - a.score);
    if (feasible.length > 0) {
        const topSlot = feasible[0].slot;
        const { breakdown: topBreakdown } = scoreSlot(topSlot, attendance, collection, travelHours, isNewCenter);
        return { bestSlot: topSlot, duration, allFeasible: feasible, topBreakdown };
    }
    return { bestSlot: null, duration, allFeasible: [], topBreakdown: null };
}
