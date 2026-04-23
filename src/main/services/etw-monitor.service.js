'use strict';
const metrics = require('./system-metrics.service.js');

// Rolling in-memory buffers
const CPU_WINDOW    = 60;  // 60 samples
const MEM_WINDOW    = 30;

const state = {
  cpuHistory:  Array(CPU_WINDOW).fill(0),
  memHistory:  Array(MEM_WINDOW).fill(0),
  cpuNow:      0,
  memNow:      0,
  perCore:     [],
  processes:   [],
  connections: [],
  etwEvents:   [],  // simulated, flagged
};

let _cpuTimer  = null;
let _memTimer  = null;
let _procTimer = null;
let _connTimer = null;

// Simulated ETW event templates
const ETW_TEMPLATES = [
  (d) => `CRYPTO: ${d} → CPU correlation +${Math.floor(Math.random()*30)+10}%`,
  (d) => `NET: Burst DNS queries (${Math.floor(Math.random()*30)+20}/5s) to ${d}`,
  (d) => `PROC: Anomalous TXT record query pattern on ${d}`,
  (d) => `CPU: Spike to ${Math.floor(Math.random()*30)+60}% for ${Math.floor(Math.random()*10)+5}s`,
  (d) => `DNS: Fast-flux NS records detected on ${d}`,
];

// Listen to DNS simulator for correlated ETW events
function attachDnsSimulator(dnsSimulator) {
  dnsSimulator.emitter.on('entries', (entries) => {
    for (const e of entries) {
      if (e.abuseType === 'Cryptojacking' || e.abuseType === 'Malware C2' || e.abuseType === 'DGA') {
        const template = ETW_TEMPLATES[Math.floor(Math.random() * ETW_TEMPLATES.length)];
        const evt = { time: new Date().toISOString(), message: template(e.domain), simulated: true };
        state.etwEvents.unshift(evt);
        if (state.etwEvents.length > 100) state.etwEvents.pop();
      }
    }
  });
}

function start() {
  // CPU every 1000ms
  _cpuTimer = setInterval(() => {
    const c = metrics.getCpuUsage();
    state.cpuNow   = c.usagePercent;
    state.perCore  = c.perCore;
    state.cpuHistory = [...state.cpuHistory.slice(1), c.usagePercent];
  }, 1000);

  // Memory every 2000ms
  _memTimer = setInterval(() => {
    const m = metrics.getMemoryUsage();
    state.memNow    = m.usedPercent;
    state.memHistory = [...state.memHistory.slice(1), m.usedPercent];
  }, 2000);

  // Processes every 5000ms
  _procTimer = setInterval(async () => {
    try { state.processes = await metrics.getTopProcesses(); } catch {}
  }, 5000);

  // Connections every 3000ms
  _connTimer = setInterval(async () => {
    try { state.connections = await metrics.getActiveConnections(); } catch {}
  }, 3000);
}

function stop() {
  [_cpuTimer, _memTimer, _procTimer, _connTimer].forEach(t => clearInterval(t));
}

function getCpuMetrics()     { return { usagePercent: state.cpuNow, history: state.cpuHistory, perCore: state.perCore }; }
function getMemoryMetrics()  { const m = metrics.getMemoryUsage(); return { ...m, history: state.memHistory }; }
function getProcesses()      { return state.processes; }
function getConnections()    { return state.connections; }
function getEtwEvents(win)   { return state.etwEvents.slice(0, win || 30); }

module.exports = { start, stop, attachDnsSimulator, getCpuMetrics, getMemoryMetrics, getProcesses, getConnections, getEtwEvents };
