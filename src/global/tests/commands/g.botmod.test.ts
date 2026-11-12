import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { botmod } from '../../commands/g.botmod';
import { dbMock } from '../../../vitest/utils/mockDb';

vi.mock('../../../discord/utils/context', () => ({ default: vi.fn(async () => 'ctx') }));

const modSend = vi.fn();
const modlogSend = vi.fn();
const ownerSend = vi.fn();
const leave = vi.fn();

const actor = { displayName: 'Mod' } as GuildMember;
const owner = {
  id: 'owner', send: ownerSend, user: { tag: 'owner#0' }, toString: (): string => '<@owner>',
};
const targetGuild = {
  id: 'tg',
  name: 'Target',
  ownerId: 'owner',
  nameAcronym: 'T',
  createdAt: new Date(),
  joinedAt: new Date(),
  description: 'd',
  memberCount: 3,
  large: false,
  nsfwLevel: 0,
  partnered: false,
  preferredLocale: 'en-US',
  leave,
  members: { fetch: vi.fn(async () => owner) },
};
const interaction = {
  client: {
    users: { fetch: vi.fn(async (id: string) => ({ id, tag: `${id}#1` })) },
    guilds: { fetch: vi.fn(async () => targetGuild) },
  },
} as unknown as ChatInputCommandInteraction;

type Upsert = Awaited<ReturnType<typeof dbMock.users.upsert>>;
type GuildUpsert = Awaited<ReturnType<typeof dbMock.discord_guilds.upsert>>;
const userRow = (banned: boolean) => dbMock.users.upsert.mockResolvedValueOnce({ id: 'u', discord_bot_ban: banned } as unknown as Upsert);
const guildRow = (banned: boolean) => dbMock.discord_guilds.upsert.mockResolvedValueOnce({ id: 'tg', is_banned: banned } as unknown as GuildUpsert);

beforeEach(() => {
  (global as unknown as { discordClient: unknown }).discordClient = {
    channels: { fetch: vi.fn(async (id: string) => ({ send: id === env.CHANNEL_MODERATORS ? modSend : modlogSend })) },
    guilds: { fetch: vi.fn(async () => ({ roles: { fetch: vi.fn(async () => ({ toString: (): string => '<@&mods>' })) } })) },
  };
});

const title = (r: { embeds?: readonly unknown[] }) => (r.embeds?.[0] as { data: { title?: string; description?: string } }).data;

describe('botmod user', () => {
  it('refuses redundant bans and unbans', async () => {
    userRow(true);
    expect(title(await botmod(interaction, 'user', actor, 'BOTBAN', 'x', null, null)).title).toBe('User Already Banned');
    userRow(false);
    expect(title(await botmod(interaction, 'user', actor, 'UNBOTBAN', 'x', null, null)).title).toBe('User Not Banned');
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });

  it('bans a user and notifies the mod channels', async () => {
    userRow(false);
    const result = await botmod(interaction, 'user', actor, 'BOTBAN', 'x', 'priv', 'pub');
    expect(dbMock.users.update).toHaveBeenCalledWith({ where: { discord_id: 'x' }, data: { discord_bot_ban: true } });
    expect(modSend).toHaveBeenCalledWith(expect.objectContaining({ content: 'Hey <@&mods>' }));
    expect(modlogSend).toHaveBeenCalled();
    expect(title(result).description).toBe('x#1 has been bot banned!');
  });

  it('unbans a user', async () => {
    userRow(true);
    await botmod(interaction, 'user', actor, 'UNBOTBAN', 'x', null, null);
    expect(dbMock.users.update).toHaveBeenCalledWith({ where: { discord_id: 'x' }, data: { discord_bot_ban: false } });
  });
});

describe('botmod guild', () => {
  it('refuses redundant bans and unbans', async () => {
    guildRow(true);
    expect(title(await botmod(interaction, 'guild', actor, 'BOTBAN', 'tg', null, null)).title).toBe('Guild Already Banned');
    guildRow(false);
    expect(title(await botmod(interaction, 'guild', actor, 'UNBOTBAN', 'tg', null, null)).title).toBe('Guild Not Banned');
  });

  it('bans a guild: DMs the owner, leaves, and records the ban', async () => {
    guildRow(false);
    const result = await botmod(interaction, 'guild', actor, 'BOTBAN', 'tg', 'priv', 'pub');
    expect(ownerSend).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalled();
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'tg' }, data: { is_banned: true } });
    expect(title(result).description).toBe('Target has been bot banned!');
  });

  it('kicks without banning', async () => {
    guildRow(false);
    await botmod(interaction, 'guild', actor, 'BOTKICK', 'tg', null, 'bye');
    expect(leave).toHaveBeenCalled();
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: { is_banned: false } }));
  });

  it('warns with buttons and tolerates closed DMs', async () => {
    guildRow(false);
    await botmod(interaction, 'guild', actor, 'BOTWARNING', 'tg', null, 'careful');
    expect(ownerSend).toHaveBeenCalledWith(expect.objectContaining({ components: expect.any(Array) }));
    guildRow(false);
    ownerSend.mockRejectedValueOnce(new Error('closed'));
    await expect(botmod(interaction, 'guild', actor, 'BOTWARNING', 'tg', null, 'careful')).resolves.toBeDefined();
    guildRow(false);
    ownerSend.mockRejectedValueOnce(new Error('closed'));
    await expect(botmod(interaction, 'guild', actor, 'UNBOTBAN' as never, 'tg', null, 'x')).resolves.toBeDefined();
  });

  it('unbans a banned guild', async () => {
    guildRow(true);
    await botmod(interaction, 'guild', actor, 'UNBOTBAN', 'tg', null, 'sorry');
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: { is_banned: false } }));
    expect(leave).not.toHaveBeenCalled();
  });

  it('notes silently and returns guild info without writing', async () => {
    guildRow(false);
    await botmod(interaction, 'guild', actor, 'BOTNOTE', 'tg', 'note', null);
    expect(ownerSend).not.toHaveBeenCalled();
    expect(modSend).toHaveBeenCalled();

    vi.clearAllMocks();
    guildRow(false);
    const info = await botmod(interaction, 'guild', actor, 'BOTINFO', 'tg', null, null);
    expect(dbMock.discord_guilds.update).not.toHaveBeenCalled();
    expect(modSend).not.toHaveBeenCalled();
    const fields = (info.embeds?.[0] as { data: { fields: { name: string }[] } }).data.fields.map(f => f.name);
    expect(fields).toEqual(expect.arrayContaining(['Name', 'Members', 'Owner Name', 'Locale']));
  });
});
