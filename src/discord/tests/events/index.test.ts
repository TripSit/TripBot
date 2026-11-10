import path from 'path';

const fixtures = path.join(__dirname, '../fixtures/events');

vi.mock('path', async importOriginal => {
  const original = await importOriginal<typeof import('path')>();
  const join = (...parts: string[]) => (parts.at(-1) === '../events' && parts[0].includes('discord/events') ? `${path.join(__dirname, '../fixtures/events')}` : original.join(...parts));
  return { ...original, default: { ...original, join }, join };
});

describe('registerEvents', () => {
  it('registers once and on listeners for every event module in the folder, skipping other files', async () => {
    const { registerEvents } = await import('../../events/index');
    const client = { once: vi.fn(), on: vi.fn() };
    await registerEvents(client as never);
    expect(fixtures).toContain('fixtures/events');
    expect(client.once).toHaveBeenCalledTimes(1);
    expect(client.once).toHaveBeenCalledWith('clientReady', expect.any(Function));
    expect(client.on).toHaveBeenCalledTimes(1);
    expect(client.on).toHaveBeenCalledWith('messageCreate', expect.any(Function));

    // the listeners call the event's execute (with the client appended for non-once events)
    client.once.mock.calls[0][1]('a');
    client.on.mock.calls[0][1]('b');
    const once = require(path.join(fixtures, 'onceEvent.js')); // eslint-disable-line
    const on = require(path.join(fixtures, 'onEvent.js')); // eslint-disable-line
    expect(once.calls[0]).toEqual(['once', 'a']);
    expect(on.calls[0]).toEqual(['on', 'b', client]);
  });
});
