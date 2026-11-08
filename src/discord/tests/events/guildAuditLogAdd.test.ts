import {
  AuditLogEvent, EmbedBuilder, Guild, GuildAuditLogsEntry,
} from 'discord.js';
import { guildAuditLogEntryCreate } from '../../events/guildAuditLogAdd';

type Execute = (entry: GuildAuditLogsEntry, guild: Guild) => Promise<void>;

describe('guildAuditLogEntryCreate', () => {
  const send = vi.fn();
  const execute = guildAuditLogEntryCreate.execute as Execute;
  const guild = {
    id: env.DISCORD_GUILD_ID,
    client: { user: { id: 'bot' } },
    members: { fetch: vi.fn() },
  } as unknown as Guild;

  const entry = (overrides: Record<string, unknown>) => ({
    targetType: 'AutoModerationRule',
    actionType: 'Create',
    action: AuditLogEvent.AutoModerationBlockMessage,
    executor: null,
    executorId: null,
    changes: [],
    reason: null,
    extra: null,
    target: null,
    ...overrides,
  }) as unknown as GuildAuditLogsEntry;

  beforeEach(() => {
    send.mockReset();
    global.discordClient = {
      channels: { fetch: vi.fn().mockResolvedValue({ send }) },
    } as unknown as typeof global.discordClient;
  });

  const sentEmbed = () => (send.mock.calls[0][0].embeds[0] as EmbedBuilder).toJSON();

  it('ignores other guilds and message entries', async () => {
    await execute(entry({}), { ...guild, id: 'other' } as unknown as Guild);
    await execute(entry({ targetType: 'Message' }), guild);
    expect(send).not.toHaveBeenCalled();
  });

  it('does not crash on an AutoMod entry with a reason but null extra', async () => {
    await execute(entry({ reason: 'blocked word' }), guild);
    expect(send).toHaveBeenCalledOnce();
    expect(sentEmbed().description).toContain('**Reason:** blocked word');
  });

  it('shows the AutoMod trigger keyword when present', async () => {
    await execute(entry({ reason: 'blocked', extra: { keyword: 'badword' } }), guild);
    expect(sentEmbed().description).toContain('**Triggered by:** `badword`');
  });

  it('keeps the description within the embed limit', async () => {
    const changes = Array.from({ length: 200 }, (_, i) => ({
      key: `field${i}`, old: 'x'.repeat(100), new: 'y'.repeat(100),
    }));
    await execute(entry({ targetType: 'Role', actionType: 'Update', changes }), guild);
    expect(sentEmbed().description?.length).toBeLessThanOrEqual(4096);
  });
});
