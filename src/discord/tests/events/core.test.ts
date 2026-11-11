/* eslint-disable no-restricted-syntax */
import { InteractionType } from 'discord-api-types/v10';
import {
  DiscordAPIError, MessageFlags, TextChannel, Collection,
} from 'discord.js';
import { ready } from '../../events/ready';
import { interactionCreate } from '../../events/interactionCreate';
import { messageCreate } from '../../events/messageCreate';
import { voiceStateUpdate } from '../../events/voiceStateUpdate';
import { selectMenu } from '../../events/selectMenu';
import modalSubmit from '../../events/modalSubmit';
import { botBannedUsers } from '../../utils/populateBotBans';
import { sleep } from '../../utils/sleep';
import { dbMock } from '../../../vitest/utils/mockDb';
import { flushPromises, stubInstance } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;

const mocks = vi.hoisted(() => ({
  commandRun: vi.fn(),
  autocomplete: vi.fn(),
  buttonClick: vi.fn(),
  selectMenuHandlers: {} as Record<string, ReturnType<typeof vi.fn>>,
  messageCommand: vi.fn(),
  bridgeMessage: vi.fn(),
  relayDiscordMessage: vi.fn(),
  countMessage: vi.fn(),
  youAre: vi.fn(),
  karma: vi.fn(),
  imagesOnly: vi.fn(),
  helperActivity: vi.fn(),
  nightsWatch: vi.fn(),
  experience: vi.fn(),
  announcements: vi.fn(),
  pitchTent: vi.fn(),
  teardownTent: vi.fn(),
  logTent: vi.fn(),
  updateTentStatus: vi.fn(),
  botStats: vi.fn(),
  fact: vi.fn(),
  runTimer: vi.fn(),
  checkGuild: vi.fn(),
  ensure: vi.fn(),
  emojiCache: vi.fn(),
  populate: vi.fn(),
  modHistoryButton: vi.fn(),
  helpMenu: vi.fn(),
  rpgHome: vi.fn(),
  rpgMarketChange: vi.fn(),
  applicationStart: vi.fn(),
  applicationReject: vi.fn(),
  aiMenu: vi.fn(),
  purgeMenu: vi.fn(),
  userSettings: vi.fn(),
  context: vi.fn(),
}));

vi.mock('../../utils/commandRun', () => ({ commandRun: mocks.commandRun }));
vi.mock('../../events/autocomplete', () => ({ autocomplete: mocks.autocomplete }));
vi.mock('../../events/buttonClick', () => ({ buttonClick: mocks.buttonClick }));
vi.mock('../../utils/messageCommand', () => ({ messageCommand: mocks.messageCommand }));
vi.mock('../../utils/bridge', () => ({ bridgeMessage: mocks.bridgeMessage }));
vi.mock('../../utils/chatBridge', () => ({ relayDiscordMessage: mocks.relayDiscordMessage }));
vi.mock('../../commands/guild/d.counting', () => ({ countMessage: mocks.countMessage }));
vi.mock('../../utils/youAre', () => ({ youAre: mocks.youAre }));
vi.mock('../../utils/karma', () => ({ karma: mocks.karma }));
vi.mock('../../utils/imagesOnly', async importOriginal => ({ ...(await importOriginal<object>()), imagesOnly: mocks.imagesOnly }));
vi.mock('../../utils/helperActivityUpdate', () => ({ helperActivityUpdate: mocks.helperActivity }));
vi.mock('../../../global/commands/g.watchuser', () => ({ nightsWatch: mocks.nightsWatch }));
vi.mock('../../../global/utils/experience', () => ({ experience: mocks.experience }));
vi.mock('../../utils/announcements', () => ({ announcements: mocks.announcements }));
vi.mock('../../utils/tents', () => ({
  pitchTent: mocks.pitchTent, teardownTent: mocks.teardownTent, logTent: mocks.logTent, updateTentStatus: mocks.updateTentStatus,
}));
vi.mock('../../../global/commands/g.botstats', () => ({ botStats: mocks.botStats }));
vi.mock('../../../global/commands/g.fact', () => ({ fact: mocks.fact }));
vi.mock('../../../global/utils/timer', () => ({ default: mocks.runTimer }));
vi.mock('../../utils/checkPermissions', () => ({ checkGuildPermissions: mocks.checkGuild, ensurePermissions: mocks.ensure }));
vi.mock('../../utils/emoji', () => ({ emojiCache: mocks.emojiCache }));
vi.mock('../../utils/modHistory', () => ({ modHistoryButton: mocks.modHistoryButton }));
vi.mock('../../commands/global/d.help', () => ({ helpMenu: mocks.helpMenu }));
vi.mock('../../commands/guild/d.rpg', () => ({ rpgHome: mocks.rpgHome, rpgMarketChange: mocks.rpgMarketChange }));
vi.mock('../../utils/application', () => ({ applicationStart: mocks.applicationStart, applicationReject: mocks.applicationReject }));
vi.mock('../../commands/global/d.ai', () => ({ aiMenu: mocks.aiMenu, aiReaction: vi.fn() }));
vi.mock('../../commands/guild/d.purge', () => ({ purgeMenu: mocks.purgeMenu }));
vi.mock('../../utils/ai', () => ({ AiPage: { userSettings: mocks.userSettings }, AiText: {} }));
vi.mock('../../utils/ai/modals', () => ({ AiModal: { ID: {} } }));
vi.mock('../../utils/context', () => ({ default: mocks.context }));
vi.mock('../../utils/populateBotBans', async importOriginal => ({ ...(await importOriginal<object>()), populateBans: mocks.populate }));
vi.mock('timers/promises', () => ({ setTimeout: vi.fn(async () => undefined) }));

