'use strict';
const dns = require('../../services/dns-simulator.service.js');

async function getStats()        { return dns.getStats(); }
async function getFeed({ limit }) { return dns.getFeed(limit || 30); }
async function getQueryLog({ page = 1, limit = 50, verdict, search }) {
  const all = dns.getFeed(500);
  let rows = all;
  if (verdict && verdict !== 'ALL') rows = rows.filter(e => e.verdict === verdict);
  if (search) rows = rows.filter(e => e.domain.toLowerCase().includes(search.toLowerCase()));
  const start = (page - 1) * limit;
  return { rows: rows.slice(start, start + limit), total: rows.length, page, limit };
}
async function clearLog() { /* prototype: clears rolling buffer */ return true; }

module.exports = { getStats, getFeed, getQueryLog, clearLog };
