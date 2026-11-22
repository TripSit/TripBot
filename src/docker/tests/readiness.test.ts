import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Child environments intentionally omit app configuration; #1544 tracks the ProcessEnv augmentation.
const script = path.resolve('src/docker/wait-for-ready.sh');

function runProbe(failures: number) {
  const dir = mkdtempSync(path.join(tmpdir(), 'tripbot-readiness-test-'));
  try {
    writeFileSync(path.join(dir, 'docker'), [
      '#!/bin/sh',
      'echo "$*" >> "$CHECK_DIR/commands"',
      'for arg in "$@"; do last="$arg"; done',
      "printf '%s' \"$last\" > \"$CHECK_DIR/probe\"",
      'count=0',
      '[ ! -f "$CHECK_DIR/count" ] || read -r count < "$CHECK_DIR/count"',
      'count=$((count + 1))',
      'echo "$count" > "$CHECK_DIR/count"',
      '[ "$count" -gt "$FAILURES" ]',
      '',
    ].join('\n'), { mode: 0o755 });
    writeFileSync(path.join(dir, 'sleep'), '#!/bin/sh\necho "$*" >> "$CHECK_DIR/sleeps"\n', { mode: 0o755 });
    const result = spawnSync('sh', [script], {
      env: {
        PATH: `${dir}:${process.env.PATH}`, CHECK_DIR: dir, FAILURES: String(failures),
      } as unknown as NodeJS.ProcessEnv,
      encoding: 'utf8',
      timeout: 5000,
    });
    return {
      result,
      probe: readFileSync(path.join(dir, 'probe'), 'utf8'),
      count: Number(readFileSync(path.join(dir, 'count'), 'utf8')),
      commands: readFileSync(path.join(dir, 'commands'), 'utf8'),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

it('accepts a ready container without waiting or changing the service', () => {
  const { result, count, commands } = runProbe(0);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(count).toBe(1);
  expect(commands).toContain('compose -f docker-compose.host.yml --project-name tripbot exec -T tripbot node -e');
  expect(commands).toContain("(process.env.API_PORT || '1337') + '/api/health'");
  expect(commands).toContain('AbortSignal.timeout(4000)');
  expect(commands).toContain('process.exit(response.ok ? 0 : 1)');
  expect(commands).not.toMatch(/restart|prune|up tripbot/);
});

it('waits through transient failures', () => {
  const { result, count } = runProbe(2);
  expect(result.status).toBe(0);
  expect(count).toBe(3);
  expect(result.stdout).toContain('Waiting for TripBot readiness (2/30)');
});

it('fails the deployment after bounded retries without exposing raw errors', () => {
  const { result, count } = runProbe(100);
  expect(result.status).toBe(1);
  expect(count).toBe(30);
  expect(result.stderr).toBe('TripBot did not become ready; deployment failed.\n');
});

it('uses valid POSIX shell syntax', () => {
  expect(() => execFileSync('sh', ['-n', script])).not.toThrow();
});

it('gates only the UAT deployment after the container rebuild', () => {
  const pipeline = readFileSync('.drone.yml', 'utf8');
  const [production, uat] = pipeline.split('\n---\n');
  expect(production).not.toContain('sh src/docker/wait-for-ready.sh');
  expect(uat).toContain('--build --no-deps\n      - sh src/docker/wait-for-ready.sh');
  expect(uat).toContain('when:\n      status: [success, failure]');
});

it.each([
  ['ready', true, 0], ['unavailable', true, 1], ['rejected', true, 1], ['ready', false, 1],
] as const)('checks the HTTP result %s with credentials %s', (http, credentials, expected) => {
  const { probe } = runProbe(0);
  const fetch = http === 'rejected'
    ? "global.fetch = async () => { throw new Error('connection failed'); };"
    : `global.fetch = async () => ({ ok: ${http === 'ready'} });`;
  const result = spawnSync(process.execPath, ['-e', fetch + probe], {
    env: (credentials ? { DISCORD_CLIENT_TOKEN: 'synthetic-test-token' } : {}) as unknown as NodeJS.ProcessEnv,
    encoding: 'utf8',
    timeout: 5000,
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(expected);
});

it('probes the configured API port', () => {
  const { probe } = runProbe(0);
  const fetch = "global.fetch = async url => ({ ok: url === 'http://127.0.0.1:1447/api/health' });";
  const result = spawnSync(process.execPath, ['-e', fetch + probe], {
    env: { DISCORD_CLIENT_TOKEN: 'synthetic-test-token', API_PORT: '1447' } as unknown as NodeJS.ProcessEnv,
    encoding: 'utf8',
    timeout: 5000,
  });
  expect(result.status).toBe(0);
});
