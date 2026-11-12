/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len, sonarjs/no-duplicate-string */
import {
  aiButton, aiCommand, aiMenu, aiMessage, aiReaction, discordAiModerate,
} from '../../commands/global/d.ai';
import { AiText } from '../../utils/ai/texts';
import { slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({
  moderate: vi.fn(),
  chat: vi.fn(),
  audit: vi.fn(),
  prompt: vi.fn(),
  premium: vi.fn(),
  getUser: vi.fn(),
  page: {
    info: vi.fn(), personas: vi.fn(), userSettings: vi.fn(), guildSettings: vi.fn(), privacy: vi.fn(), tos: vi.fn(),
  },
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.ai', () => ({ aiModerate: mocks.moderate }));
vi.mock('../../utils/aiClients/openrouter.client', () => ({ OpenRouterClient: { chat: mocks.chat } }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateUser: mocks.getUser }));
vi.mock('../../utils/ai', async () => {
  const texts = await import('../../utils/ai/texts');
  return {
    AiText: texts.AiText,
    AiPage: mocks.page,
    AiFunction: { checkPremiumStatus: mocks.premium, createPrompt: mocks.prompt, aiAudit: mocks.audit },
  };
});

const e = env as unknown as Record<string, string>;

describe('ai command', () => {
  beforeEach(() => {
    Object.values(mocks.page).forEach(p => p.mockResolvedValue({ content: 'page' }));
  });

  it.each([
    ['info', 'info'], ['personas', 'personas'], ['settings', 'userSettings'], ['setup', 'guildSettings'], ['privacy', 'privacy'],
    ['tos', 'tos'], ['unknown', 'info'],
  ])('%s renders the %s page', async (sub, page) => {
    const stub = slashStub({ subcommand: sub });
    expect(await aiCommand.execute(stub as never)).toBe(true);
    expect(mocks.page[page as keyof typeof mocks.page]).toHaveBeenCalled();
    expect(stub.editReply).toHaveBeenCalledWith({ content: 'page' });
  });
});

describe('discordAiModerate', () => {
  const message = (over: Record<string, unknown> = {}) => ({
    author: { bot: false, id: 'a1' },
    cleanContent: 'hello tripbot',
    channel: { type: 0 },
    guild: { id: 'g1' },
    member: { id: 'a1', displayName: 'Al', user: { displayAvatarURL: () => 'https://av' } },
    url: 'https://m',
    ...over,
  });
  const logChannel = (send = vi.fn()) => {
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn(async () => ({ send })) } };
    return send;
  };

  it('ignores bots, empty content, DMs and clean messages', async () => {
    await discordAiModerate(message({ author: { bot: true } }) as never);
    await discordAiModerate(message({ cleanContent: '' }) as never);
    await discordAiModerate(message({ channel: { type: 1 } }) as never);
    await discordAiModerate(message({ guild: null }) as never);
    expect(mocks.moderate).not.toHaveBeenCalled();
    mocks.moderate.mockResolvedValueOnce([]);
    await discordAiModerate(message() as never);
    expect(mocks.moderate).toHaveBeenCalledWith('hello ', 'g1');
  });

  it('posts a flag report with adjustment buttons', async () => {
    const send = logChannel();
    mocks.moderate.mockResolvedValueOnce([{ category: 'hate/threatening', value: 0.95, limit: 0.5 }, { category: 'self-harm', value: 0.6, limit: 0.5 }]);
    await discordAiModerate(message() as never);
    const sent = send.mock.calls[0][0];
    expect(sent.content).toContain('hate/threatening, self-harm');
    expect(sent.components).toHaveLength(3);
    expect(sent.embeds[0].data.color).toBeDefined();
  });

  it('survives a failed send', async () => {
    logChannel(vi.fn().mockRejectedValue(new Error('x')));
    mocks.moderate.mockResolvedValueOnce([{ category: 'sexual', value: 0.1, limit: 0.5 }]);
    await expect(discordAiModerate(message() as never)).resolves.toBeUndefined();
  });
});

