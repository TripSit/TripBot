/* eslint-disable no-restricted-syntax, max-len, sonarjs/no-duplicate-string */
import { TextChannel } from 'discord.js';
import {
  counting, countingReset, countingScores, countingSetup, countMessage,
} from '../../commands/guild/d.counting';
import { slashStub } from '../../../vitest/utils/commandStubs';
import { collectionOf, stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({ missing: vi.fn(), sleep: vi.fn(), user: vi.fn() }));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../utils/checkPermissions', () => ({ missingPermission: mocks.missing }));
vi.mock('../../utils/sleep', () => ({ sleep: mocks.sleep }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateUser: mocks.user }));

const e = env as unknown as Record<string, string>;

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const row = (over: Row = {}): Row => ({
  current_number: 5,
  current_number_message_id: 'cm',
  current_number_message_date: new Date(),
  current_number_message_author: 'other',
  current_stakeholders: '',
  type: 'NORMAL',
  record_number: 0,
  last_number: null,
  ...over,
});

const channel = () => {
  const reply = {
    react: vi.fn(), delete: vi.fn(), author: { id: 'bot' }, id: 'msg',
  };
  return stubInstance<TextChannel>(TextChannel, {
    id: 'ch1', guild: { id: 'g1' }, send: vi.fn(async () => reply), messages: { fetch: vi.fn(async () => collectionOf({})) },
  });
};

describe('countingSetup', () => {
  beforeEach(() => {
    db.counting.findFirst = vi.fn().mockResolvedValue(null) as never;
    db.counting.upsert = vi.fn() as never;
  });

  it.each(['NORMAL', 'HARDCORE', 'TOKEN'] as const)('creates a %s game', async type => {
    const c = channel();
    expect(await countingSetup(c, type, 0, false, true)).toEqual({ content: 'Counting channel set up!' });
    expect(c.send).toHaveBeenCalledTimes(2);
    expect(db.counting.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ type }) }));
  });

  it('refuses to overwrite without override, and keeps history with it', async () => {
    db.counting.findFirst = vi.fn().mockResolvedValue(row({
      last_number: 3, last_number_message_id: 'l', last_number_broken_date: new Date(), last_number_message_author: 'a', last_number_broken_by: 'b', current_stakeholders: 'a,b',
    })) as never;
    const c = channel();
    const refused = await countingSetup(c, 'NORMAL', 0, false, true);
    expect(refused.embeds).toHaveLength(1);
    expect(c.send).not.toHaveBeenCalled();
    await countingSetup(c, 'NORMAL', 0, true, false);
    expect(db.counting.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ current_stakeholders: 'a,b', last_number: 3 }) }));
  });
});

describe('countingScores / countingReset', () => {
  const stubFor = (member: unknown) => slashStub({
    options: { number: 7, type: 'TOKEN', purge: true },
    channel: channel(),
    guild: { members: { fetch: vi.fn(async () => member) } },
    extra: { guildId: 'g1', channelId: 'ch1' },
  });

  it('scores handle missing, minimal and full data', async () => {
    db.counting.findFirst = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(row()).mockResolvedValueOnce(row({
      last_number: 3,
      last_number_message_id: 'l',
      last_number_message_date: new Date(),
      last_number_message_author: 'a',
      last_number_broken_by: 'b',
      last_number_broken_date: new Date(),
      record_number: 9,
      record_number_message_id: 'r',
      record_number_message_date: new Date(),
      record_number_message_author: 'a',
      record_number_broken_by: 'b',
      record_number_broken_date: new Date(),
    })) as never;
    expect(await countingScores(stubFor('MEMBER') as never)).toEqual({ content: 'This channel is not set up for counting!' });
    const basic = await countingScores(stubFor('MEMBER') as never);
    expect((basic.embeds as Array<{ data: { description: string } }>)[0].data.description).toContain('Current Combo');
    const full = await countingScores(stubFor(null) as never);
    const { description } = (full.embeds as Array<{ data: { description: string } }>)[0].data;
    expect(description).toContain('Last Combo');
    expect(description).toContain('Record Combo');
    expect(description).toContain('unknown');
  });

  it('reset reruns setup', async () => {
    db.counting.findFirst = vi.fn().mockResolvedValueOnce(null).mockResolvedValue(row()) as never;
    db.counting.upsert = vi.fn() as never;
    expect(await countingReset(stubFor('MEMBER') as never)).toEqual({ content: 'This channel is not set up for counting!' });
    const done = await countingReset(stubFor('MEMBER') as never);
    expect((done.embeds as Array<{ data: { title: string } }>)[0].data.title).toBe('Counting channel reset to 7!');
  });
});

