import {
  CandidateChannel, classifyChannel, deriveIrcName, describeChannels, MappingRow, planSeed, planSync,
} from '../../bridge/bridge.channels';
import type { BridgeGatewaySeed } from '../../bridge/bridge.gateways';
import { mappingRow } from '../../../vitest/utils/bridgeMappings';

const OPIATES = '#opiates';
const MATRIX_A = '!a:tripsit.me';
const TV_MOVIES = '#tv-movies';
const CAMP = 'cat-camp';
const DEV = 'cat-dev';
const categories = { [CAMP]: '#', [DEV]: '###dev-' };

function channel(overrides: Partial<CandidateChannel> = {}): CandidateChannel {
  return {
    id: '100', name: '🍕│food', topic: null, parentId: CAMP, isPrivate: false, ...overrides,
  };
}

describe('deriveIrcName', () => {
  it.each([
    ['🍕│food', '#', '#food'],
    ['food', '#', '#food'],
    ['🎮│Video-Games', '#', '#video-games'],
    ['💻│general', '###dev-', '###dev-general'],
    ['✨│café & bar!', '#', '#cafbar'],
    ['snake_case│keep_me', '#', '#keep_me'],
    ['🍕│a--b', '#', '#a-b'],
    ['🍕│-edge-', '#', '#edge'],
  ])('%s -> %s%s', (name, prefix, expected) => {
    expect(deriveIrcName(name, prefix)).toBe(expected);
  });

  it('strips everything up to the first │, including text-only prefixes', () => {
    expect(deriveIrcName('abc│def│ghi', '#')).toBe('#defghi');
  });

  it('returns undefined when nothing usable is left', () => {
    expect(deriveIrcName('🍕│🎉', '#')).toBeUndefined();
    expect(deriveIrcName('│', '#')).toBeUndefined();
    expect(deriveIrcName('日本語', '#')).toBeUndefined();
  });

  it('fits the channel length limit, prefix included', () => {
    expect(deriveIrcName('a'.repeat(100), '#')).toHaveLength(64);
    expect(deriveIrcName('a'.repeat(100), '###dev-', 20)).toBe(`###dev-${'a'.repeat(13)}`);
    expect(deriveIrcName(`${'a'.repeat(10)}-bbbb`, '#', 12)).toBe('#aaaaaaaaaa');
  });

  it('returns undefined when the prefix leaves no room', () => {
    expect(deriveIrcName('food', '###dev-', 7)).toBeUndefined();
  });
});

describe('classifyChannel', () => {
  it('accepts public channels in opted-in categories', () => {
    expect(classifyChannel(channel(), categories)).toBe('ok');
  });

  it('rejects other categories and uncategorized channels', () => {
    expect(classifyChannel(channel({ parentId: 'other' }), categories)).toBe('category');
    expect(classifyChannel(channel({ parentId: null }), categories)).toBe('category');
  });

  it('rejects private channels even in opted-in categories', () => {
    expect(classifyChannel(channel({ isPrivate: true }), categories)).toBe('private');
  });
});

