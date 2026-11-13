import { EventEmitter } from 'events';
import type { Client } from 'irc-framework';
import type { Mock } from 'vitest';
import type { MappingRow } from '../../global/bridge/bridge.channels';
import { bridgeRows, mappingRow } from '../../vitest/utils/bridgeMappings';

type FakeClient = EventEmitter & {
  connected: boolean;
  user: { nick: string };
  network: { supports: Mock };
  raw: Mock;
};

const BOT = 'TripBotDev';
const JOIN = 'JOIN';
const PART = 'PART';
const SAJOIN = 'SAJOIN';
const UNKNOWN_COMMAND = 'unknown command';
const REGISTRATION_NOTICE = 'Channel #new successfully registered';

let channels: typeof import('../channels');
let mappings: typeof import('../../global/bridge/bridge.mappings');
let client: FakeClient;
let logWarn: Mock;
let logError: Mock;
const originalEnv = {
  IRC_CHANNELS: env.IRC_CHANNELS, IRC_OPER_NAME: env.IRC_OPER_NAME, IRC_OPER_PASSWORD: env.IRC_OPER_PASSWORD,
};

const register = () => client.emit('registered', { nick: BOT });
const joins = () => client.raw.mock.calls.filter(([command]) => command === JOIN).map(([, list]) => list);
const row = (irc: string, overrides: Partial<MappingRow> = {}) => mappingRow({
  discord_channel_id: irc, irc_channel: irc, ...overrides,
});

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  env.IRC_CHANNELS = [];
  env.IRC_OPER_NAME = undefined;
  env.IRC_OPER_PASSWORD = undefined;
  channels = await import('../channels');
  mappings = await import('../../global/bridge/bridge.mappings');
  client = Object.assign(new EventEmitter(), {
    connected: true,
    user: { nick: BOT },
    network: { supports: vi.fn(() => '50') },
    raw: vi.fn(),
  });
  channels.registerIrcChannels(client as unknown as Client);
  logWarn = vi.spyOn(global.log, 'warn').mockReturnValue(undefined as never) as unknown as Mock;
  logError = vi.spyOn(global.log, 'error').mockReturnValue(undefined as never) as unknown as Mock;
  vi.spyOn(global.log, 'info').mockReturnValue(undefined as never);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.assign(env, originalEnv);
});

describe('normalizeTopic', () => {
  it('collapses whitespace and cuts to the default length when none is given', () => {
    expect(channels.normalizeTopic('  hello\n  world  ')).toBe('hello world');
    expect(channels.normalizeTopic('x'.repeat(5000)).length).toBeLessThan(5000);
  });
});

describe('batchChannels', () => {
  it('limits a batch by count and by bytes', () => {
    const many = Array.from({ length: 25 }, (_, i) => `#c${i}`);
    expect(channels.batchChannels(many).map(batch => batch.length)).toEqual([10, 10, 5]);
    const long = Array.from({ length: 5 }, (_, i) => `#${'x'.repeat(150)}${i}`);
    expect(channels.batchChannels(long).map(batch => batch.length)).toEqual([2, 2, 1]);
    expect(channels.batchChannels([])).toEqual([]);
  });
});

