'use strict';
/**
 * rate-limiter.js — Token bucket per channel
 * Prevents renderer flooding the main process.
 */

const LIMITS = {
  'dns:get-stats':          { max: 10, windowMs: 1000 },
  'dns:get-feed':           { max: 5,  windowMs: 1000 },
  'dns:get-query-log':      { max: 5,  windowMs: 1000 },
  'dns:clear-log':          { max: 1,  windowMs: 5000 },
  'domains:add-whitelist':  { max: 5,  windowMs: 1000 },
  'domains:remove-whitelist': { max: 5, windowMs: 1000 },
  'domains:add-blacklist':  { max: 5,  windowMs: 1000 },
  'domains:remove-blacklist': { max: 5, windowMs: 1000 },
  'domains:get-whitelist':  { max: 10, windowMs: 1000 },
  'domains:get-blacklist':  { max: 10, windowMs: 1000 },
  'domains:get-filter-lists': { max: 5, windowMs: 1000 },
  'domains:toggle-filter-list': { max: 5, windowMs: 1000 },
  'settings:get-settings':  { max: 10, windowMs: 1000 },
  'settings:save-settings': { max: 2,  windowMs: 1000 },
  'settings:test-connection': { max: 2, windowMs: 5000 },
  'settings:reset-to-defaults': { max: 1, windowMs: 10000 },
  'settings:set-api-key':   { max: 2,  windowMs: 5000 },
  'settings:get-api-key-status': { max: 5, windowMs: 1000 },
  'export:get-preview':     { max: 3,  windowMs: 5000 },
  'export:generate':        { max: 1,  windowMs: 10000 },
  'etw:get-cpu':            { max: 10, windowMs: 1000 },
  'etw:get-memory':         { max: 10, windowMs: 1000 },
  'etw:get-connections':    { max: 5,  windowMs: 3000 },
  'etw:get-processes':      { max: 3,  windowMs: 5000 },
  'etw:get-events':         { max: 5,  windowMs: 1000 },
  'system:get-info':        { max: 5,  windowMs: 5000 },
  'system:get-session':     { max: 10, windowMs: 1000 },
  'system:get-audit-log':   { max: 3,  windowMs: 5000 },
};

// Per-channel call timestamps
const _buckets = new Map();

function isRateLimited(channel) {
  const limit = LIMITS[channel];
  if (!limit) return false; // unconfigured channels pass through

  const now = Date.now();
  const key = channel;
  const bucket = _buckets.get(key) || [];

  // Remove entries outside window
  const fresh = bucket.filter(t => now - t < limit.windowMs);

  if (fresh.length >= limit.max) {
    _buckets.set(key, fresh);
    return true;
  }

  fresh.push(now);
  _buckets.set(key, fresh);
  return false;
}

module.exports = { isRateLimited };