const setClient = (extra: Record<string, unknown> = {}) => {
  (global as unknown as { discordClient: unknown }).discordClient = {
    channels: { fetch: vi.fn(async () => ({ send: vi.fn() })) },
    guilds: { fetch: vi.fn() },
    ...extra,
  };
};

beforeEach(() => {
  setClient();
  (global as unknown as { commandContext: unknown }).commandContext = vi.fn(async () => 'ctx');
  mocks.context.mockResolvedValue('ctx');
});

// Real stacks can exceed an embed description's 4096 character limit, so keep test stacks short.
const shortError = (message: string) => Object.assign(new Error(message), { stack: `Error: ${message}\n    at test` });

// error.ts registers process-level handlers on import. Left in place they would route any stray rejection from
// un-awaited code under test back into handleError, and a failing handler then re-triggers itself forever.
let handleError: typeof import('../../events/error').default;
let error: typeof import('../../events/error').error;
const registeredByErrorModule = { rejection: 0, exception: 0 };

beforeAll(async () => {
  const before = { rej: process.listeners('unhandledRejection'), exc: process.listeners('uncaughtException') };
  const mod = await import('../../events/error');
  handleError = mod.default;
  error = mod.error;
  process.listeners('unhandledRejection').filter(l => !before.rej.includes(l)).forEach(l => {
    registeredByErrorModule.rejection += 1;
    process.off('unhandledRejection', l);
  });
  process.listeners('uncaughtException').filter(l => !before.exc.includes(l)).forEach(l => {
    registeredByErrorModule.exception += 1;
    process.off('uncaughtException', l);
  });
});