describe('planSync', () => {
  it('creates mappings for eligible, unmapped channels with the category prefix', () => {
    const plan = planSync({
      rows: [],
      channels: [
        channel({ id: '1', name: '🍕│food', topic: 'Eat' }),
        channel({ id: '2', name: '🛠│tripbot', parentId: DEV }),
      ],
      categories,
    });
    expect(plan.create).toEqual([
      expect.objectContaining({
        discord_channel_id: '1', irc_channel: '#food', topic: 'Eat', source: 'auto', irc_registered: false,
      }),
      expect.objectContaining({ discord_channel_id: '2', irc_channel: '###dev-tripbot', gateway_name: 'tripbot' }),
    ]);
    expect(plan.stats.bridged).toBe(2);
  });

  it('counts skipped channels and never auto-bridges private ones', () => {
    const plan = planSync({
      rows: [],
      channels: [
        channel({ id: '1', isPrivate: true }),
        channel({ id: '2', parentId: 'archive' }),
        channel({ id: '3', parentId: null }),
      ],
      categories,
    });
    expect(plan.create).toEqual([]);
    expect(plan.stats).toMatchObject({
      bridged: 0, skippedPrivate: 1, skippedCategory: 2, collisions: 0,
    });
  });

  it('keeps the IRC name when a channel is renamed', () => {
    const rows = [mappingRow({
      discord_channel_id: '1', irc_channel: '#food', source: 'auto', gateway_name: 'food',
    })];
    const plan = planSync({ rows, channels: [channel({ id: '1', name: '🍕│snacks' })], categories });
    expect(plan.create).toEqual([]);
    expect(plan.deactivate).toEqual([]);
    expect(plan.stats.bridged).toBe(1);
  });

  it('skips a name already mapped to another channel instead of guessing', () => {
    const rows = [mappingRow({ discord_channel_id: 'x', irc_channel: '#food' })];
    const plan = planSync({ rows, channels: [channel({ id: '1', name: '🍕│Food' })], categories });
    expect(plan.create).toEqual([]);
    expect(plan.stats.collisions).toBe(1);
    expect(plan.messages.join()).toContain('#food is already mapped');
  });

  it('lets the oldest of two channels deriving the same name win', () => {
    const plan = planSync({
      rows: [],
      channels: [channel({ id: '300', name: '🍕│food' }), channel({ id: '200', name: 'food' })],
      categories,
    });
    expect(plan.create.map(row => row.discord_channel_id)).toEqual(['200']);
    expect(plan.stats.collisions).toBe(1);
  });

  it('skips channels without a usable name', () => {
    const plan = planSync({ rows: [], channels: [channel({ name: '🍕│🎉' })], categories });
    expect(plan.create).toEqual([]);
    expect(plan.stats.unnamed).toBe(1);
  });

  it('uses the IRC channel length limit', () => {
    const plan = planSync({
      rows: [], channels: [channel({ name: 'a'.repeat(80) })], categories, maxLength: 10,
    });
    expect(plan.create[0].irc_channel).toBe('#aaaaaaaaa');
  });

  it('unbridges auto channels that leave the categories, turn private or are deleted', () => {
    const auto = (id: string, irc: string) => mappingRow({ discord_channel_id: id, irc_channel: irc, source: 'auto' });
    const rows = [auto('1', '#moved'), auto('2', '#private'), auto('3', '#deleted'), auto('4', '#stays')];
    const plan = planSync({
      rows,
      channels: [
        channel({ id: '1', parentId: 'archive' }),
        channel({ id: '2', isPrivate: true }),
        channel({ id: '4' }),
      ],
      categories,
    });
    expect(plan.deactivate.map(row => row.irc_channel)).toEqual(['#moved', '#private', '#deleted']);
    expect(plan.stats.bridged).toBe(1);
  });

  it('keeps overrides bridged regardless of category or privacy, unless the channel is gone', () => {
    const rows = [
      mappingRow({ discord_channel_id: '1', irc_channel: '##modhaven' }),
      mappingRow({ discord_channel_id: '2', irc_channel: '##gone' }),
    ];
    const plan = planSync({
      rows,
      channels: [channel({ id: '1', parentId: 'staff', isPrivate: true })],
      categories,
    });
    expect(plan.deactivate.map(row => row.irc_channel)).toEqual(['##gone']);
  });

  it('reactivates a returning auto channel and honours the enabled switch', () => {
    const rows = [
      mappingRow({
        discord_channel_id: '1', irc_channel: '#back', source: 'auto', active: false,
      }),
      mappingRow({
        discord_channel_id: '2', irc_channel: '#off', source: 'auto', active: false, enabled: false,
      }),
    ];
    const plan = planSync({ rows, channels: [channel({ id: '1' }), channel({ id: '2' })], categories });
    expect(plan.activate.map(row => row.irc_channel)).toEqual(['#back']);
    expect(plan.create).toEqual([]);
  });

  it('does not create a second name for a channel that already has an override', () => {
    const rows = [mappingRow({ discord_channel_id: '1', irc_channel: OPIATES })];
    const plan = planSync({ rows, channels: [channel({ id: '1', name: '💊│opioids' })], categories });
    expect(plan.create).toEqual([]);
  });
});

describe('planSync topics', () => {
  it('tracks Discord topic changes and ignores matching or empty ones', () => {
    const rows = [
      mappingRow({ discord_channel_id: '1', irc_channel: '#a' }),
      mappingRow({ discord_channel_id: '2', irc_channel: '#b', topic: 'Old B' }),
      mappingRow({ discord_channel_id: '3', irc_channel: '#c', topic: 'Same' }),
      mappingRow({ discord_channel_id: '4', irc_channel: '#d', topic: 'Kept' }),
    ];
    const plan = planSync({
      rows,
      channels: [
        channel({ id: '1', topic: 'New A' }),
        channel({ id: '2', topic: 'New B' }),
        channel({ id: '3', topic: 'Same' }),
        channel({ id: '4', topic: null }),
      ],
      categories,
    });
    expect(plan.topics).toEqual([
      { irc_channel: '#a', topic: 'New A' },
      { irc_channel: '#b', topic: 'New B' },
    ]);
  });
});