describe('aiMessage', () => {
  const msg = (over: Record<string, unknown> = {}) => ({
    fetch: vi.fn(),
    id: 'm1',
    channelId: 'c1',
    author: { bot: false, id: 'u1', tag: 'u#0' },
    cleanContent: 'hi',
    guild: { id: 'g1' },
    member: {},
    mentions: { has: vi.fn(() => false) },
    channel: { isTextBased: () => true, isDMBased: () => false, sendTyping: vi.fn() },
    reply: vi.fn(),
    ...over,
  });
  const enabled = () => { db.discord_guilds.findUnique = vi.fn().mockResolvedValue({ ai_channels: [{ channel_id: 'c1' }] }) as never; };
  const agreed = (id = 'ai1') => {
    db.users.upsert = vi.fn().mockResolvedValue({
      ai_info: {
        id, ai_tos_agree: new Date(), ai_privacy_agree: new Date(), persona_id: 'tripbot',
      },
    }) as never;
  };

  beforeEach(() => {
    mocks.chat.mockReset();
    (global as unknown as Record<string, unknown>).discordClient = { user: { id: 'bot' } };
    db.ai_message.aggregate = vi.fn().mockResolvedValue({ _sum: { usd: null } }) as never;
    db.ai_persona.upsert = vi.fn().mockResolvedValue({ id: 'p1' }) as never;
    db.ai_message.create = vi.fn() as never;
    mocks.prompt.mockResolvedValue('PROMPT');
    mocks.premium.mockReturnValue(false);
  });

  it('ignores bots, empties and DMs', async () => {
    await aiMessage(msg({ author: { bot: true } }) as never);
    await aiMessage(msg({ cleanContent: '' }) as never);
    const noGuild = msg({ guild: null });
    await aiMessage(noGuild as never);
    expect(noGuild.reply).not.toHaveBeenCalled();
  });

  it('says AI is disabled only when mentioned', async () => {
    db.discord_guilds.findUnique = vi.fn().mockResolvedValue(null) as never;
    const quiet = msg();
    await aiMessage(quiet as never);
    expect(quiet.reply).not.toHaveBeenCalled();
    const mentioned = msg({ mentions: { has: () => true } });
    await aiMessage(mentioned as never);
    expect(mentioned.reply).toHaveBeenCalledWith(expect.stringContaining('/ai setup'));
  });

  it('requires TOS and privacy agreement', async () => {
    enabled();
    db.users.upsert = vi.fn().mockResolvedValue({ ai_info: null }) as never;
    const m = msg();
    await aiMessage(m as never);
    expect(m.reply).toHaveBeenCalledWith(expect.stringContaining('/ai tos'));
  });

  it('replies, records usage and reacts', async () => {
    enabled();
    agreed();
    const react = vi.fn();
    const m = msg();
    m.reply.mockResolvedValue({ react });
    mocks.chat.mockResolvedValue({ content: 'x'.repeat(2500), usage: { promptTokens: 1, completionTokens: 2, cost: 0.01 } });
    await aiMessage(m as never);
    expect(mocks.chat).toHaveBeenCalledWith(expect.objectContaining({ model: AiText.primaryModel }));
    expect(m.reply.mock.calls[0][0].content).toHaveLength(2000);
    expect(db.ai_message.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tokens: 3 }) });
    expect(react).toHaveBeenCalledTimes(2);
  });

  it('falls back to the cheaper model past the daily limit, with premium raising it', async () => {
    enabled();
    agreed();
    const react = vi.fn();
    db.ai_message.aggregate = vi.fn().mockResolvedValue({ _sum: { usd: { toNumber: () => 0.1 } } }) as never;
    mocks.chat.mockResolvedValue({ content: 'ok' });
    const a = msg();
    a.reply.mockResolvedValue({ react });
    await aiMessage(a as never);
    expect(mocks.chat).toHaveBeenLastCalledWith(expect.objectContaining({ model: AiText.backupModel }));
    mocks.premium.mockReturnValue(true);
    const b = msg({ channel: { isTextBased: () => false } });
    b.reply.mockResolvedValue({ react });
    await aiMessage(b as never);
    expect(mocks.chat).toHaveBeenLastCalledWith(expect.objectContaining({ model: AiText.primaryModel }));
  });

  it('apologises when the model fails', async () => {
    enabled();
    agreed();
    mocks.chat.mockRejectedValue(new Error('down'));
    const m = msg();
    await aiMessage(m as never);
    expect(m.reply).toHaveBeenCalledWith(expect.stringContaining('trouble thinking'));
  });
});

