'use strict';
/**
 * domain.validator.js
 * Validates domain strings to RFC 1035 + security constraints.
 */
const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const CIDR_RE   = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
const IP_RE     = /^(\d{1,3}\.){3}\d{1,3}$/;

function validate(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['payload must be an object'] };

  const { domain, reason } = payload;

  if (typeof domain !== 'string') { errors.push('domain must be a string'); return { valid: false, errors }; }
  if (domain.length === 0)        errors.push('domain must not be empty');
  if (domain.length > 253)        errors.push('domain exceeds 253 chars (RFC 1035)');
  if (domain.includes('\0'))      errors.push('domain contains null byte');
  if (domain.includes('/') && !CIDR_RE.test(domain)) errors.push('domain contains path separator');
  if (/^https?:\/\//i.test(domain)) errors.push('domain must not include protocol prefix');

  const isValid =
    DOMAIN_RE.test(domain) ||
    CIDR_RE.test(domain) ||
    IP_RE.test(domain);

  if (!isValid && domain.length > 0 && errors.length === 0) {
    errors.push('domain does not match valid domain/IP/CIDR pattern');
  }

  if (reason !== undefined) {
    if (typeof reason !== 'string') errors.push('reason must be a string');
    if (typeof reason === 'string' && reason.length > 200) errors.push('reason exceeds 200 chars');
  }

  return { valid: errors.length === 0, errors };
}

function validateId(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['payload must be an object'] };
  const { listId } = payload;
  if (typeof listId !== 'string') errors.push('listId must be a string');
  if (typeof listId === 'string' && !/^[a-zA-Z0-9_-]{1,64}$/.test(listId)) errors.push('listId contains invalid characters');
  return { valid: errors.length === 0, errors };
}

module.exports = { validate, validateId };