describe('handleError', () => {
  const original = { env: e.NODE_ENV };
  afterEach(() => { e.NODE_ENV = original.env; });

  const interaction = (state: { replied?: boolean; deferred?: boolean } = {}) => ({
    replied: false, deferred: false, editReply: vi.fn(), reply: vi.fn(), user: { id: 'u', username: 'alice' }, ...state,
  });

  it('replies ephemerally with the stack in development', async () => {
    const i = interaction();
    await handleError(shortError('boom'), 'cmd', i as never);
    expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ flags: MessageFlags.Ephemeral }));
    expect(i.reply.mock.calls[0][0].embeds[0].data.description).toContain('boom');
  });

  it('edits the existing reply when deferred or replied', async () => {
    const deferred = interaction({ deferred: true });
    await handleError(shortError('x'), 'cmd', deferred as never);
    expect(deferred.editReply).toHaveBeenCalled();
    const replied = interaction({ replied: true });
    await handleError(shortError('x'), 'cmd', replied as never);
    expect(replied.editReply).toHaveBeenCalled();
  });

  it('copes with non-Error values and no interaction', async () => {
    await expect(handleError({ weird: true })).resolves.toBeUndefined();
    const apiError = stubInstance<DiscordAPIError>(DiscordAPIError, { code: 50013, message: 'Missing Permissions' });
    await expect(handleError(apiError)).resolves.toBeUndefined();
  });

  describe('in production', () => {
    const sent: string[] = [];
    const send = vi.fn(async (payload: { embeds?: Array<{ data: { description?: string } }> }) => {
      // The handler reuses one embed for the alert and the user reply, so record its text at send time.
      sent.push(payload.embeds?.[0]?.data.description ?? '');
    });
    beforeEach(() => {
      sent.length = 0;
      e.NODE_ENV = 'production';
      setClient({
        isReady: () => true,
        channels: { fetch: vi.fn(async () => ({ send })) },
        guilds: { fetch: vi.fn(async () => ({ roles: { fetch: vi.fn(async () => '<@&dev>') } })) },
      });
    });

    it('alerts the developers and gives the user a friendly message', async () => {
      const i = interaction();
      await handleError(shortError('prod failure'), 'tripsit', i as never);
      expect(send).toHaveBeenCalledWith(expect.objectContaining({ content: '<@&dev>' }));
      expect(sent[0]).toContain('Error running /tripsit ctx');
      expect(i.reply.mock.calls[0][0].embeds[0].data.description).toContain('developers have been alerted');
    });

    it('omits context for data-sensitive commands', async () => {
      await handleError(shortError('x'), 'idose', interaction() as never);
      expect(sent[0]).toContain('Error running /idose ```');
    });

    it('reports without an interaction', async () => {
      await handleError(shortError('background'));
      expect(send).toHaveBeenCalled();
    });

    it('treats Unknown Interaction (10062) quietly', async () => {
      await handleError(Object.assign(new Error('Unknown interaction'), { code: 10062 }));
      expect(send).toHaveBeenCalledTimes(1);
      expect((send.mock.calls[0][0] as { content?: string }).content).toBeUndefined();
    });
  });

  it('the error event delegates to handleError, and process handlers are registered', async () => {
    await expect(error.execute(shortError('evt') as never)).resolves.toBeUndefined();
    expect(registeredByErrorModule).toEqual({ rejection: 1, exception: 1 });
  });
});

