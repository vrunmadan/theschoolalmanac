/**
 * The School Almanac — Review Engine
 * Dependency-free. Implements the gaming-resistant scoring + verification/anti-gaming
 * rules from The-School-Almanac-Crowdsourcing-Spec.md.
 *
 * Pure functions only — safe to run in a Next.js API route, an edge function,
 * or a nightly Supabase job. No I/O, no globals.
 */

'use strict';

/* ------------------------------------------------------------------ *
 * Config — tune here. Documented in the Crowdsourcing Spec §2 & §3.
 * ------------------------------------------------------------------ */
const CONFIG = {
  PARAMS: ['academics', 'teachers', 'facilities', 'safety', 'extracurriculars', 'admin', 'value'],
  M_PRIOR: 8,          // Bayesian prior weight, in "effective reviews" (§2b)
  HALF_LIFE_YEARS: 2,  // recency decay half-life (§2c)
  MIN_N: 5,            // min verified reviews before a public score shows (§2d)
  COUNTING_TIER: 'T2', // only document-verified reviews count (§2a / §3a)
  BURST_WINDOW_HOURS: 48,
  BURST_THRESHOLD: 5,  // >=N same-polarity verified reviews in the window => hold
  FEE_TRIM_IQR: 1.5,   // Tukey fence multiplier for fee outliers (§1e)
};

const DAY_MS = 86400000;
const YEAR_MS = 365.25 * DAY_MS;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Recency weight in [0,1]; a review `ageYears` old is worth 0.5^(age/halflife). */
function recencyWeight(ageYears, halfLife = CONFIG.HALF_LIFE_YEARS) {
  if (ageYears <= 0) return 1;
  return Math.pow(0.5, ageYears / halfLife);
}

function ageYears(dateISO, now = Date.now()) {
  const t = new Date(dateISO).getTime();
  return (now - t) / YEAR_MS;
}

/** A review counts toward the public score only if verified (T2) and published. */
function isCounting(review) {
  return review.verification_tier === CONFIG.COUNTING_TIER &&
         review.status === 'published' &&
         review.excluded !== true; // set by anti-gaming (self-review, dispute-upheld)
}

function median(sorted) {
  if (!sorted.length) return null;
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

function round1(x) { return x == null ? null : Math.round(x * 10) / 10; }

/* ------------------------------------------------------------------ *
 * Scoring (§2)
 * ------------------------------------------------------------------ */

/**
 * Bayesian, recency-weighted score for one parameter.
 * score = (v/(v+m))*R + (m/(v+m))*C
 *   R = recency-weighted mean of this school's counted scores
 *   v = effective (recency-weighted) count
 *   m = prior weight; C = city-cohort prior mean
 */
function bayesianParam(scoresWithWeights, cityPrior, m = CONFIG.M_PRIOR) {
  let wsum = 0, wxsum = 0;
  for (const { score, weight } of scoresWithWeights) {
    wsum += weight;
    wxsum += weight * score;
  }
  if (wsum === 0) return { value: cityPrior, effectiveN: 0 };
  const R = wxsum / wsum;
  const v = wsum;
  const value = (v / (v + m)) * R + (m / (v + m)) * cityPrior;
  return { value, effectiveN: v };
}

/**
 * Compute a school's public scores.
 * @param reviews  array of review objects (any tier/status; we filter internally)
 * @param cityPriors { academics: 4.0, ... } city-cohort means per param
 * @param opts { now }
 * @returns {
 *   status: 'published' | 'building',
 *   nVerified, overall, params:{param:{value,raw,n}}, lastVerifiedAt
 * }
 */
function computeSchoolScores(reviews, cityPriors, opts = {}) {
  const now = opts.now ?? Date.now();
  const counted = reviews.filter(isCounting);
  const nVerified = counted.length;

  const params = {};
  let overallAccum = 0, overallParams = 0;
  let lastVerifiedAt = null;

  for (const p of CONFIG.PARAMS) {
    const rows = [];
    let rawSum = 0, rawN = 0;
    for (const r of counted) {
      const s = r.ratings && r.ratings[p];
      if (typeof s !== 'number') continue;
      const w = recencyWeight(ageYears(r.verified_at || r.created_at, now));
      rows.push({ score: s, weight: w });
      rawSum += s; rawN += 1;
    }
    const prior = cityPriors && typeof cityPriors[p] === 'number' ? cityPriors[p] : 3.0;
    const { value } = bayesianParam(rows, prior);
    params[p] = { value: round1(value), raw: rawN ? round1(rawSum / rawN) : null, n: rawN };
    if (rawN > 0) { overallAccum += value; overallParams += 1; }
  }

  for (const r of counted) {
    const t = new Date(r.verified_at || r.created_at).getTime();
    if (lastVerifiedAt == null || t > lastVerifiedAt) lastVerifiedAt = t;
  }

  const building = nVerified < CONFIG.MIN_N;
  return {
    status: building ? 'building' : 'published',
    nVerified,
    overall: building || overallParams === 0 ? null : round1(overallAccum / overallParams),
    params,
    lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt).toISOString() : null,
  };
}