describe('planSeed', () => {
  const seeds: BridgeGatewaySeed[] = [
    {
      name: 'Opioids', discord: 'CHANNEL_A', irc: OPIATES, matrix: MATRIX_A,
    },
    { name: 'Movies', discord: 'CHANNEL_B', irc: '#movies' },
    { name: 'TV-Movies', discord: 'CHANNEL_B', irc: TV_MOVIES },
    { name: 'Dev only', discord: 'CHANNEL_EMPTY', irc: '#nowhere' },
  ];
  const ids: Record<string, string> = { CHANNEL_A: 'a', CHANNEL_B: 'b' };
  const resolve = (key: string) => ids[key];

  it('creates overrides with their exact IRC names and Matrix rooms, skipping unresolved channels', () => {
    const plan = planSeed([], seeds, resolve);
    expect(plan.create).toEqual([
      expect.objectContaining({
        discord_channel_id: 'a',
        irc_channel: OPIATES,
        gateway_name: 'Opioids',
        matrix_room_id: MATRIX_A,
        source: 'override',
        irc_registered: true,
      }),
      expect.objectContaining({ discord_channel_id: 'b', irc_channel: '#movies' }),
      expect.objectContaining({ discord_channel_id: 'b', irc_channel: TV_MOVIES }),
    ]);
  });

  it('is idempotent and leaves existing rows alone', () => {
    const rows: Pick<MappingRow, 'discord_channel_id' | 'irc_channel' | 'matrix_room_id'>[] = [
      { discord_channel_id: 'a', irc_channel: OPIATES, matrix_room_id: MATRIX_A },
      { discord_channel_id: 'b', irc_channel: '#movies', matrix_room_id: null },
      { discord_channel_id: 'b', irc_channel: TV_MOVIES, matrix_room_id: null },
    ];
    const plan = planSeed(rows, seeds, resolve);
    expect(plan).toEqual({ create: [], matrix: [], messages: [] });
  });

  it('fills in a missing Matrix room but never moves an IRC name to another Discord channel', () => {
    const rows = [
      { discord_channel_id: 'a', irc_channel: OPIATES, matrix_room_id: null },
      { discord_channel_id: 'zzz', irc_channel: '#movies', matrix_room_id: null },
    ];
    const plan = planSeed(rows, seeds, resolve);
    expect(plan.matrix).toEqual([{ irc_channel: OPIATES, matrix_room_id: MATRIX_A }]);
    expect(plan.create.map(row => row.irc_channel)).toEqual([TV_MOVIES]);
    expect(plan.messages.join()).toContain('#movies is mapped to another Discord channel');
  });

  it('matches existing IRC names case-insensitively', () => {
    const rows = [{ discord_channel_id: 'a', irc_channel: OPIATES, matrix_room_id: null }];
    const plan = planSeed(rows, [{ name: 'Opioids', discord: 'CHANNEL_A', irc: '#Opiates' }], resolve);
    expect(plan.create).toEqual([]);
  });
});

describe('describeChannels', () => {
  it('describes bridged channels with their IRC and Matrix mapping', () => {
    const rows = [
      mappingRow({ discord_channel_id: '1', irc_channel: OPIATES, matrix_room_id: MATRIX_A }),
      mappingRow({ discord_channel_id: '2', irc_channel: '#gone', active: false }),
    ];
    const lines = describeChannels(rows, [
      channel({ id: '1', name: 'opioids' }),
      channel({ id: '2', name: 'old' }),
      channel({ id: '3', name: 'staff', isPrivate: true }),
      channel({ id: '4', name: 'logs', parentId: 'archive' }),
      channel({ id: '5', name: '🎉' }),
    ], categories);
    expect(lines).toEqual([
      `bridged: opioids (1) <-> IRC ${OPIATES} | Matrix ${MATRIX_A} | override`,
      expect.stringContaining('not bridged: logs (4), category'),
      expect.stringContaining('not bridged: old (2), mapped to #gone but inactive or disabled'),
      expect.stringContaining('not bridged: staff (3), private'),
      expect.stringContaining('not bridged: 🎉 (5), no usable or unique IRC name'),
    ]);
  });

  it('says when a bridged channel has no Matrix room', () => {
    const rows = [mappingRow({ discord_channel_id: '1', irc_channel: '#food' })];
    const [line] = describeChannels(rows, [channel({ id: '1' })], categories);
    expect(line).toContain('| Matrix none |');
  });
});
