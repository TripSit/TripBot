import { ChannelType } from 'discord.js';
import { buttonClick } from '../../events/buttonClick';
import { messageDelete } from '../../events/messageDelete';
import { guildMemberRemove } from '../../events/guildMemberRemove';
import { guildBanAdd } from '../../events/guildBanAdd';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;

const h = vi.hoisted(() => {
  const handler = (name: string) => vi.fn((_i: unknown, ...args: unknown[]) => `${name}:${args.join('|')}`);
  return {
    context: vi.fn(),
    applicationApprove: vi.fn(),
    tripsitmeButton: vi.fn(),
    tripsitmeOwned: vi.fn(),
    tripsitmeMeta: vi.fn(),
    tripsitmeBackup: vi.fn(),
    tripsitmeTeamClose: vi.fn(),
    tripsitmeUserClose: vi.fn(),
    techHelpClick: vi.fn(),
    techHelpClose: vi.fn(),
    techHelpOwn: vi.fn(),
    verifyButton: vi.fn(),
    buttonReactionRole: vi.fn(),
    prReviewButton: vi.fn(),
    helperButton: vi.fn(),
    acknowledgeButton: vi.fn(),
    modModal: vi.fn(),
    refusalButton: vi.fn(),
    modHistoryButton: vi.fn(),
    feedbackReportModal: vi.fn(),
    aiButton: vi.fn(),
    purgeButton: vi.fn(),
    mushroomPageEmbed: vi.fn(),
    rpg: Object.fromEntries([
      'rpgTown', 'rpgBounties', 'rpgArcade', 'rpgArcadeGame', 'rpgArcadeWager', 'rpgHelp', 'rpgHome', 'rpgHomeAccept',
      'rpgHomeDecline', 'rpgHomeSell', 'rpgMarket', 'rpgMarketAccept', 'rpgMarketPreview', 'rpgFlairAccept', 'rpgFlairDecline',
    ].map(name => [name, handler(name)])) as Record<string, ReturnType<typeof vi.fn>>,
    rpgHomeNameChange: vi.fn(),
    ensure: vi.fn(),
    relayDelete: vi.fn(),
  };
});

vi.mock('../../utils/context', () => ({ default: h.context }));
vi.mock('../../utils/application', () => ({ applicationApprove: h.applicationApprove, applicationStart: vi.fn(), applicationReject: vi.fn() }));
vi.mock('../../utils/tripsitme', () => ({
  tripsitmeButton: h.tripsitmeButton,
  tripsitmeOwned: h.tripsitmeOwned,
  tripsitmeMeta: h.tripsitmeMeta,
  tripsitmeBackup: h.tripsitmeBackup,
  tripsitmeTeamClose: h.tripsitmeTeamClose,
  tripsitmeUserClose: h.tripsitmeUserClose,
}));
vi.mock('../../utils/techHelp', () => ({ techHelpClick: h.techHelpClick, techHelpClose: h.techHelpClose, techHelpOwn: h.techHelpOwn }));
vi.mock('../../utils/verifyButton', () => ({ verifyButton: h.verifyButton }));
vi.mock('../../commands/global/d.reactionRole', () => ({ buttonReactionRole: h.buttonReactionRole }));
vi.mock('../../commands/global/d.prReview', () => ({ prReviewButton: h.prReviewButton }));
vi.mock('../../commands/guild/d.rpg', () => ({ ...h.rpg, rpgHomeNameChange: h.rpgHomeNameChange }));
vi.mock('../../commands/global/d.setup', () => ({ helperButton: h.helperButton }));
vi.mock('../../utils/modUtils', () => ({ acknowledgeButton: h.acknowledgeButton, modModal: h.modModal, refusalButton: h.refusalButton }));
vi.mock('../../utils/modHistory', () => ({ modHistoryButton: h.modHistoryButton }));
vi.mock('../../commands/global/d.feedback', () => ({ feedbackReportModal: h.feedbackReportModal }));
vi.mock('../../commands/global/d.ai', () => ({ aiButton: h.aiButton }));
vi.mock('../../commands/guild/d.purge', () => ({ purgeButton: h.purgeButton }));
vi.mock('../../utils/hrUtils', () => ({ mushroomPageEmbed: h.mushroomPageEmbed }));
vi.mock('../../utils/checkPermissions', () => ({ ensurePermissions: h.ensure }));
vi.mock('../../utils/chatBridge', () => ({ relayDiscordDelete: h.relayDelete }));