describe('aiReaction', () => {
  const reaction = (over: Record<string, unknown> = {}, count = 1) => {
    const send = vi.fn();
    const removeAll = vi.fn();
    const edit = vi.fn();
    const original = { id: 'o1', cleanContent: 'q', author: { displayName: 'U', id: 'u1' } };
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn(async () => ({ isSendable: () => true, send })) } };
    const r = {
      emoji: { name: '👍' },
      count,
      message: {
        guild: { name: 'Guild' },
        reference: {},
        author: { bot: true },
        cleanContent: 'reply',
        edit,
        fetchReference: vi.fn(async () => original),
        reactions: { removeAll },
        ...over,
      },
    };
    return {
      r, send, edit, removeAll,
    };
  };
  const user = { bot: false, displayName: 'V' };

  beforeEach(() => {
    db.ai_message.findUniqueOrThrow = vi.fn().mockResolvedValue({ ai_persona: { name: 'tripbot' } }) as never;
    db.ai_persona.update = vi.fn() as never;
  });

  it('ignores irrelevant reactions', async () => {
    for (const over of [{ guild: null }, { reference: null }, { author: { bot: false } }]) {
      // eslint-disable-next-line no-await-in-loop
      await aiReaction(reaction(over).r as never, user as never);
    }
    await aiReaction(reaction().r as never, { bot: true } as never);
    const wrongEmoji = reaction();
    wrongEmoji.r.emoji.name = '🎉';
    await aiReaction(wrongEmoji.r as never, user as never);
    expect(db.ai_persona.update).not.toHaveBeenCalled();
  });

  it('survives a missing reference', async () => {
    const x = reaction({ fetchReference: vi.fn().mockRejectedValue(new Error('gone')) });
    await aiReaction(x.r as never, user as never);
    expect(db.ai_persona.update).not.toHaveBeenCalled();
  });

  it('records votes and logs them', async () => {
    const up = reaction();
    await aiReaction(up.r as never, user as never);
    expect(db.ai_persona.update).toHaveBeenCalledWith(expect.objectContaining({ data: { upvotes: { increment: 1 } } }));
    expect(up.send).toHaveBeenCalledTimes(1);
    const down = reaction();
    down.r.emoji.name = 'ts_thumbdown';
    await aiReaction(down.r as never, user as never);
    expect(db.ai_persona.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { downvotes: { increment: 1 } } }));
  });

  it('stops when the vote log is unavailable', async () => {
    const x = reaction();
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn(async () => null) } };
    await aiReaction(x.r as never, user as never);
    expect(x.send).not.toHaveBeenCalled();
  });

  it('announces and locks the message at the audit threshold', async () => {
    const limit = e.NODE_ENV === 'production' ? 4 : 3;
    const up = reaction({}, limit);
    await aiReaction(up.r as never, user as never);
    expect(up.edit).toHaveBeenCalledWith(expect.stringContaining('excellent'));
    expect(up.removeAll).toHaveBeenCalled();
    const down = reaction({}, limit);
    down.r.emoji.name = '👎';
    await aiReaction(down.r as never, user as never);
    expect(down.edit).toHaveBeenCalledWith(expect.stringContaining('improper'));
  });
});

describe('aiMenu', () => {
  const menu = (customId: string, values: string[], inGuild = true) => ({
    customId, values, user: { id: 'u1' }, inGuild: () => inGuild, guildId: 'g1',
  });
  beforeEach(() => {
    Object.values(mocks.page).forEach(p => p.mockResolvedValue({ content: 'page' }));
    mocks.getUser.mockResolvedValue({ id: 'db1' });
    db.ai_info.update = vi.fn() as never;
    db.ai_channel.deleteMany = vi.fn() as never;
    db.ai_channel.createMany = vi.fn() as never;
    db.$transaction = vi.fn() as never;
  });

  it('saves the selected persona', async () => {
    await aiMenu(menu(AiText.MenuId.PERSONA_SELECT, ['tripbot']) as never);
    expect(db.ai_info.update).toHaveBeenCalledWith({ where: { user_id: 'db1' }, data: { persona_id: 'tripbot' } });
    expect(mocks.page.userSettings).toHaveBeenCalled();
  });

  it('syncs guild channels, but only in a guild', async () => {
    expect(await aiMenu(menu(AiText.MenuId.GUILD_CHANNELS, ['c1'], false) as never)).toEqual({ content: expect.any(String) });
    await aiMenu(menu(AiText.MenuId.GUILD_CHANNELS, ['c1']) as never);
    expect(db.$transaction).toHaveBeenCalled();
    expect(mocks.page.guildSettings).toHaveBeenCalled();
  });

  it.each([
    [AiText.Page.INFO.value, 'info'], [AiText.Page.PERSONAS.value, 'personas'], [AiText.Page.USER_SETTINGS.value, 'userSettings'],
    [AiText.Page.GUILD_SETUP.value, 'guildSettings'], [AiText.Page.PRIVACY.value, 'privacy'], [AiText.Page.TOS.value, 'tos'], ['zzz', 'userSettings'],
  ])('page select %s routes to %s', async (value, page) => {
    await aiMenu(menu(AiText.MenuId.PAGE_SELECT, [value]) as never);
    expect(mocks.page[page as keyof typeof mocks.page]).toHaveBeenCalled();
  });
});

describe('aiButton', () => {
  const button = (customId: string) => ({ customId, user: { id: 'u1' }, update: vi.fn() });
  beforeEach(() => {
    Object.values(mocks.page).forEach(p => p.mockResolvedValue({ content: 'page' }));
    db.users.update = vi.fn() as never;
  });

  it('records agreement and refreshes the page', async () => {
    const tos = button(AiText.ButtonId.AGREE_TOS);
    await aiButton(tos as never);
    expect(tos.update).toHaveBeenCalledWith({ content: 'page' });
    expect(mocks.page.tos).toHaveBeenCalled();
    const priv = button(AiText.ButtonId.AGREE_PRIVACY);
    await aiButton(priv as never);
    expect(mocks.page.privacy).toHaveBeenCalled();
    expect(db.users.update).toHaveBeenCalledTimes(2);
  });

  it('falls back to the settings page', async () => {
    await aiButton(button('other') as never);
    expect(mocks.page.userSettings).toHaveBeenCalled();
  });
});
