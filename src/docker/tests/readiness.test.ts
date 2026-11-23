import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Child environments intentionally omit app configuration; #1544 tracks the ProcessEnv augmentation.
const script = path.resolve('src/docker/wait-for-ready.sh');
const probe = readFileSync('src/docker/readiness.js', 'utf8');

function runProbe(failures: number, mode = 'starting') {
  const dir = mkdtempSync(path.join(tmpdir(), 'tripbot-readiness-test-'));
  try {
    writeFileSync(path.join(dir, 'docker'), [
      '#!/bin/sh',
      'echo "$*" >> "$CHECK_DIR/commands"',
      'count=0',
      '[ ! -f "$CHECK_DIR/count" ] || read -r count < "$CHECK_DIR/count"',
      'count=$((count + 1))',
      'echo "$count" > "$CHECK_DIR/count"',
      '[ "$MODE" != docker-error ] || exit 1',
      'if [ "$count" -gt "$FAILURES" ]; then echo healthy; else echo "$MODE"; fi',
      '',
    ].join('\n'), { mode: 0o755 });
    writeFileSync(path.join(dir, 'sleep'), '#!/bin/sh\necho "$*" >> "$CHECK_DIR/sleeps"\n', { mode: 0o755 });
    const result = spawnSync('sh', [script], {
      env: {
        PATH: `${dir}:${process.env.PATH}`, CHECK_DIR: dir, FAILURES: String(failures), MODE: mode,
      } as unknown as NodeJS.ProcessEnv,
      encoding: 'utf8',
      timeout: 5000,
    });
    return {
      result,
      count: Number(readFileSync(path.join(dir, 'count'), 'utf8')),
      commands: readFileSync(path.join(dir, 'commands'), 'utf8'),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

it('reads readiness through container inspection without remote command execution', () => {
  const { result, count, commands } = runProbe(0);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(count).toBe(1);
  expect(commands).toContain('inspect --format');
  expect(commands).toContain('.State.Health.Status');
  expect(commands).toContain('.State.Running');
  expect(commands).toContain('.State.Restarting');
  expect(commands).toContain('tripbot');
  expect(commands).not.toMatch(/exec|compose|restart|prune/);
});

it('waits through transient startup failures', () => {
  const { result, count } = runProbe(2);
  expect(result.status).toBe(0);
  expect(count).toBe(3);
  expect(result.stdout).toContain('Waiting for TripBot readiness (2/30)');
});

it.each(['starting', 'unhealthy', 'stopped', 'missing', 'docker-error'])('fails after bounded retries when health is %s', mode => {
  const { result, count } = runProbe(100, mode);
  expect(result.status).toBe(1);
  expect(count).toBe(30);
  expect(result.stderr).toBe('TripBot did not become ready; deployment failed.\n');
});

it('uses valid POSIX shell syntax', () => {
  expect(() => execFileSync('sh', ['-n', script])).not.toThrow();
});

it('gates only UAT after the rebuild and notifies failures', () => {
  const pipeline = readFileSync('.drone.yml', 'utf8');
  const [production, uat] = pipeline.split('\n---\n');
  expect(production).not.toContain('sh src/docker/wait-for-ready.sh');
  expect(uat).toContain('--build --no-deps\n      - sh src/docker/wait-for-ready.sh');
  expect(uat).toContain('when:\n      status: [success, failure]');
});

it('installs the health probe in the runtime image as the application user', () => {
  const dockerfile = readFileSync('src/docker/Dockerfile.tripbot', 'utf8');
  expect(dockerfile).toContain('COPY src/docker/readiness.js ./readiness.js');
  expect(dockerfile).toContain('USER node\nHEALTHCHECK --interval=5s --timeout=5s --start-period=15s --retries=3');
  expect(dockerfile).toContain('CMD ["node", "/workspaces/tripbot/readiness.js"]');
});

it.each([
  ['ready', true, 0], ['unavailable', true, 1], ['rejected', true, 1], ['ready', false, 1],
] as const)('checks the HTTP result %s with credentials %s', (http, credentials, expected) => {
  const fetch = http === 'rejected'
    ? "global.fetch = async () => { throw new Error('connection failed'); };"
    : `global.fetch = async () => ({ ok: ${http === 'ready'} });`;
  const result = spawnSync(process.execPath, ['-e', fetch + probe], {
    env: (credentials ? { DISCORD_CLIENT_TOKEN: 'synthetic-test-token' } : {}) as NodeJS.ProcessEnv,
    encoding: 'utf8',
    timeout: 5000,
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(expected);
});

it('probes the configured API port', () => {
  const fetch = "global.fetch = async url => ({ ok: url === 'http://127.0.0.1:1447/api/health' });";
  const result = spawnSync(process.execPath, ['-e', fetch + probe], {
    env: { DISCORD_CLIENT_TOKEN: 'synthetic-test-token', API_PORT: '1447' } as unknown as NodeJS.ProcessEnv,
    encoding: 'utf8',
    timeout: 5000,
  });
  expect(result.status).toBe(0);
});
