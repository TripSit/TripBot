'use strict';

// Loads and exercises the native modules from inside the built image, because a binary built for another libc or
// architecture installs fine and only fails when it is first required (this is how a musl/glibc mix-up crash-looped UAT).
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

const appRequire = createRequire('/workspaces/tripbot/package.json');

async function main() {
  const { createCanvas } = appRequire('@napi-rs/canvas');
  const canvas = createCanvas(16, 16);
  const context = canvas.getContext('2d');
  context.fillStyle = '#ff00ff';
  context.fillRect(0, 0, 16, 16);
  assert.ok(canvas.toBuffer('image/png').length > 0, 'canvas could not render a PNG');

  const argon2 = appRequire('argon2');
  const hash = await argon2.hash('tripbot-smoke');
  assert.ok(await argon2.verify(hash, 'tripbot-smoke'), 'argon2 could not verify its own hash');

  // The generated Prisma clients live outside node_modules and must be present and loadable
  assert.ok(appRequire('/workspaces/tripbot/src/prisma/tripbot/generated').PrismaClient, 'TripBot Prisma client missing');
  assert.ok(appRequire('/workspaces/tripbot/src/prisma/moodle/generated').PrismaClient, 'Moodle Prisma client missing');

  process.stdout.write('NATIVE_SMOKE_OK\n');
}

main().catch(error => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