describe('counting slash command', () => {
  beforeEach(() => {
    db.counting.findFirst = vi.fn().mockResolvedValue(null) as never;
    db.counting.upsert = vi.fn() as never;
  });

  it('setup and reset need ManageChannels', async () => {
    mocks.missing.mockResolvedValue('ManageChannels');
    for (const subcommand of ['setup', 'reset']) {
      const stub = slashStub({ subcommand, channel: channel() });
      // eslint-disable-next-line no-await-in-loop
      await counting.execute(stub as never);
      expect((stub.editReply.mock.calls[0][0] as { embeds: unknown[] }).embeds).toHaveLength(1);
    }
  });

  it('routes setup, scores, reset and unknown subcommands', async () => {
    mocks.missing.mockResolvedValue(null);
    const setup = slashStub({ subcommand: 'setup', channel: channel(), options: { type: 'TOKEN' } });
    await counting.execute(setup as never);
    expect(setup.editReply).toHaveBeenCalledWith({ content: 'Counting channel set up!' });
    const scores = slashStub({ subcommand: 'scores', channel: channel(), options: { ephemeral: true } });
    await counting.execute(scores as never);
    expect(scores.editReply).toHaveBeenCalledWith({ content: 'This channel is not set up for counting!' });
    const reset = slashStub({ subcommand: 'reset', channel: channel() });
    await counting.execute(reset as never);
    expect(reset.editReply).toHaveBeenCalled();
    const end = slashStub({ subcommand: 'end', channel: channel() });
    await counting.execute(end as never);
    expect(end.editReply).toHaveBeenCalledWith({ content: 'This command has not been setup yet!' });
  });
});

