import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import path from 'node:path';
import { registerEvents } from '../../events';

const readdir = vi.hoisted(() => vi.fn());
vi.mock('fs/promises', () => ({ default: { readdir } }));

it('registers one-time and recurring events with the expected arguments', async () => {
  const load = createRequire(__filename);
  const files = ['ready.ts', 'error.ts'];
  const paths = files.map(file => load.resolve(path.join(__dirname, '../../events', file)));
  const previousEntries = paths.map(file => load.cache[file]);
  const ready = { name: 'clientReady', once: true, execute: vi.fn() };
  const recurring = { name: 'warning', execute: vi.fn() };
  const client = new EventEmitter();

  try {
    [{ ready }, { recurring }].forEach((event, index) => {
      load.cache[paths[index]] = { exports: event, loaded: true } as NodeModule;
    });
    readdir.mockResolvedValue([...files, 'index.ts', 'README.md']);
    await registerEvents(client as never);

    client.emit('clientReady', 'ready');
    client.emit('clientReady', 'again');
    client.emit('warning', 'first');
    client.emit('warning', 'second');

    expect(ready.execute.mock.calls).toEqual([['ready']]);
    expect(recurring.execute.mock.calls).toEqual([['first', client], ['second', client]]);
  } finally {
    paths.forEach((file, index) => {
      const entry = previousEntries[index];
      if (entry) load.cache[file] = entry;
      else delete load.cache[file];
    });
  }
});
