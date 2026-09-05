// Tests for lib/reviewEngine.js — pure, dependency-free, so plain node:test is
// enough (no framework dependency to add). Run with `npm test`.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../lib/reviewEngine.js');

function makeReview(overrides = {}) {
  return {
    id: overrides.id ?? 'r1',
    school_id: overrides.school_id ?? 's1',
    verification_tier: overrides.verification_tier ?? 'T2',
    status: overrides.status ?? 'published',
    excluded: overrides.excluded ?? false,
    recommend: overrides.recommend ?? 'yes',
    academic_year: overrides.academic_year ?? '2025-26',
    parent_ref: overrides.parent_ref ?? 'p1',
    created_at: overrides.created_at ?? new Date().toISOString(),
    verified_at: overrides.verified_at,
    author_email: overrides.author_email,
    author_ip: overrides.author_ip,
    ratings: overrides.ratings ?? {
      academics: 5, teachers: 5, facilities: 5, safety: 5,
      extracurriculars: 5, admin: 5, value: 5,
    },
  };
}

test('isCounting requires T2 + published + not excluded', () => {
  assert.equal(engine.isCounting(makeReview()), true);
  assert.equal(engine.isCounting(makeReview({ verification_tier: 'T0' })), false);
  assert.equal(engine.isCounting(makeReview({ status: 'pending' })), false);
  assert.equal(engine.isCounting(makeReview({ excluded: true })), false);
});

test('computeSchoolScores stays "building" below MIN_N verified reviews', () => {
  const reviews = [makeReview({ id: 'a' }), makeReview({ id: 'b' })]; // 2 < MIN_N (5)
  const result = engine.computeSchoolScores(reviews, {});
  assert.equal(result.status, 'building');
  assert.equal(result.nVerified, 2);
  assert.equal(result.overall, null);
});

test('computeSchoolScores publishes at >= MIN_N verified reviews and pulls toward the prior below that', () => {
  const reviews = Array.from({ length: 5 }, (_, i) => makeReview({ id: `r${i}` }));
  const cityPriors = Object.fromEntries(engine.CONFIG.PARAMS.map((p) => [p, 3.0]));
  const result = engine.computeSchoolScores(reviews, cityPriors);
  assert.equal(result.status, 'published');
  assert.equal(result.nVerified, 5);
  // 5 unanimous 5-star reviews against an M_PRIOR of 8 pulls the Bayesian value below 5,
  // but above the 3.0 city prior — sanity-check it lands strictly between the two.
  assert.ok(result.overall > 3.0 && result.overall < 5.0, `expected 3.0 < overall < 5.0, got ${result.overall}`);
});

test('unverified (T0) reviews never count toward a published score, even in bulk', () => {
  const reviews = Array.from({ length: 20 }, (_, i) => makeReview({ id: `r${i}`, verification_tier: 'T0', status: 'pending' }));
  const result = engine.computeSchoolScores(reviews, {});
  assert.equal(result.status, 'building');
  assert.equal(result.nVerified, 0);
});

test('canSubmit blocks a duplicate parent/school/year, allows a different year', () => {
  const existing = [makeReview({ parent_ref: 'p1', school_id: 's1', academic_year: '2025-26' })];
  const dup = engine.canSubmit(existing, { parent_ref: 'p1', school_id: 's1', academic_year: '2025-26' });
  assert.equal(dup.allowed, false);
  assert.equal(dup.reason, 'duplicate_parent_year');

  const ok = engine.canSubmit(existing, { parent_ref: 'p1', school_id: 's1', academic_year: '2026-27' });
  assert.equal(ok.allowed, true);
});

test('canSubmit ignores a removed prior review', () => {
  const existing = [makeReview({ parent_ref: 'p1', school_id: 's1', academic_year: '2025-26', status: 'removed' })];
  const ok = engine.canSubmit(existing, { parent_ref: 'p1', school_id: 's1', academic_year: '2025-26' });
  assert.equal(ok.allowed, true);
});

test('isSelfReview flags a reviewer on the school\'s own email domain', () => {
  const school = { email_domains: ['school.example.edu'] };
  assert.equal(engine.isSelfReview({ author_email: 'teacher@school.example.edu' }, school), true);
  assert.equal(engine.isSelfReview({ author_email: 'parent@gmail.com' }, school), false);
});

test('detectBurst flags >= threshold same-polarity verified reviews within the window', () => {
  const now = Date.now();
  const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
    id: `r${i}`, school_id: 's1', recommend: 'yes',
    created_at: new Date(now + i * 1000).toISOString(),
  }));
  const flagged = engine.detectBurst(reviews, { windowHours: 48, threshold: 5 });
  assert.equal(flagged.length, 6);
});

test('detectBurst does not flag reviews spread outside the window', () => {
  const now = Date.now();
  const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
    id: `r${i}`, school_id: 's1', recommend: 'yes',
    created_at: new Date(now + i * 30 * 24 * 3600 * 1000).toISOString(), // 30 days apart
  }));
  const flagged = engine.detectBurst(reviews, { windowHours: 48, threshold: 5 });
  assert.equal(flagged.length, 0);
});

test('aggregateFees trims Tukey-fence outliers but never returns an empty result if any input exists', () => {
  const feeInputs = [
    { component: 'tuition', amount_inr: 500000, tier: 'T2', academic_year: '2025-26' },
    { component: 'tuition', amount_inr: 520000, tier: 'T2', academic_year: '2025-26' },
    { component: 'tuition', amount_inr: 510000, tier: 'T2', academic_year: '2025-26' },
    { component: 'tuition', amount_inr: 5000000, tier: 'T2', academic_year: '2025-26' }, // outlier
  ];
  const agg = engine.aggregateFees(feeInputs, 'tuition', '2025-26');
  assert.equal(agg.n, 3);
  assert.equal(agg.outliers.includes(5000000), true);
  assert.ok(agg.max < 5000000);
});

test('aggregateFees ignores non-T2 (unverified) fee inputs', () => {
  const feeInputs = [{ component: 'tuition', amount_inr: 500000, tier: 'T0', academic_year: '2025-26' }];
  const agg = engine.aggregateFees(feeInputs, 'tuition', '2025-26');
  assert.equal(agg.n, 0);
  assert.equal(agg.median, null);
});

test('screenReviews excludes self-reviews and burst-flagged reviews', () => {
  const school = { email_domains: ['school.example.edu'] };
  const reviews = [
    makeReview({ id: 'self', author_email: 'staff@school.example.edu' }),
    makeReview({ id: 'clean', author_email: 'parent@gmail.com' }),
  ];
  const result = engine.screenReviews(reviews, { s1: school });
  const bySelf = result.find((r) => r.id === 'self');
  const byClean = result.find((r) => r.id === 'clean');
  assert.equal(bySelf.exclude, true);
  assert.equal(bySelf.reasons.includes('self_review'), true);
  assert.equal(byClean.exclude, false);
});
