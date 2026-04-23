'use strict';
const { ipcMain } = require('electron');
const { isRateLimited } = require('./rate-limiter.js');
const domainV   = require('./validators/domain.validator.js');
const settingsV = require('./validators/settings.validator.js');
const { validateThreat, validateExport, validateEtw } = require('./validators/misc.validator.js');
const auditLog  = require('../services/audit-log.service.js');
const dnsH      = require('./handlers/dns.handler.js');
const domainsH  = require('./handlers/domains.handler.js');
const combinedH = require('./handlers/combined.handler.js');

// Structured response envelope — renderer always gets { success, data, error }
function ok(data)  { return { success: true,  data, error: null }; }
function err(msg)  { return { success: false, data: null, error: msg }; }

// Wrap every handler: rate-limit → validate → invoke → audit
function register(channel, validator, handler) {
  ipcMain.handle(channel, async (_event, payload) => {
    // 1. Rate limit
    if (isRateLimited(channel)) {
      auditLog.log({ action: channel, channel, success: false, error: 'RATE_LIMITED' });
      return err('RATE_LIMITED');
    }
    // 2. Validate
    if (validator) {
      const { valid, errors } = validator(payload || {});
      if (!valid) {
        auditLog.log({ action: channel, channel, success: false, error: errors.join('; ') });
        return err(`VALIDATION_FAILED: ${errors.join('; ')}`);
      }
    }
    // 3. Invoke handler
    try {
      const data = await handler(payload || {});
      auditLog.log({ action: channel, channel, success: true });
      return ok(data);
    } catch (e) {
      const msg = e?.message ?? String(e);
      auditLog.log({ action: channel, channel, success: false, error: msg });
      return err(msg);
    }
  });
}

function registerAll() {
  // ── DNS ───────────────────────────────────────────────────────────────────
  register('dns:get-stats',     null,                      dnsH.getStats);
  register('dns:get-feed',      null,                      dnsH.getFeed);
  register('dns:get-query-log', validateThreat,            dnsH.getQueryLog);
  register('dns:clear-log',     null,                      dnsH.clearLog);

  // ── Domains ───────────────────────────────────────────────────────────────
  register('domains:get-whitelist',    null,                  domainsH.getWhitelist);
  register('domains:get-blacklist',    null,                  domainsH.getBlacklist);
  register('domains:add-whitelist',    domainV.validate,      domainsH.addToWhitelist);
  register('domains:remove-whitelist', domainV.validate,      domainsH.removeFromWhitelist);
  register('domains:add-blacklist',    domainV.validate,      domainsH.addToBlacklist);
  register('domains:remove-blacklist', domainV.validate,      domainsH.removeFromBlacklist);
  register('domains:get-filter-lists', null,                  domainsH.getFilterLists);
  register('domains:toggle-filter-list', domainV.validateId,  domainsH.toggleFilterList);

  // ── Settings ──────────────────────────────────────────────────────────────
  register('settings:get-settings',   null,                      combinedH.getSettings);
  register('settings:save-settings',  (p) => ({ valid: true, errors: [] }), combinedH.saveSettings);
  register('settings:test-connection',null,                      combinedH.testConnection);
  register('settings:reset-to-defaults', null,                   combinedH.resetToDefaults);
  register('settings:set-api-key',    settingsV.validateApiKey,  combinedH.setApiKey);
  register('settings:get-api-key-status', null,                  combinedH.getApiKeyStatus);

  // ── ETW ───────────────────────────────────────────────────────────────────
  register('etw:get-cpu',         validateEtw,  combinedH.getCpuMetrics);
  register('etw:get-memory',      validateEtw,  combinedH.getMemoryMetrics);
  register('etw:get-connections', validateEtw,  combinedH.getActiveConnections);
  register('etw:get-processes',   validateEtw,  combinedH.getTopProcesses);
  register('etw:get-events',      validateEtw,  combinedH.getEtwEvents);

  // ── System ────────────────────────────────────────────────────────────────
  register('system:get-info',       null, combinedH.getSystemInfo);
  register('system:get-version',    null, combinedH.getAppVersion);
  register('system:get-session',    null, combinedH.getSessionInfo);
  register('system:get-audit-log',  null, combinedH.getAuditLog);

  // ── Export ────────────────────────────────────────────────────────────────
  register('export:get-preview',   null,            combinedH.getExportPreview);
  register('export:generate',      validateExport,  combinedH.generateExport);
}

module.exports = { registerAll };
