import { AiText } from '../../../utils/ai/texts';
import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { AiPage } from '../../../utils/ai/pages';
import { dbMock } from '../../../../vitest/utils/mockDb';

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

vi.mock('../../../commands/global/d.drug', () => ({ getDrugInfo: vi.fn() }));

const e = env as unknown as Record<string, string>;

const interaction = (over: Record<string, unknown> = {}) => ({
  user: { id: 'u1', username: 'alice' },
  guild: { id: 'g1' },
  member: { permissions: { has: (flag: bigint) => flag === PermissionFlagsBits.ManageGuild } },
  isButton: () => false,
  isChatInputCommand: () => false,
  isStringSelectMenu: () => false,
  isChannelSelectMenu: () => false,
  ...over,
}) as never;

const text = (reply: { components?: readonly unknown[] }) => JSON.stringify(
  (reply.components as Array<{ toJSON(): unknown }>).map(c => c.toJSON()),
);

const agg = (messages: number, tokens: number, usd: number) => ({ _count: { id: messages }, _sum: { tokens, usd } });

describe('AiPage.info', () => {
  it('shows live global statistics', async () => {
    dbMock.ai_message.aggregate
      .mockResolvedValueOnce(agg(1000, 50000, 12.345) as never)
      .mockResolvedValueOnce(agg(20, 900, 0.5) as never);
    dbMock.ai_image.count.mockResolvedValue(5);
    const reply = await AiPage.info(interaction());
    expect(reply.flags).toBe(MessageFlags.IsComponentsV2);
    const body = text(reply);
    expect(body).toContain('Messages Sent: `20`');
    expect(body).toContain('Total Interactions: `1,005`');
    expect(body).toContain('$12.35');
  });

  it('treats missing aggregates as zero', async () => {
    dbMock.ai_message.aggregate.mockResolvedValue({ _count: { id: 0 }, _sum: { tokens: null, usd: null } } as never);
    dbMock.ai_image.count.mockResolvedValue(0);
    expect(text(await AiPage.info(interaction()))).toContain('Total Tokens: `0`');
  });

  it('computes the day start in the past when the reset time is still ahead', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-06-15T03:00:00Z'));
    try {
      dbMock.ai_message.aggregate.mockResolvedValue(agg(0, 0, 0) as never);
      dbMock.ai_image.count.mockResolvedValue(0);
      await AiPage.info(interaction());
      const daily = dbMock.ai_message.aggregate.mock.calls[1][0] as { where: { created_at: { gte: Date } } };
      expect(daily.where.created_at.gte.toISOString()).toBe('2024-06-14T06:00:00.000Z');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('AiPage.personas', () => {
  it('shows per-persona usage and the user\'s current persona', async () => {
    asMock(dbMock.ai_message.groupBy).mockResolvedValue([
      { ai_persona_id: 'db1', _count: { id: 42 } }, { ai_persona_id: 'unknown', _count: { id: 7 } },
    ] as never);
    dbMock.ai_persona.findMany.mockResolvedValue([{ id: 'db1', name: 'guardian' }] as never);
    dbMock.users.findUnique.mockResolvedValue({ ai_info: { persona_id: 'guardian' } } as never);
    const body = text(await AiPage.personas(interaction()));
    expect(body).toContain('Current: 🛡️ Guardian');
    expect(body).toContain('Total Messages: 42');
  });

  it('defaults to TripBot for unknown users or personas', async () => {
    asMock(dbMock.ai_message.groupBy).mockResolvedValue([] as never);
    dbMock.ai_persona.findMany.mockResolvedValue([]);
    dbMock.users.findUnique.mockResolvedValue({ ai_info: { persona_id: 'deleted_persona' } } as never);
    expect(text(await AiPage.personas(interaction()))).toContain('Current: 🤖 TripBot');
    dbMock.users.findUnique.mockResolvedValue(null);
    expect(text(await AiPage.personas(interaction()))).toContain('Current: 🤖 TripBot');
  });
});

describe('AiPage.guildSettings', () => {
  it('requires a guild', async () => {
    expect(await AiPage.guildSettings(interaction({ guild: null }))).toEqual({ content: 'This command only works in a server.' });
  });

  it('lets managers edit the enabled channel list', async () => {
    dbMock.discord_guilds.upsert.mockResolvedValue({ ai_channels: [{ channel_id: '111' }, { channel_id: '222' }] } as never);
    const body = text(await AiPage.guildSettings(interaction()));
    expect(body).toContain('<#111>, <#222>');
    expect(body).toContain('Use the menu below');
    expect(body).toContain('AI~guildChannels');
  });

  it('shows the list read-only to everyone else', async () => {
    dbMock.discord_guilds.upsert.mockResolvedValue({ ai_channels: [] } as never);
    const body = text(await AiPage.guildSettings(interaction({ member: { permissions: { has: () => false } } })));
    expect(body).toContain('**Currently Enabled:** None');
    expect(body).toContain('Only server administrators');
    expect(body).not.toContain('"custom_id":"AI~guildChannels"');
  });
});

describe('AiPage.userSettings', () => {
  const stubGuildMember = (roles: string[]) => {
    const member = { fetch: vi.fn(), roles: { cache: new Set(roles) } };
    (global as unknown as { discordClient: unknown }).discordClient = {
      guilds: { cache: new Map([[e.DISCORD_GUILD_ID, { members: { fetch: vi.fn(async () => member) } }]]) },
    };
  };
  const user = (over: Record<string, unknown> = {}) => dbMock.users.upsert.mockResolvedValue({ id: 'uid', ai_info: { id: 'ai1', persona_id: 'tripbot' }, ...over } as never);

  it('shows usage and remaining credits for standard users', async () => {
    stubGuildMember([]);
    user();
    dbMock.ai_message.aggregate.mockResolvedValueOnce(agg(100, 5000, 1) as never).mockResolvedValueOnce(agg(4, 200, 0.01) as never);
    dbMock.ai_image.count.mockResolvedValue(3);
    const body = text(await AiPage.userSettings(interaction()));
    expect(body).toContain('Messages Today: `4`');
    expect(body).toContain('credits remaining');
    expect(body).toContain('Avg. Cost/Msg: `$0.01000`');
    expect(body).not.toContain('Switch Persona');
  });

  it('lets premium users switch persona, and flags exhausted budgets', async () => {
    stubGuildMember([e.ROLE_PREMIUM]);
    user();
    dbMock.ai_message.aggregate.mockResolvedValueOnce(agg(0, 0, 0) as never).mockResolvedValueOnce(agg(1, 1, 99) as never);
    dbMock.ai_image.count.mockResolvedValue(0);
    const body = text(await AiPage.userSettings(interaction()));
    expect(body).toContain('Switch Persona (Current: TripBot)');
    expect(body).toContain('Avg. Cost/Msg: `$0.00000`');
    stubGuildMember([]);
    dbMock.ai_message.aggregate.mockResolvedValueOnce(agg(1, 1, 1) as never).mockResolvedValueOnce(agg(1, 1, 5) as never);
    expect(text(await AiPage.userSettings(interaction()))).toContain('Limit reached');
  });

  it('creates the AI record for first-time users', async () => {
    stubGuildMember([]);
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', ai_info: null } as never);
    dbMock.users.findUniqueOrThrow.mockResolvedValue({ id: 'uid', ai_info: { id: 'ai1', persona_id: 'unknown_persona' } } as never);
    dbMock.ai_message.aggregate.mockResolvedValue(agg(0, 0, 0) as never);
    dbMock.ai_image.count.mockResolvedValue(0);
    const body = text(await AiPage.userSettings(interaction()));
    expect(dbMock.ai_info.create).toHaveBeenCalledWith({ data: { user_id: 'uid' } });
    expect(body).toContain('🤖 TripBot');
  });

  it('fails loudly when the AI record cannot be created', async () => {
    stubGuildMember([]);
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', ai_info: null } as never);
    dbMock.users.findUniqueOrThrow.mockResolvedValue({ id: 'uid', ai_info: null } as never);
    await expect(AiPage.userSettings(interaction())).rejects.toThrow('AI Info record missing');
  });

  it('works when the user is not in the main guild', async () => {
    (global as unknown as { discordClient: unknown }).discordClient = { guilds: { cache: new Map() } };
    user();
    dbMock.ai_message.aggregate.mockResolvedValue(agg(0, 0, 0) as never);
    dbMock.ai_image.count.mockResolvedValue(0);
    expect(text(await AiPage.userSettings(interaction()))).toContain('AI User Settings');
    (global as unknown as { discordClient: unknown }).discordClient = {
      guilds: { cache: new Map([[e.DISCORD_GUILD_ID, { members: { fetch: vi.fn().mockRejectedValue(new Error('Unknown Member')) } }]]) },
    };
    expect(text(await AiPage.userSettings(interaction()))).toContain('Resource Usage');
  });
});

describe.each([
  ['tos', 'ai_tos_agree', 'agreeTos', 'AI~agreeTos'],
  ['privacy', 'ai_privacy_agree', 'agreePrivacy', 'AI~agreePrivacy'],
] as const)('AiPage.%s', (page, field, _button, buttonId) => {
  it('asks users who have not agreed to do so', async () => {
    dbMock.users.upsert.mockResolvedValue({ ai_info: null } as never);
    const body = text(await AiPage[page](interaction()));
    expect(body).toContain(buttonId);
    expect(body).toContain('You have not agreed');
  });

  it('separates multi-part documents with dividers', async () => {
    const parts = page === 'tos' ? AiText.aiTermsOfService : AiText.aiPrivacyPolicy;
    (parts as string[]).push('A second section');
    try {
      dbMock.users.upsert.mockResolvedValue({ ai_info: null } as never);
      const body = text(await AiPage[page](interaction()));
      expect(body).toContain('A second section');
      expect(body).toContain('"divider":true');
    } finally {
      (parts as string[]).pop();
    }
  });

  it('shows the agreement date without the button for users who agreed', async () => {
    dbMock.users.upsert.mockResolvedValue({ ai_info: { [field]: new Date('2024-01-01T00:00:00Z') } } as never);
    const body = text(await AiPage[page](interaction()));
    expect(body).not.toContain(`"custom_id":"${buttonId}"`);
    expect(body).toContain('You agreed to the');
  });
});