beforeEach(() => { h.context.mockResolvedValue('ctx'); });

function click(customId: string) {
  return {
    customId, user: { id: 'u1' }, deferUpdate: vi.fn(), editReply: vi.fn(), update: vi.fn(), reply: vi.fn(),
  };
}

describe('buttonClick routing', () => {
  const client = (command?: { execute: () => unknown }) => ({ commands: { get: vi.fn(() => command) } }) as never;

  it.each([
    ['feedbackReportX', () => h.feedbackReportModal], ['AIsettings', () => h.aiButton], ['purgeAll', () => h.purgeButton],
    ['modHistoryNext', () => h.modHistoryButton], ['moderateUser', () => h.modModal], ['acknowledgeButton', () => h.acknowledgeButton],
    ['refusalButton', () => h.refusalButton], ['helperButton', () => h.helperButton], ['"ID":"RR"x', () => h.buttonReactionRole],
    ['"ID":"PR"x', () => h.prReviewButton], ['tripsitmeClick', () => h.tripsitmeButton], ['tripsitmeOwned', () => h.tripsitmeOwned],
    ['tripsitmeTeamClose', () => h.tripsitmeTeamClose], ['tripsitmeUserClose', () => h.tripsitmeUserClose],
    ['tripsitmeMeta', () => h.tripsitmeMeta], ['tripsitmeBackup', () => h.tripsitmeBackup],
    ['applicationApprove', () => h.applicationApprove], ['techHelpOwn', () => h.techHelpOwn],
    ['techHelpClose', () => h.techHelpClose], ['techHelpClick', () => h.techHelpClick], ['memberButton', () => h.verifyButton],
  ])('routes %s', async (customId, handler) => {
    await buttonClick(click(customId) as never, client());
    expect(handler()).toHaveBeenCalled();
  });

  it('switches mushroom pages and ignores other mushroom buttons', async () => {
    h.mushroomPageEmbed.mockResolvedValue({ embeds: [] });
    const one = click('mushroomPageOne');
    await buttonClick(one as never, client());
    expect(h.mushroomPageEmbed).toHaveBeenCalledWith(1);
    expect(one.update).toHaveBeenCalled();
    await buttonClick(click('mushroomPageTwo') as never, client());
    expect(h.mushroomPageEmbed).toHaveBeenCalledWith(2);
    await buttonClick(click('mushroomOther') as never, client());
    expect(h.mushroomPageEmbed).toHaveBeenCalledTimes(2);
  });

  it('falls back to command buttons, or ignores unknown ids', async () => {
    const execute = vi.fn();
    const i = click('somecommand');
    await buttonClick(i as never, client({ execute }));
    expect(execute).toHaveBeenCalledWith(i);
    await buttonClick(click('nothing') as never, client());
  });

  it('reports synchronous command failures to the user', async () => {
    const i = click('somecommand');
    await buttonClick(i as never, client({ execute: () => { throw new Error('boom'); } }));
    expect(i.reply).toHaveBeenCalledWith({ content: 'There was an error while executing this command!' });
  });
});