/* ------------------------------------------------------------------ *
 * Crowd fee aggregation (§1e) — Tukey-fence outlier trim
 * ------------------------------------------------------------------ */

/**
 * @param feeInputs [{ review_id, component, amount_inr, academic_year, tier }]
 * @param component e.g. 'tuition'
 * @param year e.g. '2025-26' (optional; latest if omitted)
 * returns { min, max, median, n, outliers:[amount...] } over trimmed, verified inputs
 */
function aggregateFees(feeInputs, component, year) {
  let rows = feeInputs.filter(f =>
    f.component === component &&
    (f.tier === CONFIG.COUNTING_TIER) &&
    typeof f.amount_inr === 'number' && f.amount_inr > 0 &&
    (!year || f.academic_year === year));
  if (!rows.length) return { min: null, max: null, median: null, n: 0, outliers: [] };

  const vals = rows.map(r => r.amount_inr).sort((a, b) => a - b);
  const q = (p) => {
    const idx = (vals.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return vals[lo] + (vals[hi] - vals[lo]) * (idx - lo);
  };
  const q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
  const lof = q1 - CONFIG.FEE_TRIM_IQR * iqr, hif = q3 + CONFIG.FEE_TRIM_IQR * iqr;
  const kept = vals.filter(v => v >= lof && v <= hif);
  const outliers = vals.filter(v => v < lof || v > hif);
  const base = kept.length ? kept : vals; // never return empty if all flagged
  return {
    min: base[0],
    max: base[base.length - 1],
    median: median(base),
    n: base.length,
    outliers,
  };
}

/* ------------------------------------------------------------------ *
 * Verification + anti-gaming (§2f, §3c)
 * ------------------------------------------------------------------ */

/** Reviews from the school's own email domain or campus IP are self-reviews. */
function isSelfReview(review, school) {
  const email = (review.author_email || '').toLowerCase();
  const domain = email.includes('@') ? email.split('@')[1] : '';
  if (domain && Array.isArray(school.email_domains) &&
      school.email_domains.map(d => d.toLowerCase()).includes(domain)) return true;
  if (review.author_ip && Array.isArray(school.ip_ranges) &&
      school.ip_ranges.includes(review.author_ip)) return true;
  return false;
}

/** One counted review per parent, per school, per academic year (§3c). */
function canSubmit(existingReviews, { parent_ref, school_id, academic_year }) {
  const dup = existingReviews.some(r =>
    r.parent_ref === parent_ref &&
    r.school_id === school_id &&
    r.academic_year === academic_year &&
    r.status !== 'removed');
  return { allowed: !dup, reason: dup ? 'duplicate_parent_year' : null };
}

/**
 * Burst detection: >= threshold same-polarity verified reviews for one school
 * within the window => return their ids to auto-hold for manual review.
 * polarity: recommend 'yes' (positive) vs 'no' (negative).
 */
function detectBurst(reviews, opts = {}) {
  const windowMs = (opts.windowHours ?? CONFIG.BURST_WINDOW_HOURS) * 3600000;
  const threshold = opts.threshold ?? CONFIG.BURST_THRESHOLD;
  const flagged = new Set();
  const bySchool = {};
  for (const r of reviews) {
    if (r.verification_tier !== CONFIG.COUNTING_TIER) continue;
    (bySchool[r.school_id] ||= []).push(r);
  }
  for (const list of Object.values(bySchool)) {
    for (const polarity of ['yes', 'no']) {
      const times = list.filter(r => r.recommend === polarity)
        .map(r => ({ id: r.id, t: new Date(r.verified_at || r.created_at).getTime() }))
        .sort((a, b) => a.t - b.t);
      let start = 0;
      for (let end = 0; end < times.length; end++) {
        while (times[end].t - times[start].t > windowMs) start++;
        if (end - start + 1 >= threshold) {
          for (let i = start; i <= end; i++) flagged.add(times[i].id);
        }
      }
    }
  }
  return [...flagged];
}

/** Convenience: full moderation pass, returns per-review exclusion decisions. */
function screenReviews(reviews, schoolsById, opts = {}) {
  const burst = new Set(detectBurst(reviews, opts));
  return reviews.map(r => {
    const school = schoolsById[r.school_id] || {};
    const reasons = [];
    if (isSelfReview(r, school)) reasons.push('self_review');
    if (burst.has(r.id)) reasons.push('burst');
    return { id: r.id, exclude: reasons.length > 0, hold: reasons.includes('burst'), reasons };
  });
}

module.exports = {
  CONFIG,
  recencyWeight, ageYears, isCounting, bayesianParam,
  computeSchoolScores, aggregateFees,
  isSelfReview, canSubmit, detectBurst, screenReviews,
};
