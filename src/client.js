'use strict';
const { spawn } = require('node:child_process');
const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');

function executablePath(configured) {
  if (configured !== 'codex' || process.platform !== 'win32' || !process.env.APPDATA) return configured;
  const cache = path.join(process.env.APPDATA, 'Code', 'agent-host', 'sdk-cache', 'codex');
  try {
    const versions = fs.readdirSync(cache, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const version of versions) {
      const candidate = path.join(cache, version, 'win32-x64', 'node_modules', '@openai', 'codex-win32-x64', 'vendor', 'x86_64-pc-windows-msvc', 'bin', 'codex.exe');
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch { /* Fall back to PATH. */ }
  return configured;
}

// A fresh local process per refresh avoids retaining credentials or stale connections.
function readLimits(executable, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let child;
    try { child = spawn(executablePath(executable), ['app-server'], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true }); }
    catch (error) { reject(error); return; }
    let settled = false;
    const timer = setTimeout(() => finish(new Error('Codex app server timed out')), timeoutMs);
    function finish(error, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      if (error) reject(error); else resolve(value);
    }
    function send(message) { child.stdin.write(JSON.stringify(message) + '\n'); }
    child.on('error', error => finish(error));
    child.stdin.on('error', error => finish(error));
    child.on('exit', () => finish(new Error('Codex app server exited before returning usage')));
    readline.createInterface({ input: child.stdout }).on('line', line => {
      let message;
      try { message = JSON.parse(line); } catch { return; }
      if (message.id === 1) {
        if (message.error) return finish(new Error(message.error.message || 'Initialization failed'));
        send({ method: 'initialized' });
        send({ id: 2, method: 'account/rateLimits/read' });
      } else if (message.id === 2) {
        if (message.error) return finish(new Error(message.error.message || 'Usage request failed'));
        finish(null, message.result);
      }
    });
    send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'codex_utilization', title: 'Codex Utilization', version: '0.1.0' } } });
  });
}
module.exports = { readLimits };
