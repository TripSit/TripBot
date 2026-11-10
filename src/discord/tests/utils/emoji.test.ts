import { ButtonStyle } from 'discord.js';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;
const FALLBACK = { name: 'ts_heart', id: '978649029200216085' };

async function load() {
  vi.resetModules();
  return import('../../utils/emoji');
}

const guildWith = (names: string[]) => ({
  emojis: {
    fetch: vi.fn(),
    cache: collectionOf(names.map(name => [name, { name, id: '123456789012345678' }] as [string, object])),
  },
});

describe('emoji.get', () => {
  it('parses custom emoji markup', async () => {
    const { get } = await load();
    expect(get('<:wave:12345>')).toEqual({ name: 'wave', id: '12345' });
    expect(() => get('<:broken>')).toThrow('not found');
  });

  it('falls back to the heart before the cache is loaded', async () => {
    const { get } = await load();
    expect(get('anything')).toEqual(FALLBACK);
  });

  it('looks names up in the RPG guild, then the main guild', async () => {
    const { get, emojiCache } = await load();
    const rpg = guildWith(['sword']);
    const main = guildWith(['party']);
    const client = { guilds: { fetch: vi.fn(async (id: string) => (id === e.DISCORD_EMOJI_GUILD_RPG ? rpg : main)) } };
    await emojiCache(client as never);
    expect(get('sword')).toMatchObject({ name: 'sword' });
    expect(get('party')).toMatchObject({ name: 'party' });
    expect(get('missing')).toEqual(FALLBACK);
    expect(global.emojiGet).toBe(get);
  });

  it('survives guilds the bot is not in', async () => {
    const { get, emojiCache } = await load();
    await emojiCache({ guilds: { fetch: vi.fn().mockRejectedValue(new Error('Unknown Guild')) } } as never);
    expect(get('x')).toEqual(FALLBACK);
  });
});

describe('customButton', () => {
  it('uses short emoji strings directly', async () => {
    const { customButton } = await load();
    const button = customButton('id', 'Label', '🎉').toJSON() as unknown as Record<string, unknown>;
    expect(button).toMatchObject({
      custom_id: 'id', label: 'Label', style: ButtonStyle.Success, emoji: { name: '🎉' },
    });
  });

  it('resolves named emoji and honours the style', async () => {
    const { customButton, emojiCache } = await load();
    const rpg = guildWith(['longname']);
    await emojiCache({ guilds: { fetch: vi.fn(async () => rpg) } } as never);
    const button = customButton('id', 'Label', 'longname', ButtonStyle.Danger).toJSON() as unknown as Record<string, unknown>;
    expect(button).toMatchObject({ style: ButtonStyle.Danger, emoji: { id: '123456789012345678' } });
  });
});