describe('buttonClick rpg routing', () => {
  const cases: Array<[string, string, ...unknown[]]> = [
    ['rpgTown', 'rpgTown'], ['rpgBounties', 'rpgBounties', null], ['rpgArcade', 'rpgArcade'], ['rpgHelp', 'rpgHelp'],
    ['rpgWager500', 'rpgArcadeWager'], ['rpgWager1000', 'rpgArcadeWager'],
    ['rpgCoinFlip', 'rpgArcadeGame', 'Coinflip'], ['rpgCoinflipHeads', 'rpgArcadeGame', 'Coinflip', 'heads'],
    ['rpgCoinflipTails', 'rpgArcadeGame', 'Coinflip', 'tails'], ['rpgRoulette', 'rpgArcadeGame', 'Roulette'],
    ['rpgRouletteRed', 'rpgArcadeGame', 'Roulette', 'red'], ['rpgRouletteBlack', 'rpgArcadeGame', 'Roulette', 'black'],
    ['rpgRouletteFirst', 'rpgArcadeGame', 'Roulette', 'first'], ['rpgRouletteSecond', 'rpgArcadeGame', 'Roulette', 'second'],
    ['rpgRouletteThird', 'rpgArcadeGame', 'Roulette', 'third'], ['rpgRouletteOdd', 'rpgArcadeGame', 'Roulette', 'odds'],
    ['rpgRouletteEven', 'rpgArcadeGame', 'Roulette', 'evens'], ['rpgRoulette1to12', 'rpgArcadeGame', 'Roulette', '1-12'],
    ['rpgRoulette13to24', 'rpgArcadeGame', 'Roulette', '13-24'], ['rpgRoulette25to36', 'rpgArcadeGame', 'Roulette', '25-36'],
    ['rpgRouletteHigh', 'rpgArcadeGame', 'Roulette', 'high'], ['rpgRouletteLow', 'rpgArcadeGame', 'Roulette', 'low'],
    ['rpgRouletteZero', 'rpgArcadeGame', 'Roulette', '0'],
    ['rpgHome', 'rpgHome', ''], ['rpgHomePreview', 'rpgHome', ''], ['rpgSpecies', 'rpgHome', ''], ['rpgClass', 'rpgHome', ''],
    ['rpgGuild', 'rpgHome', ''], ['rpgAccept', 'rpgHomeAccept'], ['rpgDecline', 'rpgHomeDecline'], ['rpgSell', 'rpgHomeSell'],
    ['rpgFlairAccept', 'rpgFlairAccept', ''], ['rpgFlairDecline', 'rpgFlairDecline'],
    ['rpgMarketBuy', 'rpgMarketAccept'], ['rpgMarketPreview', 'rpgMarketPreview'], ['rpgMarket', 'rpgMarket'],
    ['rpgQuest', 'rpgBounties', 'quest'], ['rpgDungeon', 'rpgBounties', 'dungeon'], ['rpgRaid', 'rpgBounties', 'raid'],
  ];

  it.each(cases)('%s -> %s', async (id, handler, ...args) => {
    const i = click(`${id},u1`);
    await buttonClick(i as never, { commands: { get: vi.fn() } } as never);
    expect(i.deferUpdate).toHaveBeenCalled();
    expect(i.editReply).toHaveBeenCalledWith(`${handler}:${args.join('|')}`);
  });

  it('opens the name modal without editing the reply', async () => {
    const i = click('rpgName,u1');
    await buttonClick(i as never, { commands: { get: vi.fn() } } as never);
    expect(h.rpgHomeNameChange).toHaveBeenCalledWith(i);
    expect(i.editReply).not.toHaveBeenCalled();
  });

  it('ignores clicks from other users and unknown rpg buttons', async () => {
    const other = click('rpgTown,someone-else');
    await buttonClick(other as never, { commands: { get: vi.fn() } } as never);
    expect(other.deferUpdate).not.toHaveBeenCalled();
    const unknown = click('rpgMystery,u1');
    await buttonClick(unknown as never, { commands: { get: vi.fn() } } as never);
    expect(unknown.editReply).not.toHaveBeenCalled();
  });
});