describe('interactionCreate', () => {
  const base = (over: Record<string, unknown> = {}) => ({
    user: { id: 'u', bot: false },
    type: 0,
    isRepliable: () => true,
    reply: vi.fn(),
    isChatInputCommand: () => false,
    isContextMenuCommand: () => false,
    isAnySelectMenu: () => false,
    isButton: () => false,
    customId: 'x',
    isStringSelectMenu: () => false,
    isUserSelectMenu: () => false,
    isChannelSelectMenu: () => false,
    ...over,
  });

  beforeEach(() => { botBannedUsers.length = 0; });

  it('hands modal submissions to the modal handler', async () => {
    const submit = base({ type: InteractionType.ModalSubmit, customId: 'not-ai', editReply: vi.fn() }) as unknown as { editReply: ReturnType<typeof vi.fn> };
    await interactionCreate.execute(submit as never);
    expect(submit.editReply).not.toHaveBeenCalled();
  });

  it('ignores bots and turns away bot-banned users', async () => {
    await interactionCreate.execute(base({ user: { id: 'b', bot: true } }) as never);
    botBannedUsers.push('u');
    const banned = base();
    await interactionCreate.execute(banned as never);
    expect(banned.reply).toHaveBeenCalledWith({ content: '*beeps sadly*', flags: MessageFlags.Ephemeral });
    const notRepliable = base({ isRepliable: () => false });
    await interactionCreate.execute(notRepliable as never);
    expect(notRepliable.reply).not.toHaveBeenCalled();
    expect(mocks.commandRun).not.toHaveBeenCalled();
  });

  it('runs slash commands and records usage with their parameters', async () => {
    dbMock.command_usage.create.mockResolvedValue({ id: 'usage1' } as never);
    const i = base({
      isChatInputCommand: () => true,
      commandName: 'drug',
      channel: { id: 'c' },
      guild: { id: 'g' },
      options: { getSubcommand: () => 'info', data: [{ name: 'info', value: undefined }, { name: 'name', value: 'lsd' }, { name: 'n', value: undefined }] },
    });
    await interactionCreate.execute(i as never);
    expect(mocks.commandRun).toHaveBeenCalled();
    expect(dbMock.command_usage.create).toHaveBeenCalledWith({ data: expect.objectContaining({ command: 'drug info', channel_id: 'c', guild_id: 'g' }) });
    expect(dbMock.command_usage_parameter.createMany).toHaveBeenCalledWith({
      data: [{ name: 'name', value: 'lsd', usage_id: 'usage1' }, { name: 'n', value: '', usage_id: 'usage1' }],
    });
  });

  it('handles slash commands without subcommand, channel or guild', async () => {
    dbMock.command_usage.create.mockResolvedValue({ id: 'u2' } as never);
    const i = base({
      isChatInputCommand: () => true,
      commandName: 'ping',
      channel: null,
      guild: null,
      options: { getSubcommand: () => null, data: [] },
    });
    await interactionCreate.execute(i as never);
    expect(dbMock.command_usage.create).toHaveBeenCalledWith({ data: expect.objectContaining({ command: 'ping', channel_id: '0', guild_id: null }) });
  });

  it('routes context menus, autocomplete, components and modals', async () => {
    await interactionCreate.execute(base({ type: InteractionType.ApplicationCommand, isContextMenuCommand: () => true }) as never);
    expect(mocks.commandRun).toHaveBeenCalledTimes(1);
    await interactionCreate.execute(base({ type: InteractionType.ApplicationCommandAutocomplete }) as never);
    expect(mocks.autocomplete).toHaveBeenCalled();
    await interactionCreate.execute(base({ type: InteractionType.MessageComponent, isContextMenuCommand: () => true }) as never);
    expect(mocks.commandRun).toHaveBeenCalledTimes(2);
    await interactionCreate.execute(base({ type: InteractionType.MessageComponent, isAnySelectMenu: () => true }) as never);
    await interactionCreate.execute(base({ type: InteractionType.MessageComponent, isButton: () => true }) as never);
    expect(mocks.buttonClick).toHaveBeenCalled();
    await interactionCreate.execute(base({ type: InteractionType.MessageComponent }) as never);
  });
});

describe('messageCreate', () => {
  const channel = (parentId: string | null) => stubInstance<TextChannel>(TextChannel, {
    parent: parentId === null ? null : { id: parentId },
  });
  const msg = (over: Record<string, unknown> = {}) => ({
    guild: { id: e.DISCORD_GUILD_ID },
    author: { id: 'a', bot: false },
    member: { roles: { cache: new Set<string>() } },
    channel: channel('some-category'),
    ...over,
  });

  beforeEach(() => { dbMock.users.upsert.mockResolvedValue({ discord_bot_ban: false } as never); });

  it('runs every handler for human messages in tripsit', async () => {
    const m = msg();
    await messageCreate.execute(m as never);
    [mocks.messageCommand, mocks.bridgeMessage, mocks.relayDiscordMessage, mocks.countMessage, mocks.youAre, mocks.karma,
      mocks.helperActivity, mocks.nightsWatch, mocks.announcements].forEach(fn => expect(fn).toHaveBeenCalledWith(m));
    expect(mocks.experience).toHaveBeenCalledWith(m.member, 'GENERAL', 'TEXT', m.channel);
  });

  it.each([
    [e.CATEGORY_TEAMTRIPSIT, 'TEAM'], [e.CATEGORY_DEVELOPMENT, 'DEVELOPER'], [e.CATEGORY_HARMREDUCTIONCENTRE, 'TRIPSITTER'],
    [e.CATEGORY_GATEWAY, 'IGNORED'], [null, 'IGNORED'],
  ])('awards %s channel xp as %s', async (parent, category) => {
    await messageCreate.execute(msg({ channel: channel(parent) }) as never);
    expect(mocks.experience).toHaveBeenCalledWith(expect.anything(), category, 'TEXT', expect.anything());
  });

  it('skips xp for members with ignored roles, non-members and non-text channels', async () => {
    await messageCreate.execute(msg({ member: { roles: { cache: new Set([e.ROLE_MUTED]) } } }) as never);
    await messageCreate.execute(msg({ member: null }) as never);
    await messageCreate.execute(msg({ channel: {} }) as never);
    await messageCreate.execute(msg({ guild: null }) as never);
    expect(mocks.experience).not.toHaveBeenCalled();
    expect(mocks.announcements).toHaveBeenCalledTimes(4);
  });

  it('stops early for other guilds, banned users and bots', async () => {
    await messageCreate.execute(msg({ guild: { id: 'other' } }) as never);
    expect(mocks.countMessage).not.toHaveBeenCalled();
    dbMock.users.upsert.mockResolvedValue({ discord_bot_ban: true } as never);
    await messageCreate.execute(msg() as never);
    dbMock.users.upsert.mockResolvedValue({ discord_bot_ban: false } as never);
    await messageCreate.execute(msg({ author: { id: 'b', bot: true } }) as never);
    expect(mocks.countMessage).not.toHaveBeenCalled();
    expect(mocks.messageCommand).toHaveBeenCalledTimes(3);
  });
});

