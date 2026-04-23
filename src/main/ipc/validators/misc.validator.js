'use strict';
/** threat.validator.js */
const VERDICT_ENUM = new Set(['BLOCKED','WARNING','CLEAN','ALL']);

function validateThreat(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['payload must be object'] };
  const { page, limit, verdict, search, dateFrom, dateTo } = payload;

  if (page !== undefined   && (!Number.isInteger(page) || page < 1)) errors.push('page must be positive integer');
  if (limit !== undefined  && (!Number.isInteger(limit) || limit < 1 || limit > 200)) errors.push('limit must be 1-200');
  if (verdict !== undefined && !VERDICT_ENUM.has(verdict)) errors.push('verdict must be BLOCKED|WARNING|CLEAN|ALL');
  if (search !== undefined) {
    if (typeof search !== 'string') errors.push('search must be string');
    if (typeof search === 'string' && search.length > 100) errors.push('search max 100 chars');
    if (typeof search === 'string' && /['"`;]/.test(search)) errors.push('search contains disallowed chars');
  }
  if (dateFrom !== undefined && isNaN(Date.parse(dateFrom))) errors.push('dateFrom must be valid ISO date');
  if (dateTo   !== undefined && isNaN(Date.parse(dateTo)))   errors.push('dateTo must be valid ISO date');

  return { valid: errors.length === 0, errors };
}

/** export.validator.js */
function validateExport(payload) {
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['payload must be object'] };
  return { valid: true, errors: [] }; // path chosen via native dialog — no path in payload
}

/** etw.validator.js */
const ETW_METRICS = new Set(['cpu','memory','connections','processes','events']);

function validateEtw(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['payload must be object'] };
  const { windowSeconds, metric } = payload;
  if (windowSeconds !== undefined) {
    if (!Number.isInteger(windowSeconds) || windowSeconds < 1 || windowSeconds > 3600)
      errors.push('windowSeconds must be integer 1-3600');
  }
  if (metric !== undefined && !ETW_METRICS.has(metric)) errors.push('metric must be cpu|memory|connections|processes|events');
  return { valid: errors.length === 0, errors };
}

module.exports = { validateThreat, validateExport, validateEtw };
