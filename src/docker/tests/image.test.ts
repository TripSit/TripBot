import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Run against a locally built image; never invoke its application entrypoint or connect to services.
const image = process.env.TRIPBOT_TEST_IMAGE;

describe.skipIf(!image)('production Docker image', () => {
  it('supports the runtime as a non-root user without test dependencies or local secrets', () => {
    const script = `
      const assert = require('node:assert/strict');
      const fs = require('node:fs');
      assert.equal(process.getuid(), 1000);
      for (const name of [
        'argon2', '@napi-rs/canvas', 'discord.js',
        './src/prisma/tripbot/generated', './src/prisma/moodle/generated',
      ]) require(name);
      assert.equal(require('@napi-rs/canvas').createCanvas(1, 1).width, 1);
      for (const file of ['.env', '.git', 'node_modules/vitest', 'node_modules/eslint']) {
        assert.equal(fs.existsSync(file), false, file);
      }
      fs.writeFileSync('build/assets/data/.docker-smoke', 'ok');
      fs.unlinkSync('build/assets/data/.docker-smoke');
      console.log('runtime verified');
    `;
    const output = execFileSync('docker', [
      'run', '--rm', '--network', 'none', '--entrypoint', 'node', image ?? '', '-e', script,
    ], { encoding: 'utf8', timeout: 30_000 });
    expect(output).toContain('runtime verified');
  }, 35_000);
  it('starts and stops PM2 with a writable state directory as the runtime user', () => {
    const script = readFileSync('src/docker/tests/pm2.smoke.js', 'utf8');
    const output = execFileSync('docker', [
      'run', '--rm', '--network', 'none', '--entrypoint', 'node', image ?? '', '-e', script,
    ], { encoding: 'utf8', timeout: 25_000 });
    expect(output).toContain('PM2 runtime verified');
  }, 30_000);
});