describe('voiceStateUpdate', () => {
  const auditSend = { send: vi.fn() };
  const state = (over: Record<string, unknown> = {}) => ({
    guild: { id: e.DISCORD_GUILD_ID, channels: { fetch: vi.fn(async () => auditSend) } },
    member: { displayName: 'Ally', user: { bot: false } },
    channel: null,
    channelId: null,
    ...over,
  });
  const chan = (name: string) => ({ name });

  it('logs joins, leaves and moves', async () => {
    const join = state({ channel: chan('Lounge'), channelId: 'l' });
    await voiceStateUpdate.execute(state() as never, join as never);
    expect(auditSend.send).toHaveBeenLastCalledWith('Ally joined Lounge');
    const left = state({ channel: chan('Lounge') });
    await voiceStateUpdate.execute(left as never, state() as never);
    expect(auditSend.send).toHaveBeenLastCalledWith('Ally left Lounge');
    await voiceStateUpdate.execute(state({ channel: chan('A') }) as never, state({ channel: chan('B'), channelId: 'b' }) as never);
    expect(auditSend.send).toHaveBeenLastCalledWith('Ally left A and joined B');
    expect(mocks.updateTentStatus).toHaveBeenCalledTimes(3 + 1);
    expect(mocks.teardownTent).toHaveBeenCalled();
  });

  it('pitches a tent when someone joins the campfire', async () => {
    const campfire = state({ channel: chan('Campfire'), channelId: e.CHANNEL_CAMPFIRE });
    const old = state();
    await voiceStateUpdate.execute(old as never, campfire as never);
    expect(mocks.pitchTent).toHaveBeenCalledWith(old, campfire);
    expect(mocks.teardownTent).not.toHaveBeenCalled();
  });

  it('does not log when the channel did not change', async () => {
    const same = chan('Lounge');
    await voiceStateUpdate.execute(state({ channel: same }) as never, state({ channel: same }) as never);
    expect(mocks.logTent).not.toHaveBeenCalled();
    expect(mocks.teardownTent).toHaveBeenCalled();
  });

  it('ignores other guilds and bots', async () => {
    await voiceStateUpdate.execute(state() as never, state({ guild: { id: 'other' } }) as never);
    await voiceStateUpdate.execute(state() as never, state({ member: { user: { bot: true } } }) as never);
    await voiceStateUpdate.execute(state({ member: { user: { bot: true } } }) as never, state() as never);
    expect(auditSend.send).not.toHaveBeenCalled();
  });
});