describe('joining', () => {
  it('queues new mappings behind pending JOIN batches', async () => {
    const initial = Array.from({ length: 11 }, (_, i) => row(`#room${String(i).padStart(2, '0')}`));
    mappings.setMappings(initial);
    register();
    mappings.setMappings([...initial, row('#new')]);
    expect(joins()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(joins().slice(1)).toEqual(['#room10', '#new']);
  });

  it('does not send a pending batch after losing the connection', async () => {
    mappings.setMappings(Array.from({ length: 11 }, (_, i) => row(`#room${i}`)));
    register();
    client.connected = false;
    await vi.advanceTimersByTimeAsync(1000);
    expect(joins()).toHaveLength(1);
  });

  it('ignores a batch timer that fires after re-registration emptied the queue', async () => {
    mappings.setMappings(Array.from({ length: 11 }, (_, i) => row(`#room${i}`)));
    register();
    mappings.setMappings([]);
    register();
    await vi.advanceTimersByTimeAsync(1000);
    expect(joins()).toHaveLength(1);
  });

  it('cancels a pending JOIN batch on close and starts over on registration', async () => {
    mappings.setMappings(Array.from({ length: 11 }, (_, i) => row(`#room${i}`)));
    register();
    client.emit('close');
    await vi.advanceTimersByTimeAsync(1000);
    expect(joins()).toHaveLength(1);
    register();
    await vi.advanceTimersByTimeAsync(1000);
    expect(joins()).toHaveLength(3);
  });

  it('cancels the OPER timeout when the connection closes', async () => {
    env.IRC_OPER_NAME = 'test-oper';
    env.IRC_OPER_PASSWORD = 'test-password';
    mappings.setMappings([row('#a')]);
    register();
    client.emit('close');
    await vi.advanceTimersByTimeAsync(5000);
    expect(logWarn).not.toHaveBeenCalled();
    expect(joins()).toEqual([]);
  });

  it.each([
    ['part', { nick: BOT }],
    ['kick', { kicked: BOT }],
  ])('forgets a channel after the bot leaves via %s', (event, identity) => {
    mappings.setMappings([row('#a')]);
    register();
    client.emit('join', { nick: BOT, channel: '#a' });
    client.emit(event, { ...identity, channel: '#a' });
    mappings.setMappings([]);
    expect(client.raw).not.toHaveBeenCalledWith(PART, '#a', expect.anything());
  });

  it('retains membership when another user leaves', () => {
    mappings.setMappings([row('#a')]);
    register();
    client.emit('join', { nick: BOT, channel: '#a' });
    client.emit('part', { nick: 'other', channel: '#a' });
    mappings.setMappings([]);
    expect(client.raw).toHaveBeenCalledWith(PART, '#a', expect.any(String));
  });

  it('batches JOINs with a pause between batches', async () => {
    mappings.setMappings(Array.from({ length: 12 }, (_, i) => row(`#c${String(i).padStart(2, '0')}`)));
    register();
    expect(joins()).toHaveLength(1);
    expect(joins()[0].split(',')).toHaveLength(10);

    await vi.advanceTimersByTimeAsync(1000);
    expect(joins()).toHaveLength(2);
    expect(joins()[1].split(',')).toHaveLength(2);
  });

  it('reports the server channel length limit', () => {
    register();
    expect(mappings.getIrcChannelLength()).toBe(50);
  });

  it('joins and parts as the mapping changes, without reconnecting', () => {
    mappings.setMappings([row('#a'), row('#b')]);
    register();
    client.emit('join', { nick: BOT, channel: '#a' });
    client.emit('join', { nick: BOT, channel: '#b' });
    client.raw.mockClear();

    mappings.setMappings([row('#a'), row('#c')]);
    expect(client.raw).toHaveBeenCalledWith(PART, '#b', expect.any(String));
    expect(joins()).toEqual(['#c']);
  });

  it('does not rejoin channels it is already in or has requested', () => {
    mappings.setMappings([row('#a')]);
    register();
    client.raw.mockClear();
    mappings.setMappings([row('#a'), row('#a', { gateway_name: 'renamed' })]);
    expect(client.raw).not.toHaveBeenCalled();
  });

  it('only parts channels it manages', () => {
    mappings.setMappings([row('#a')]);
    register();
    client.emit('join', { nick: BOT, channel: '#manual' });
    client.raw.mockClear();
    mappings.setMappings([row('#a', { gateway_name: 'x' })]);
    mappings.setMappings([row('#a'), row('#z')]);
    expect(client.raw).not.toHaveBeenCalledWith(PART, '#manual', expect.anything());
  });

  it('leaves the IRC_CHANNELS override in charge', () => {
    env.IRC_CHANNELS = ['#only'];
    mappings.setMappings(bridgeRows());
    register();
    expect(joins()).toEqual(['#only']);
  });
});

describe('blocked joins', () => {
  it.each(['invite_only_channel', 'banned_from_channel', 'bad_channel_key'])('tries SAJOIN once on %s', error => {
    mappings.setMappings([row('#a')]);
    register();

    client.emit('irc error', { error, channel: '#a' });
    expect(client.raw).toHaveBeenCalledWith(SAJOIN, BOT, '#a');

    client.raw.mockClear();
    client.emit('irc error', { error, channel: '#a' });
    expect(client.raw).not.toHaveBeenCalledWith(SAJOIN, expect.anything(), expect.anything());
    expect(logError).toHaveBeenCalledWith('channels', expect.stringContaining('even with SAJOIN'));
  });

  it('ignores other join errors', () => {
    client.emit('irc error', { error: 'channel_is_full', channel: '#a' });
    expect(client.raw).not.toHaveBeenCalled();
  });

  it('logs and carries on when privileges are missing', () => {
    mappings.setMappings([row('#a')]);
    register();
    client.emit(UNKNOWN_COMMAND, { command: '723', params: [BOT, 'sajoin', 'Insufficient privileges'] });
    client.emit(UNKNOWN_COMMAND, { command: '403', params: [BOT, '#a', 'No such channel'] });
    expect(logWarn).toHaveBeenCalledTimes(2);
  });

  it('ignores no-such-channel replies unrelated to pending joins', () => {
    register();
    client.emit(UNKNOWN_COMMAND, { command: '403', params: [BOT] });
    expect(logWarn).not.toHaveBeenCalled();
  });
});

describe('creating channels', () => {
  const fresh = () => row('#new', {
    source: 'auto', irc_registered: false, topic: 'A topic',
  });

  it('sets the topic and registers a channel the bot created', () => {
    mappings.setMappings([fresh()]);
    register();
    client.emit('join', { nick: BOT, channel: '#new' });
    client.emit('userlist', { channel: '#new', users: [{ nick: BOT }] });
    expect(client.raw).toHaveBeenCalledWith('TOPIC', '#new', 'A topic');
    expect(client.raw).toHaveBeenCalledWith('CS', 'REGISTER', '#new');
  });

  it('leaves channels that already had people in them alone', () => {
    mappings.setMappings([fresh()]);
    register();
    client.emit('userlist', { channel: '#new', users: [{ nick: BOT }, { nick: 'someone' }] });
    expect(client.raw).not.toHaveBeenCalledWith('CS', 'REGISTER', '#new');
  });

  it('also registers a known channel that turns out not to exist on the network', () => {
    mappings.setMappings([row('#old', { topic: 'Seeded topic' })]);
    register();
    client.emit('userlist', { channel: '#old', users: [{ nick: BOT }] });
    expect(client.raw).toHaveBeenCalledWith('CS', 'REGISTER', '#old');
  });

  it('does nothing for channels that are not in the mapping', () => {
    register();
    client.emit('userlist', { channel: '#unmapped', users: [{ nick: BOT }] });
    expect(client.raw).not.toHaveBeenCalledWith('CS', 'REGISTER', '#unmapped');
  });

  it('records the registration when ChanServ confirms it', () => {
    const rows = [fresh()];
    mappings.setMappings(rows);
    client.emit('notice', { nick: 'ChanServ', message: REGISTRATION_NOTICE });
    expect(global.db.bridge_channels.updateMany).toHaveBeenCalledWith({
      where: { irc_channel: '#new' }, data: { irc_registered: true },
    });
  });

  it('ignores registration notices from other users and for already registered channels', () => {
    mappings.setMappings([fresh(), row('#old', { irc_registered: true })]);
    client.emit('notice', { nick: 'other', message: REGISTRATION_NOTICE });
    client.emit('notice', { nick: 'ChanServ', message: 'Channel #old already registered' });
    expect(db.bridge_channels.updateMany).not.toHaveBeenCalled();
  });

  it('logs a failed attempt to persist channel registration', async () => {
    mappings.setMappings([fresh()]);
    vi.mocked(db.bridge_channels.updateMany).mockRejectedValueOnce(new Error('DB unavailable'));
    client.emit('notice', { nick: 'ChanServ', message: REGISTRATION_NOTICE });
    await vi.advanceTimersByTimeAsync(0);
    expect(logError).toHaveBeenCalledWith('channels', expect.stringContaining('DB unavailable'));
  });
});

describe('topics', () => {
  const join = (channel: string) => client.emit('join', { nick: BOT, channel });

  it('treats a missing IRC topic as empty and uses the fallback topic length', () => {
    client.network.supports.mockReturnValue(undefined);
    mappings.setMappings([row('#a', { topic: 'x'.repeat(310) })]);
    register();
    join('#a');
    client.emit('topic', { channel: '#a' });
    client.emit('userlist', { channel: '#a', users: [{ nick: BOT }] });
    expect(client.raw).toHaveBeenCalledWith('TOPIC', '#a', 'x'.repeat(300));
    client.emit('userlist', { channel: '#a', users: [{ nick: BOT }] });
    expect(client.raw.mock.calls.filter(([command]) => command === 'CS')).toHaveLength(1);
  });

  it('sets the IRC topic to the Discord topic when they differ', () => {
    mappings.setMappings([row('#a', { topic: 'Discord topic' })]);
    register();
    join('#a');
    client.emit('topic', { channel: '#a', topic: 'Old topic' });
    client.emit('userlist', { channel: '#a', users: [{ nick: BOT }, { nick: 'x' }] });
    expect(client.raw).toHaveBeenCalledWith('TOPIC', '#a', 'Discord topic');
  });

  it('leaves a topic that already matches', () => {
    mappings.setMappings([row('#a', { topic: 'Same' })]);
    register();
    join('#a');
    client.emit('topic', { channel: '#a', topic: 'Same' });
    client.emit('userlist', { channel: '#a', users: [{ nick: BOT }, { nick: 'x' }] });
    expect(client.raw).not.toHaveBeenCalledWith('TOPIC', '#a', expect.anything());
  });

  it('flattens multi-line topics and respects the server topic length', () => {
    client.network.supports.mockImplementation((name: string) => (name === 'TOPICLEN' ? '10' : '50'));
    mappings.setMappings([row('#a', { topic: 'line one\n\nline   two is long' })]);
    register();
    join('#a');
    client.emit('userlist', { channel: '#a', users: [{ nick: BOT }, { nick: 'x' }] });
    expect(client.raw).toHaveBeenCalledWith('TOPIC', '#a', 'line one l');
  });

  it('follows Discord topic changes at runtime', () => {
    mappings.setMappings([row('#a', { topic: 'One' })]);
    register();
    join('#a');
    client.emit('userlist', { channel: '#a', users: [{ nick: BOT }, { nick: 'x' }] });
    client.raw.mockClear();

    mappings.setMappings([row('#a', { topic: 'Two' })]);
    expect(client.raw).toHaveBeenCalledWith('TOPIC', '#a', 'Two');
  });

  it('does not touch channels without a Discord topic', () => {
    mappings.setMappings([row('#a')]);
    register();
    join('#a');
    client.emit('userlist', { channel: '#a', users: [{ nick: BOT }, { nick: 'x' }] });
    expect(client.raw).not.toHaveBeenCalledWith('TOPIC', '#a', expect.anything());
  });
});
