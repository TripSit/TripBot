import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const sourcePath = path.resolve(__dirname, '../../events/error.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

// Run the real module in a separate Node process so its fatal exception cannot terminate Vitest.
// Stub only reporting dependencies: the process event emitter and exit behavior remain real.
const child = `
const environment = process.argv[2];
global.env = { NODE_ENV: environment };
global.f = () => 'fatal-process-test';
global.log = { debug() {}, error() {}, warn() {} };
global.discordClient = { isReady: () => false };
const reporter = { ReportLimiter: class { allow() { return false; } } };
const load = id => {
  if (id.endsWith('/errorReporter')) return reporter;
  if (id.startsWith('.')) return {};
  return require(id);
};
const loaded = { exports: {} };
new Function('require', 'exports', 'module', '__filename', process.argv[1])(
  load, loaded.exports, loaded, 'error.js',
);
setInterval(() => console.log('unsafe continuation'), 25);
setImmediate(() => { throw new Error('fatal-process-test-canary'); });
`;

it.each(['production', 'development'])('exits nonzero after a fatal exception in %s', environment => {
  const result = spawnSync(process.execPath, ['-e', child, compiled, environment], {
    encoding: 'utf8',
    timeout: 3000,
  });
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('fatal-process-test-canary');
  expect(result.stdout).not.toContain('unsafe continuation');
});