describe('selectMenu', () => {
  const menu = (customId: string, kind: 'string' | 'user' | 'channel' = 'string') => ({
    customId,
    user: { id: 'u1' },
    deferUpdate: vi.fn(),
    editReply: vi.fn(),
    update: vi.fn(),
    isStringSelectMenu: () => kind === 'string',
    isUserSelectMenu: () => kind === 'user',
    isChannelSelectMenu: () => kind === 'channel',
  });

  it.each([
    ['modHistory1', () => mocks.modHistoryButton], ['helpSelectMenu', () => mocks.helpMenu],
    ['applicationReject1', () => mocks.applicationReject], ['applicationRoleSelectMenu', () => mocks.applicationStart],
  ])('routes %s', async (id, handler) => {
    await selectMenu(menu(id) as never);
    expect(handler()).toHaveBeenCalled();
  });

  it('routes AI menus for string and channel selects', async () => {
    mocks.aiMenu.mockResolvedValue({ content: 'ai' });
    const s = menu('AIsettings');
    await selectMenu(s as never);
    expect(s.update).toHaveBeenCalledWith({ content: 'ai' });
    const c = menu('AIchannel', 'channel');
    await selectMenu(c as never);
    expect(c.update).toHaveBeenCalled();
    await selectMenu(menu('other', 'channel') as never);
  });

  it('only lets the owner use RPG menus', async () => {
    const other = menu('rpgGeneralSelect-someone-else');
    await selectMenu(other as never);
    expect(other.deferUpdate).not.toHaveBeenCalled();
    mocks.rpgMarketChange.mockResolvedValue('market');
    const general = menu('rpgGeneralSelect-u1');
    await selectMenu(general as never);
    expect(general.editReply).toHaveBeenCalledWith('market');
    mocks.rpgHome.mockResolvedValue('home');
    const background = menu('rpgBackgroundSelect-u1');
    await selectMenu(background as never);
    expect(background.editReply).toHaveBeenCalledWith('home');
    await selectMenu(menu('rpgOther-u1') as never);
  });

  it('routes the purge user menu', async () => {
    await selectMenu(menu('purgeUsers', 'user') as never);
    expect(mocks.purgeMenu).toHaveBeenCalled();
    await selectMenu(menu('other', 'user') as never);
    expect(mocks.purgeMenu).toHaveBeenCalledTimes(1);
  });
});

describe('modalSubmit', () => {
  it('refreshes AI settings for AI modals only', async () => {
    mocks.userSettings.mockResolvedValue({ content: 'settings' });
    const ai = { customId: 'AIname', editReply: vi.fn() };
    await modalSubmit(ai as never);
    expect(ai.editReply).toHaveBeenCalledWith({ content: 'settings' });
    const other = { customId: 'reportModal', editReply: vi.fn() };
    await modalSubmit(other as never);
    expect(other.editReply).not.toHaveBeenCalled();
  });
});

