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

function summary(items, now = Date.now()) {
  return items.map(item => `${windowLabel(item.minutes)} ${remaining(item).toFixed(0)}% left${resetCountdown(item.reset, now) ? ` (${resetCountdown(item.reset, now)})` : ''}`).join(' · ');
}

function windowLabel(minutes) {
  if (minutes === 300) return '5-hour';
  if (minutes === 10080) return 'weekly';
  return `${duration(minutes)} window`;
}

function remaining(item) {
  return Math.max(0, Math.min(100, 100 - item.used));
}

function resetCountdown(reset, now = Date.now()) {
  if (!Number.isFinite(reset)) return null;
  const minutes = Math.max(0, Math.ceil((reset * 1000 - now) / 60000));
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days}d${hours % 24 ? ` ${hours % 24}h` : ''}`;
}

function severity(items, warningAt = 25, criticalAt = 10) {
  if (!items.length) return 'normal';
  const lowest = Math.min(...items.map(remaining));
  if (lowest <= criticalAt) return 'critical';
  if (lowest <= warningAt) return 'warning';
  return 'normal';
}

module.exports = { windows, duration, summary, windowLabel, remaining, resetCountdown, severity };