describe('messageDelete', () => {
  const author = { id: 'author', username: 'alice' };
  const entry = (over: Record<string, unknown> = {}) => ({
    target: { id: 'author' }, createdTimestamp: Date.now() + 10_000, executor: { id: 'mod' }, ...over,
  });

  function setup(over: { log?: unknown; attachments?: Array<{ proxyURL: string }>; memberFails?: boolean; content?: string | null; author?: unknown; cached?: unknown } = {}) {
    const send = vi.fn();
    const fetchMember = over.memberFails ? vi.fn().mockRejectedValue(new Error('Unknown Member')) : vi.fn(async (id: string) => `<@${id}>`);
    const deleted = {
      id: 'm1',
      author: 'author' in over ? over.author : author,
      content: over.content === undefined ? 'secret' : over.content,
      attachments: collectionOf((over.attachments ?? []).map((a, i) => [`a${i}`, a] as [string, { proxyURL: string }])),
    };
    const message = {
      ...deleted,
      guild: {
        id: e.DISCORD_GUILD_ID,
        fetchAuditLogs: vi.fn(async () => ({ entries: { last: () => over.log } })),
        members: { fetch: fetchMember },
      },
      channel: { type: ChannelType.GuildText, name: 'lounge', messages: { cache: { get: vi.fn(() => over.cached) } } },
      client: { channels: { fetch: vi.fn(async () => ({ send })) } },
    };
    return { message, send, fetchMember };
  }

  beforeEach(() => { h.ensure.mockResolvedValue(true); });

  it('credits the author when no audit entry matches', async () => {
    const { message, send, fetchMember } = setup();
    await messageDelete.execute(message as never);
    expect(h.relayDelete).toHaveBeenCalled();
    expect(fetchMember).toHaveBeenCalledWith('author');
    const [{ embeds }] = send.mock.calls[0];
    expect(embeds[0].data.description).toContain('deleted message in lounge');
    expect(embeds[0].data.fields[0]).toMatchObject({ name: 'alice', value: 'secret' });
  });

  it('credits the moderator when a fresh audit entry matches', async () => {
    const { message, fetchMember } = setup({ log: entry() });
    await messageDelete.execute(message as never);
    expect(fetchMember).toHaveBeenCalledWith('mod');
  });

  it.each([
    ['another target', { target: { id: 'someone-else' } }], ['a stale entry', { createdTimestamp: 1 }],
    ['no executor', { executor: null }], ['no target', { target: null }],
  ])('ignores audit entries with %s', async (_label, over) => {
    const { message, fetchMember } = setup({ log: entry(over) });
    await messageDelete.execute(message as never);
    expect(fetchMember).toHaveBeenCalledWith('author');
  });

  it('omits the field for empty messages and posts once per attachment', async () => {
    const empty = setup({ content: '' });
    await messageDelete.execute(empty.message as never);
    expect(empty.send.mock.calls[0][0].embeds[0].data.fields).toBeUndefined();
    const withFiles = setup({ attachments: [{ proxyURL: 'https://a' }, { proxyURL: 'https://b' }] });
    await messageDelete.execute(withFiles.message as never);
    await new Promise(resolve => { setImmediate(resolve); });
    expect(withFiles.send).toHaveBeenCalledTimes(2);
  });

  it('recovers partial messages from the cache and gives up when they are gone', async () => {
    const cached = { author, content: 'cached text', attachments: collectionOf<{ proxyURL: string }>({}) };
    const recovered = setup({ author: null, cached });
    await messageDelete.execute(recovered.message as never);
    expect(recovered.send).toHaveBeenCalled();
    const gone = setup({ author: null, cached: undefined });
    await messageDelete.execute(gone.message as never);
    expect(gone.send).not.toHaveBeenCalled();
  });

  it('stops when permissions are missing or the executor left', async () => {
    h.ensure.mockResolvedValueOnce(false);
    const noChannel = setup();
    await messageDelete.execute(noChannel.message as never);
    h.ensure.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const noAudit = setup();
    await messageDelete.execute(noAudit.message as never);
    const left = setup({ memberFails: true });
    await messageDelete.execute(left.message as never);
    [noChannel, noAudit, left].forEach(s => expect(s.send).not.toHaveBeenCalled());
  });

  it('ignores DMs, other guilds and non-text channels', async () => {
    const base = setup().message;
    await messageDelete.execute({ ...base, guild: null } as never);
    await messageDelete.execute({ ...base, guild: { ...base.guild, id: 'other' } } as never);
    await messageDelete.execute({ ...base, channel: { ...base.channel, type: ChannelType.GuildVoice } } as never);
    expect(h.ensure).not.toHaveBeenCalled();
    expect(h.relayDelete).toHaveBeenCalledTimes(3);
  });
});

