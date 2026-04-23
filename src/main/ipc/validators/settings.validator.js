'use strict';
/**
 * settings.validator.js
 * Strict-mode settings payload validator.
 * Unknown keys are rejected. All types enforced.
 */

const BOOL_KEYS = [
  'dnsResolver','phishtank','openphish','virustotal','toastAlerts',
  'dohDetection','etwCryptojack','pqcSigning','mlNet','langIrregularity',
  'homoglyph','dgaDetector','redirectChain','urlHashing','localOnly',
  'telemetry','scanlines','sidebarOpen',
];

const NUM_BOUNDS = {
  dnsLatencyTarget: { min: 10, max: 200 },
  cpuBudget:        { min: 1,  max: 30  },
  dataRetentionDays:{ min: 7,  max: 365 },
};

const STRING_KEYS = ['goEndpoint', 'theme'];
const API_KEY_RE  = /^[a-zA-Z0-9_\-]{1,128}$/;
const URL_RE      = /^https?:\/\/[a-zA-Z0-9._:\-\/]{1,200}$/;

function validate(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['payload must be a plain object'] };
  }

  for (const [key, val] of Object.entries(payload)) {
    if (BOOL_KEYS.includes(key)) {
      if (typeof val !== 'boolean') errors.push(`${key} must be boolean`);
    } else if (key in NUM_BOUNDS) {
      const b = NUM_BOUNDS[key];
      if (typeof val !== 'number' || !Number.isInteger(val)) errors.push(`${key} must be integer`);
      else if (val < b.min || val > b.max) errors.push(`${key} must be between ${b.min} and ${b.max}`);
    } else if (STRING_KEYS.includes(key)) {
      if (typeof val !== 'string') errors.push(`${key} must be a string`);
      if (key === 'goEndpoint' && !URL_RE.test(val)) errors.push('goEndpoint must be a valid http/https URL');
      if (key === 'theme' && !['original','darker','hacker'].includes(val)) errors.push('theme must be original|darker|hacker');
    } else {
      errors.push(`unknown settings key: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateApiKey(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['payload must be an object'] };
  const { name, value } = payload;
  if (!['phishtank','virustotal'].includes(name)) errors.push('name must be phishtank or virustotal');
  if (typeof value !== 'string') errors.push('value must be a string');
  if (typeof value === 'string' && !API_KEY_RE.test(value)) errors.push('value contains disallowed characters');
  return { valid: errors.length === 0, errors };
}

module.exports = { validate, validateApiKey };