describe('ready', () => {
  const original = { env: e.NODE_ENV };
  afterEach(() => { e.NODE_ENV = original.env; vi.useRealTimers(); vi.restoreAllMocks(); });

  const stats = {
    driveUsage: 40,
    memUsage: 50,
    cpuUsage: 10,
    guildCount: 2,
    channelCount: 3,
    userCount: 4,
    commandCount: 5,
    ping: 6,
    uptime: 60_000,
    netDown: 1,
    netUp: 2,
    cpuCount: 4,
    memTotal: 1000,
    driveTotal: 500,
    tsDbSize: 10,
    tsPwDbSize: 20,
    hostUptime: 3_600_000,
  };

  async function boot(env: string, permitted = true) {
    vi.useFakeTimers({ toFake: ['Date'] });
    e.NODE_ENV = env;
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const send = vi.fn();
    setClient({
      guilds: { fetch: vi.fn(async () => ({ name: 'Host' })), cache: new Map() },
      channels: { fetch: vi.fn(async () => ({ send })) },
      users: { fetch: vi.fn(async () => '<@owner>') },
    });
    (global as unknown as { bootTime: Date }).bootTime = new Date(Date.now() - 5000);
    mocks.checkGuild.mockResolvedValue(permitted ? { hasPermission: true } : { hasPermission: false, permission: 'ViewChannel' });
    mocks.botStats.mockResolvedValue(stats);
    mocks.fact.mockResolvedValue('a fun fact');
    await ready.execute({ guilds: { fetch: vi.fn(), cache: new Map() } } as never);
    await flushPromises();
    vi.useRealTimers();
    return { send, exit };
  }

  it('starts services and posts the boot report outside development', async () => {
    const { send } = await boot('production');
    expect(mocks.emojiCache).toHaveBeenCalled();
    expect(mocks.runTimer).toHaveBeenCalled();
    const report = send.mock.calls[0][0] as string;
    expect(report).toContain('rebooted in 5 seconds');
    expect(report).toContain('Guilds:');
    expect(report).toContain('a fun fact');
  });

  it('stays quiet in development', async () => {
    const { send } = await boot('development');
    expect(mocks.runTimer).toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('exits when the bot lacks required permissions', async () => {
    const { exit } = await boot('development', false);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('caches invite uses for the home guild only, when permitted', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    e.NODE_ENV = 'development';
    setClient({
      guilds: { fetch: vi.fn(async () => ({ name: 'Host' })), cache: new Map() },
      channels: { fetch: vi.fn() },
      users: { fetch: vi.fn() },
    });
    (global as unknown as { bootTime: Date }).bootTime = new Date();
    mocks.checkGuild.mockResolvedValue({ hasPermission: true });
    mocks.ensure.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const invites = new Collection([['abc', { code: 'abc', uses: 3 }]]);
    const home = { id: e.DISCORD_GUILD_ID, invites: { fetch: vi.fn(async () => invites) } };
    const other = { id: 'other', invites: { fetch: vi.fn() } };
    const client = { guilds: { fetch: vi.fn(), cache: new Collection([[home.id, home], ['other', other]]) } };
    await ready.execute(client as never);
    await flushPromises();
    vi.useRealTimers();
    expect((global as unknown as { guildInvites: Collection<string, Collection<string, number>> }).guildInvites.get(home.id)?.get('abc')).toBe(3);
    expect(other.invites.fetch).not.toHaveBeenCalled();
  });

  it('skips invites when the bot cannot manage the guild', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    e.NODE_ENV = 'development';
    setClient({ guilds: { fetch: vi.fn(async () => ({ name: 'Host' })), cache: new Map() }, channels: { fetch: vi.fn() }, users: { fetch: vi.fn() } });
    (global as unknown as { bootTime: Date }).bootTime = new Date();
    mocks.checkGuild.mockResolvedValue({ hasPermission: true });
    mocks.ensure.mockResolvedValue(false);
    const home = { id: e.DISCORD_GUILD_ID, invites: { fetch: vi.fn() } };
    await ready.execute({ guilds: { fetch: vi.fn(), cache: new Collection([[home.id, home]]) } } as never);
    await flushPromises();
    vi.useRealTimers();
    expect(home.invites.fetch).not.toHaveBeenCalled();
  });

  it('exposes the once-only clientReady event', () => {
    expect(ready).toMatchObject({ name: 'clientReady', once: true });
  });
});

describe('small utils', () => {
  it('populateBans loads banned users', async () => {
    botBannedUsers.length = 0;
    dbMock.users.findMany.mockResolvedValue([{ discord_id: 'a' }, { discord_id: null }, { discord_id: 'b' }] as never);
    const actual = await vi.importActual<typeof import('../../utils/populateBotBans')>('../../utils/populateBotBans');
    await actual.populateBans();
    expect(botBannedUsers).toEqual(['a', 'b']);
  });

  it('sleep resolves after the delay', async () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const p = sleep(500).then(done);
    await vi.advanceTimersByTimeAsync(499);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('imagesOnly', () => {
  // The module is mocked above for the message pipeline; test the real implementation here.
  it('deletes text-only posts from non-mods in the memes channel', async () => {
    const { imagesOnly: real } = await vi.importActual<typeof import('../../utils/imagesOnly')>('../../utils/imagesOnly');
    const make = (over: Record<string, unknown> = {}) => ({
      guild: { id: e.DISCORD_GUILD_ID, members: { fetch: vi.fn(async () => ({ roles: { cache: new Set(over.mod ? [e.ROLE_MODERATOR] : []) } })) } },
      channel: { id: over.channelId ?? e.CHANNEL_MEMES },
      author: { id: 'a' },
      embeds: over.embeds ?? [],
      attachments: { size: over.attachments ?? 0 },
      delete: vi.fn(),
      ...(over.guild !== undefined ? { guild: over.guild } : {}),
    });
    const text = make();
    await real(text as never);
    expect(text.delete).toHaveBeenCalled();
    for (const keep of [make({ mod: true }), make({ embeds: [1] }), make({ attachments: 1 }), make({ channelId: 'other' }), make({ guild: null }), make({ guild: { id: 'x' } })]) {
      // eslint-disable-next-line no-await-in-loop
      await real(keep as never);
      expect(keep.delete).not.toHaveBeenCalled();
    }
  });
});
