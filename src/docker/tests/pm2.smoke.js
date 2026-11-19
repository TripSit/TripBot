'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function smokePm2() {
  const home = process.env.PM2_HOME ?? path.join(os.homedir(), '.pm2');
  fs.accessSync(home, fs.constants.W_OK);
  assert.equal(fs.statSync(home).uid, process.getuid());

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tripbot-pm2-'));
  const app = path.join(directory, 'app.js');
  const marker = 'TRIPBOT_PM2_READY';
  fs.writeFileSync(app, `process.stdout.write('${marker}'); setInterval(() => {}, 1000);`);

  const child = spawn('pm2-runtime', [app], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  let ready = false;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`PM2 did not start and stop cleanly: ${output}`));
    }, 15000);
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      if (!ready && output.includes(marker)) {
        ready = true;
        child.kill('SIGINT');
      }
    });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.once('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', code => {
      clearTimeout(timeout);
      try {
        assert.equal(ready, true, output);
        assert.equal(code, 0, output);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
  process.stdout.write('PM2 runtime verified\n');
}

smokePm2().catch(error => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
