// ── Configurable scoring engine ─────────────────────────────────────────────
// No Vercel handler — imported by server.js as a module.

/**
 * Run the scoring engine against a lead using the given prequal config.
 * @param {object} lead - The lead object
 * @param {object} config - The `prequal` config key value (rules + bands)
 * @returns {{ score, band, recommendation, eligibilityPass, rules, checkedAt }}
 */
export function runScoringEngine(lead, config) {
  const rules = config?.rules || [];
  const bands = config?.bands || [];

  let totalWeight = 0;
  let earnedWeight = 0;
  const ruleResults = [];

  for (const rule of rules.filter(r => r.enabled !== false)) {
    totalWeight += (rule.weight || 0);
    const raw = lead[rule.field];
    let pass = false;

    switch (rule.type) {
      case 'required':
        pass = raw !== undefined && raw !== null && raw !== '';
        break;
      case 'range':
        pass = Number(raw) >= rule.min && Number(raw) <= rule.max;
        break;
      case 'regex':
        try { pass = new RegExp(rule.pattern).test(String(raw || '')); } catch { pass = false; }
        break;
      case 'enum':
        pass = Array.isArray(rule.values) && rule.values.includes(raw);
        break;
      default:
        pass = !!raw;
    }

    if (pass) earnedWeight += (rule.weight || 0);
    ruleResults.push({
      rule: rule.label,
      field: rule.field,
      value: (raw !== undefined && raw !== null) ? String(raw) : '—',
      pass,
      required: rule.required || false,
    });
  }

  // Hard block if any required rule fails
  const hardBlock = ruleResults.some(r => r.required && !r.pass);

  // Map earned ratio to score 300–900
  const ratio = totalWeight > 0 ? earnedWeight / totalWeight : 0;
  const score = Math.round(300 + ratio * 600);

  // Find matching band
  const band = bands.find(b => score >= b.minScore && score <= b.maxScore);
  const recommendation = hardBlock ? 'DECLINE' : (band?.recommendation || 'CONDITIONAL');

  return {
    score,
    band: band?.label || 'Unknown',
    recommendation,
    eligibilityPass: !hardBlock && recommendation !== 'DECLINE',
    rules: ruleResults,
    checkedAt: new Date().toISOString(),
  };
}
