'use strict';
const os = require('os');
const { execFile } = require('child_process');

// ─── CPU ──────────────────────────────────────────────────────────────────────
let _prevCpuTimes = null;

function _sampleCpuTimes() {
  return os.cpus().map(c => ({ ...c.times }));
}

function getCpuUsage() {
  const curr = _sampleCpuTimes();
  if (!_prevCpuTimes) { _prevCpuTimes = curr; return { usagePercent: 0, perCore: curr.map(() => 0), model: os.cpus()[0]?.model, cores: curr.length }; }

  const perCore = curr.map((c, i) => {
    const prev = _prevCpuTimes[i];
    const idleDiff  = c.idle - prev.idle;
    const totalDiff = Object.values(c).reduce((s, v) => s + v, 0) - Object.values(prev).reduce((s, v) => s + v, 0);
    return totalDiff === 0 ? 0 : Math.round((1 - idleDiff / totalDiff) * 100);
  });
  _prevCpuTimes = curr;

  const avg = Math.round(perCore.reduce((s, v) => s + v, 0) / perCore.length);
  return { usagePercent: avg, perCore, model: os.cpus()[0]?.model ?? 'Unknown', cores: curr.length };
}

// ─── Memory ───────────────────────────────────────────────────────────────────
function getMemoryUsage() {
  const total = os.totalmem();
  const free  = os.freemem();
  const used  = total - free;
  return {
    totalGb:     +(total / 1e9).toFixed(2),
    freeGb:      +(free  / 1e9).toFixed(2),
    usedGb:      +(used  / 1e9).toFixed(2),
    usedPercent: Math.round((used / total) * 100),
  };
}

// ─── System info (no user identifiers) ───────────────────────────────────────
function getSystemInfo() {
  const hostname = os.hostname();
  // Strip last segment for partial anonymisation
  const partialHost = hostname.split('.').slice(0, -1).join('.') || hostname.slice(0, -2) + '**';
  return {
    platform:    os.platform(),
    release:     os.release(),
    arch:        os.arch(),
    cpuModel:    os.cpus()[0]?.model ?? 'Unknown',
    cpuCores:    os.cpus().length,
    totalMemGb:  +(os.totalmem() / 1e9).toFixed(2),
    hostnamePartial: partialHost,
    uptime:      os.uptime(),
  };
}

// ─── Processes ────────────────────────────────────────────────────────────────
function getTopProcesses() {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      // Fixed argument array — no string interpolation
      execFile('powershell', [
        '-NoProfile', '-NonInteractive', '-Command',
        "Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 Name,@{N='CPU';E={[math]::Round($_.CPU,1)}},@{N='WS_MB';E={[math]::Round($_.WorkingSet/1MB,1)}} | ConvertTo-Json"
      ], { timeout: 4000 }, (err, stdout) => {
        if (err) return resolve([]);
        try {
          const parsed = JSON.parse(stdout);
          resolve(Array.isArray(parsed) ? parsed : [parsed]);
        } catch { resolve([]); }
      });
    } else {
      execFile('ps', ['-eo', 'comm,pcpu,rss', '--sort=-pcpu'], { timeout: 3000 }, (err, stdout) => {
        if (err) return resolve([]);
        const lines = stdout.trim().split('\n').slice(1, 9);
        resolve(lines.map(l => {
          const [name, cpu, rss] = l.trim().split(/\s+/);
          return { Name: name, CPU: parseFloat(cpu) || 0, WS_MB: Math.round((parseInt(rss) || 0) / 1024) };
        }));
      });
    }
  });
}

// ─── Network Connections ─────────────────────────────────────────────────────
function getActiveConnections() {
  return new Promise((resolve) => {
    const cmd = os.platform() === 'win32' ? 'netstat' : 'ss';
    const args = os.platform() === 'win32' ? ['-n'] : ['-nt'];
    execFile(cmd, args, { timeout: 3000 }, (err, stdout) => {
      if (err) return resolve([]);
      const lines = stdout.trim().split('\n').filter(l => l.includes(':') && !l.startsWith('Proto') && !l.startsWith('State'));
      const parsed = lines.slice(0, 15).map(l => {
        const parts = l.trim().split(/\s+/);
        if (os.platform() === 'win32') {
          return { local: parts[1] || '', foreign: parts[2] || '', state: parts[3] || 'ESTABLISHED' };
        }
        return { local: parts[3] || '', foreign: parts[4] || '', state: parts[0] || 'ESTABLISHED' };
      }).filter(c => c.foreign && !c.foreign.includes('*'));
      resolve(parsed.slice(0, 12));
    });
  });
}

module.exports = { getCpuUsage, getMemoryUsage, getSystemInfo, getTopProcesses, getActiveConnections };
