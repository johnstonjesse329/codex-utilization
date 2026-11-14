'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { windows, summary } = require('../src/usage');
test('displays actual returned short and weekly windows', () => {
  const result = { rateLimits: { limitId: 'codex', primary: { usedPercent: 25, windowDurationMins: 300, resetsAt: 100 }, secondary: { usedPercent: 60, windowDurationMins: 10080, resetsAt: 200 } } };
  const items = windows(result);
  assert.equal(summary(items), '5h 75% · 1w 40%');
  assert.equal(items[1].reset, 200);
});
test('prefers multiple buckets and tolerates missing windows', () => {
  const items = windows({ rateLimits: { primary: { usedPercent: 10 } }, rateLimitsByLimitId: { a: { limitId: 'a', primary: null, secondary: { usedPercent: 100, windowDurationMins: 60 } } } });
  assert.equal(summary(items), '1h 0%');
  assert.deepEqual(windows({}), []);
});
