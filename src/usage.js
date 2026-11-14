'use strict';

function windows(result) {
  const buckets = result.rateLimitsByLimitId && Object.keys(result.rateLimitsByLimitId).length
    ? Object.values(result.rateLimitsByLimitId) : [result.rateLimits];
  return buckets.filter(Boolean).flatMap(bucket => ['primary', 'secondary'].map(key => {
    const window = bucket[key];
    if (!window || !Number.isFinite(window.usedPercent)) return null;
    return { name: bucket.limitName || bucket.limitId || 'Codex', used: window.usedPercent, minutes: window.windowDurationMins, reset: window.resetsAt };
  }).filter(Boolean));
}

function duration(minutes) {
  if (!Number.isFinite(minutes)) return 'Window';
  if (minutes % 10080 === 0) return `${minutes / 10080}w`;
  if (minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
}

function summary(items) {
  return items.map(item => `${duration(item.minutes)} ${Math.max(0, Math.min(100, 100 - item.used)).toFixed(0)}%`).join(' · ');
}

module.exports = { windows, duration, summary };