describe('guildMemberRemove', () => {
  afterEach(() => vi.useRealTimers());
  const DAY = 86_400_000;

  function setup(joinedAgo: number | null, opts: { modThread?: string | null; threadFails?: boolean; modLog?: string | null } = {}) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    const thread = { send: vi.fn(), setName: vi.fn() };
    const modLogSend = vi.fn();
    (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => ({ send: modLogSend })) } };
    dbMock.users.upsert.mockResolvedValue({ mod_thread_id: opts.modThread === undefined ? null : opts.modThread } as never);
    dbMock.discord_guilds.upsert.mockResolvedValue({ channel_mod_log: opts.modLog === undefined ? null : opts.modLog } as never);
    const member = {
      id: 'm1',
      displayName: 'Ally',
      user: { tag: 'ally#1' },
      toString: (): string => '<@m1>',
      joinedTimestamp: joinedAgo === null ? null : Date.now() - joinedAgo,
      guild: {
        id: e.DISCORD_GUILD_ID,
        name: 'TripSit',
        channels: { fetch: opts.threadFails ? vi.fn().mockRejectedValue(new Error('gone')) : vi.fn(async () => thread) },
      },
    };
    return { member, thread, modLogSend };
  }

  it('reports how long members stayed, with proper pluralisation', async () => {
    const { member, modLogSend } = setup(400 * DAY + 3 * 3_600_000 + 61 * 1000, { modLog: 'log' });
    await guildMemberRemove.execute(member as never);
    const description = modLogSend.mock.calls[0][0].embeds[0].data.description as string;
    expect(description).toContain('has left the guild after 1 year, 1 month');
    expect(description).toContain('3 hours, 1 minute, 1 second');
  });

  it('pluralises larger counts and skips zero units', async () => {
    const { member, modLogSend } = setup(2 * 365 * DAY + 2 * 7 * DAY, { modLog: 'log' });
    await guildMemberRemove.execute(member as never);
    const description = modLogSend.mock.calls[0][0].embeds[0].data.description as string;
    expect(description).toContain('2 years, 2 weeks');
    expect(description).not.toContain('hour');
  });

  it('pluralises every unit and skips the ones that are zero', async () => {
    const plural = setup(2 * 30 * DAY + 2 * 7 * DAY + 2 * DAY + 2 * 3_600_000 + 2 * 60_000 + 2000, { modLog: 'log' });
    await guildMemberRemove.execute(plural.member as never);
    expect(plural.modLogSend.mock.calls[0][0].embeds[0].data.description)
      .toContain('2 months, 2 weeks, 2 days, 2 hours, 2 minutes, 2 seconds');
    const single = setup(30 * DAY + 7 * DAY + 3_600_000 + 60_000 + 1000, { modLog: 'log' });
    await guildMemberRemove.execute(single.member as never);
    expect(single.modLogSend.mock.calls[0][0].embeds[0].data.description).toContain('1 month, 1 week, 1 hour, 1 minute, 1 second');
  });

  it('falls back to the account tag when the member has no display name', async () => {
    const withJoin = setup(DAY, { modLog: 'log' });
    withJoin.member.displayName = '';
    await guildMemberRemove.execute(withJoin.member as never);
    expect(withJoin.modLogSend.mock.calls[0][0].embeds[0].data.description).toContain('(ally#1)');
    const noJoin = setup(null, { modLog: 'log' });
    noJoin.member.displayName = '';
    await guildMemberRemove.execute(noJoin.member as never);
    expect(noJoin.modLogSend.mock.calls[0][0].embeds[0].data.description).toContain('(ally#1)');
  });

  it('handles members with no join date', async () => {
    const { member, modLogSend } = setup(null, { modLog: 'log' });
    await guildMemberRemove.execute(member as never);
    expect(modLogSend.mock.calls[0][0].embeds[0].data.description).toBe('<@m1> (Ally) has left the guild');
  });

  it('updates the mod thread, tolerating deleted threads', async () => {
    const withThread = setup(DAY, { modThread: 't1' });
    await guildMemberRemove.execute(withThread.member as never);
    expect(withThread.thread.send).toHaveBeenCalled();
    expect(withThread.thread.setName).toHaveBeenCalledWith('🚶│Ally');
    expect(withThread.modLogSend).not.toHaveBeenCalled();
    const missing = setup(DAY, { modThread: 't1', threadFails: true });
    await guildMemberRemove.execute(missing.member as never);
    expect(missing.thread.send).not.toHaveBeenCalled();
  });

  it('ignores other guilds', async () => {
    const { member } = setup(DAY);
    await guildMemberRemove.execute({ ...member, guild: { ...member.guild, id: 'other' } } as never);
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });
});

describe('guildBanAdd', () => {
  it('logs the ban', async () => {
    await expect(guildBanAdd.execute({ user: 'bob' } as never)).resolves.toBeUndefined();
  });
});