describe('countMessage', () => {
  const message = (content: string, over: Record<string, unknown> = {}) => {
    const chan = channel();
    return {
      guild: { id: e.DISCORD_GUILD_ID.toString(), members: { fetch: vi.fn(async () => ({ timeout: vi.fn() })) } },
      channel: chan,
      cleanContent: content,
      id: 'new',
      author: { id: 'me' },
      member: { displayName: 'Me' },
      reply: vi.fn(),
      react: vi.fn(),
      ...over,
    };
  };
  const data = (over: Row = {}) => { db.counting.findFirst = vi.fn().mockResolvedValue(row(over)) as never; };
  const saved = (): Row => (db.counting.upsert as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0].update;

  beforeEach(() => {
    db.counting.upsert = vi.fn() as never;
    db.personas.upsert = vi.fn() as never;
    mocks.user.mockResolvedValue({ id: 'dbu' });
    mocks.sleep.mockResolvedValue(undefined);
  });

  it('ignores DMs, other guilds, non-counting channels, non-numbers and non-text channels', async () => {
    await countMessage({ ...message('1'), guild: null } as never);
    await countMessage({ ...message('1'), guild: { id: 'other' } } as never);
    db.counting.findFirst = vi.fn().mockResolvedValue(null) as never;
    await countMessage(message('6') as never);
    data();
    await countMessage(message('hello') as never);
    await countMessage(message('6', { channel: { id: 'x' } }) as never);
    expect(db.counting.upsert).not.toHaveBeenCalled();
  });

  it('waits for a new game and stops self-counting', async () => {
    data({ current_number: -1 });
    const waiting = message('6');
    await countMessage(waiting as never);
    expect(waiting.reply).toHaveBeenCalledWith(expect.stringContaining('wait'));
    data({ current_number_message_author: 'me' });
    const self = message('6');
    await countMessage(self as never);
    expect(self.reply).toHaveBeenCalledWith(expect.stringContaining('yourself'));
  });

  it('limits the token game to one count per hour', async () => {
    data({ type: 'TOKEN' });
    const m = message('6');
    (m.channel.messages.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(collectionOf({ p: { author: { id: 'me' }, cleanContent: '4', createdTimestamp: Date.now() - 1000 } }));
    await countMessage(m as never);
    expect(m.reply).toHaveBeenCalledWith(expect.stringContaining('once every hour'));
  });

  it('looks at a user\'s most recent numeric message when several are in the last hour', async () => {
    data({ type: 'TOKEN' });
    const m = message('6');
    const mine = (ts: number) => ({ author: { id: 'me' }, cleanContent: '4', createdTimestamp: ts });
    (m.channel.messages.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(collectionOf({ old: mine(Date.now() - 20000), newer: mine(Date.now() - 1000), other: { author: { id: 'x' }, cleanContent: '1', createdTimestamp: Date.now() } }));
    await countMessage(m as never);
    expect(m.reply).toHaveBeenCalledWith(expect.stringContaining('once every hour'));
  });

  it('accepts the next number and welcomes new stakeholders', async () => {
    data();
    const first = message('6');
    await countMessage(first as never);
    expect(saved().current_number).toBe(6);
    expect(saved().current_stakeholders).toBe('me');
    expect(first.react).toHaveBeenCalledWith('👍');
    for (const type of ['NORMAL', 'TOKEN', 'HARDCORE']) {
      data({ type, current_stakeholders: 'xyz' });
      const m = message('6');
      // eslint-disable-next-line no-await-in-loop
      await countMessage(m as never);
      expect(m.channel.send).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Welcome to the counting game') }));
    }
    data({ current_stakeholders: 'me' });
    const returning = message('6');
    await countMessage(returning as never);
    expect(returning.channel.send).not.toHaveBeenCalled();
  });

  it('pays out the pot at multiples of ten in the token game', async () => {
    data({ type: 'TOKEN', current_number: 9, current_stakeholders: 'a,b' });
    const m = message('10');
    await countMessage(m as never);
    expect(db.personas.upsert).toHaveBeenCalledTimes(3);
    expect((m.channel.send as ReturnType<typeof vi.fn>).mock.calls.some(c => c[0].embeds?.[0]?.data?.title === 'Payday!')).toBe(true);
  });

  describe('wrong numbers', () => {
    it('first warns an unknown newcomer instead of breaking the combo', async () => {
      for (const type of ['NORMAL', 'TOKEN', 'HARDCORE']) {
        data({ type, current_stakeholders: 'a,b' });
        const m = message('99', { author: { id: `newcomer-${type}` } });
        // eslint-disable-next-line no-await-in-loop
        await countMessage(m as never);
        expect(m.channel.send).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("you're breaking the combo") }));
        expect(m.channel.send).toHaveBeenCalledTimes(1);
      }
    });

    it.each([
      ['NORMAL', 'point and laugh'], ['HARDCORE', 'timed out for 24 hours'], ['TOKEN', 'stole'],
    ])('breaks a %s combo, records and restarts', async (type, ending) => {
      data({
        type, current_number: 20, record_number: 5, current_stakeholders: '',
      });
      const m = message('99');
      await countMessage(m as never);
      const embedCalls = (m.channel.send as ReturnType<typeof vi.fn>).mock.calls.filter(c => c[0]?.embeds?.[0]?.data?.title === 'Combo Broken!');
      expect(embedCalls[0][0].embeds[0].data.description).toContain(ending);
      expect(embedCalls[0][0].embeds[0].data.description).toContain('new record of 20');
      expect(mocks.sleep).toHaveBeenCalledWith(10000);
      expect(db.counting.upsert).toHaveBeenCalled();
      if (type === 'TOKEN') expect(db.personas.upsert).toHaveBeenCalled();
    });

    it('does not announce a record when the old one stands', async () => {
      data({ current_number: 3, record_number: 10 });
      const m = message('99');
      await countMessage(m as never);
      const embed = (m.channel.send as ReturnType<typeof vi.fn>).mock.calls.find(c => c[0]?.embeds?.[0]?.data?.title === 'Combo Broken!');
      expect(embed?.[0].embeds[0].data.description).not.toContain('new record');
    });
  });
});
