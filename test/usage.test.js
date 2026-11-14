'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { windows, summary, resetCountdown, severity } = require('../src/usage');
test('displays actual returned short and weekly windows', () => {
  const result = { rateLimits: { limitId: 'codex', primary: { usedPercent: 25, windowDurationMins: 300, resetsAt: 100 }, secondary: { usedPercent: 60, windowDurationMins: 10080, resetsAt: 200 } } };
  const items = windows(result);
  assert.equal(summary(items, 0), '5-hour 75% left (2m) · weekly 40% left (4m)');
  assert.equal(items[1].reset, 200);
});
test('prefers multiple buckets and tolerates missing windows', () => {
  const items = windows({ rateLimits: { primary: { usedPercent: 10 } }, rateLimitsByLimitId: { a: { limitId: 'a', primary: null, secondary: { usedPercent: 100, windowDurationMins: 60 } } } });
  assert.equal(summary(items), '1h window 0% left');
  assert.deepEqual(windows({}), []);
});
test('color severity follows the lowest remaining window', () => {
  assert.equal(severity([{ used: 20 }]), 'normal');
  assert.equal(severity([{ used: 75 }]), 'warning');
  assert.equal(severity([{ used: 95 }]), 'critical');
  assert.equal(severity([{ used: 20 }, { used: 80 }]), 'warning');
  assert.equal(severity([{ used: 20 }, { used: 95 }]), 'critical');
  assert.equal(severity([]), 'normal');
});
test('formats reset countdowns for at-a-glance display', () => {
  const now = 0;
  assert.equal(resetCountdown(60, now), '1m');
  assert.equal(resetCountdown(60 * 60 + 60, now), '1h 1m');
  assert.equal(resetCountdown(25 * 60 * 60, now), '1d 1h');
  assert.equal(resetCountdown(undefined, now), null);
});
