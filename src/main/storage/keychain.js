'use strict';
const auditLog = require('../services/audit-log.service.js');

const SERVICE = 'nakora-prototype';
let _keytar = null;

function _kt() {
  if (!_keytar) {
    try { _keytar = require('keytar'); } catch { _keytar = null; }
  }
  return _keytar;
}

async function getKey(name) {
  const kt = _kt();
  if (!kt) return null;
  try {
    const val = await kt.getPassword(SERVICE, name);
    auditLog.log({ action: 'keychain:get', channel: name, success: true });
    return val;
  } catch (err) {
    auditLog.log({ action: 'keychain:get', channel: name, success: false, error: err.message });
    return null;
  }
}

async function setKey(name, value) {
  const kt = _kt();
  if (!kt) return false;
  try {
    await kt.setPassword(SERVICE, name, value);
    auditLog.log({ action: 'keychain:set', channel: name, success: true });
    return true;
  } catch (err) {
    auditLog.log({ action: 'keychain:set', channel: name, success: false, error: err.message });
    return false;
  }
}

async function deleteKey(name) {
  const kt = _kt();
  if (!kt) return false;
  try {
    await kt.deletePassword(SERVICE, name);
    auditLog.log({ action: 'keychain:delete', channel: name, success: true });
    return true;
  } catch (err) {
    auditLog.log({ action: 'keychain:delete', channel: name, success: false, error: err.message });
    return false;
  }
}

async function hasKey(name) {
  const val = await getKey(name);
  return val !== null && val !== '';
}

module.exports = { getKey, setKey, deleteKey, hasKey };
