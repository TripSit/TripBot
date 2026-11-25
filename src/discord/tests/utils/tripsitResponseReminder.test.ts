import { Collection, Message } from 'discord.js';
import { user_tickets } from '@db/tripbot';
import {
  recordTripSitResponse, remindUnansweredTripSitTicket, tripSitReminderState, tripSitResponseDueAt,
} from '../../utils/tripsitResponseReminder';
import { dbMock } from '../../../vitest/utils/mockDb';
import { flushPromises } from '../../../vitest/utils/discordStubs';

const NOW = new Date('2030-01-01T12:05:00Z');
const START = new Date('2030-01-01T12:00:00Z');
const HELPER_ROLE = 'helper-role';
const FOLLOW_UP = [
  "Hey there <@requester>, we're sending out another alert.",
  "In the meantime, there are friends in #open-tripsit who may be able to help if you're okay talking in a group!",
].join(' ');
const ticket = (over: Partial<user_tickets> = {}): user_tickets => ({
  id: 'ticket',
  user_id: 'user',
  thread_id: 'help',
  meta_thread_id: null,
  first_message_id: 'first',
  type: 'TRIPSIT',
  status: 'OPEN',
  closed_by: null,
  closed_at: null,
  reopened_by: null,
  reopened_at: null,
  archived_at: new Date('2030-01-02'),
  deleted_at: new Date('2030-01-08'),
  created_at: START,
  response_due_at: NOW,
  responded_at: null,
  team_reminded_at: null,
  user_reminded_at: null,
  ...over,
});

function page(author = 'requester', count = 1, createdAt = NOW, bot = false, system = false) {
  return new Collection(Array.from({ length: count }, (_unused, i) => {
    const id = `message-${i}`;
    return [id, {
      id, author: { id: author, bot }, system, createdAt, createdTimestamp: createdAt.getTime(),
    } as Message];
  }));
}

function setup(over: Partial<user_tickets> = {}) {
  const data = ticket(over);
  const history = vi.fn().mockResolvedValue(new Collection());
  const thread = {
    id: 'help',
    guildId: 'guild',
    archived: false,
    locked: false,
    isThread: () => true,
    guild: { roles: { fetch: vi.fn(async (id: string) => ({ id })) } },
    messages: { fetch: history },
    send: vi.fn(),
  };
  const team = {
    guildId: 'guild', isSendable: () => true, isDMBased: () => false, send: vi.fn(),
  };
  const fetch = vi.fn(async (id: string) => (id === 'help' ? thread : team));
  (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch } };
  dbMock.users.findUnique.mockResolvedValue({ discord_id: 'requester' } as never);
  dbMock.discord_guilds.upsert.mockResolvedValue({
    role_helper: HELPER_ROLE, role_tripsitter: 'tripsitter-role', channel_tripsitmeta: 'meta',
  } as never);
  dbMock.user_tickets.findFirst.mockImplementation((async (args: { where: { response_due_at: Date } }) => (
    data.status === 'OPEN' && !data.responded_at
      && data.response_due_at?.getTime() === args.where.response_due_at.getTime()
      ? { team_reminded_at: data.team_reminded_at, user_reminded_at: data.user_reminded_at } : null
  )) as never);
  dbMock.user_tickets.updateMany.mockImplementation((async (args: {
    where: { response_due_at: Date }; data: Partial<user_tickets>;
  }) => {
    if (args.where.response_due_at.getTime() !== data.response_due_at?.getTime()) return { count: 0 };
    Object.assign(data, args.data);
    return { count: 1 };
  }) as never);
  return {
    data, thread, team, history, fetch,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

it('does not fetch a thread after retention cleared its reference', async () => {
  const { fetch } = setup({ thread_id: null });
  await remindUnansweredTripSitTicket(ticket({ thread_id: null }), NOW);
  expect(fetch).not.toHaveBeenCalled();
});

it('schedules the reminder five minutes after the request', () => {
  expect(tripSitResponseDueAt(START)).toEqual(NOW);
  expect(tripSitResponseDueAt()).toEqual(new Date(NOW.getTime() + 300000));
});

it('initializes reminder state only for open TRIPSIT requests', () => {
  expect(tripSitReminderState('TRIPSIT', 'OPEN', START)).toEqual({
    response_due_at: NOW, responded_at: null, team_reminded_at: null, user_reminded_at: null,
  });
  expect(tripSitReminderState('TRIPSIT', 'OPEN').response_due_at).toEqual(tripSitResponseDueAt());
  expect(tripSitReminderState('TRIPSIT', 'OWNED', START).response_due_at).toBeNull();
  expect(tripSitReminderState('TECH', 'OPEN', START).response_due_at).toBeNull();
});

it('sends one team alert and the requested user follow-up at the deadline', async () => {
  const s = setup();
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledWith(expect.objectContaining({
    content: expect.stringContaining('<@&helper-role> <@&tripsitter-role>'),
    allowedMentions: { parse: [], roles: [HELPER_ROLE, 'tripsitter-role'] },
    enforceNonce: true,
  }));
  expect(s.thread.send).toHaveBeenCalledWith(expect.objectContaining({
    content: FOLLOW_UP,
    allowedMentions: { parse: [], users: ['requester'] },
    enforceNonce: true,
  }));
  expect(s.data.team_reminded_at).toEqual(NOW);
  expect(s.data.user_reminded_at).toEqual(NOW);
  const { nonce } = s.team.send.mock.calls[0][0];
  expect(nonce).toHaveLength(24);
  expect(s.thread.send.mock.calls[0][0].nonce).not.toBe(nonce);
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledTimes(1);
  expect(s.thread.send).toHaveBeenCalledTimes(1);
});

it.each([
  { type: 'TECH' }, { status: 'OWNED' }, { status: 'PAUSED' }, { status: 'CLOSED' },
  { response_due_at: null }, { response_due_at: new Date(NOW.getTime() + 1) }, { responded_at: NOW },
  { team_reminded_at: NOW, user_reminded_at: NOW },
] as Partial<user_tickets>[])('ignores ineligible tickets: %j', async over => {
  const s = setup(over);
  await remindUnansweredTripSitTicket(s.data);
  expect(s.fetch).not.toHaveBeenCalled();
});

it('rechecks database state before looking up Discord data', async () => {
  const s = setup();
  dbMock.user_tickets.findFirst.mockResolvedValueOnce(null);
  await remindUnansweredTripSitTicket(s.data);
  expect(s.fetch).not.toHaveBeenCalled();
  expect(dbMock.users.findUnique).not.toHaveBeenCalled();
});

it.each([null, { discord_id: null }])('ignores an unavailable requester: %j', async user => {
  const s = setup();
  dbMock.users.findUnique.mockResolvedValueOnce(user as never);
  await remindUnansweredTripSitTicket(s.data);
  expect(s.fetch).not.toHaveBeenCalled();
});

it.each(['missing', 'other', 'archived', 'locked'])('ignores %s help threads', async kind => {
  const s = setup();
  if (kind === 'missing') s.fetch.mockResolvedValueOnce(null as never);
  if (kind === 'other') s.thread.isThread = () => false;
  if (kind === 'archived') s.thread.archived = true;
  if (kind === 'locked') s.thread.locked = true;
  await remindUnansweredTripSitTicket(s.data);
  expect(s.history).not.toHaveBeenCalled();
});

it('records a human response found during downtime instead of sending alerts', async () => {
  const s = setup();
  s.history.mockResolvedValue(page('helper'));
  await remindUnansweredTripSitTicket(s.data);
  expect(dbMock.user_tickets.updateMany).toHaveBeenCalledWith({
    where: { id: 'ticket', response_due_at: NOW, responded_at: null }, data: { responded_at: NOW },
  });
  expect(s.team.send).not.toHaveBeenCalled();
  expect(s.thread.send).not.toHaveBeenCalled();
});

it.each([
  ['requester', false, false], ['bot', true, false], ['system', false, true],
] as const)('does not treat %s messages as a human response', async (author, bot, system) => {
  const s = setup();
  s.history.mockResolvedValue(page(author, 1, NOW, bot, system));
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledTimes(1);
});

it('ignores responses from an earlier request cycle', async () => {
  const s = setup();
  s.history.mockResolvedValue(page('helper', 1, new Date(START.getTime() - 1)));
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledTimes(1);
});

it('paginates full history pages before concluding a request is unanswered', async () => {
  const s = setup();
  s.history.mockResolvedValueOnce(page('requester', 100)).mockResolvedValueOnce(page('helper'));
  await remindUnansweredTripSitTicket(s.data);
  expect(s.history).toHaveBeenNthCalledWith(2, { limit: 100, before: 'message-99' });
  expect(s.team.send).not.toHaveBeenCalled();
});

it('bounds history scans and permits retry after a scan failure', async () => {
  const s = setup();
  s.history.mockResolvedValue(page('requester', 100));
  await expect(remindUnansweredTripSitTicket(s.data)).rejects.toThrow('full help-thread response history');
  expect(s.history).toHaveBeenCalledTimes(10);
  expect(s.team.send).not.toHaveBeenCalled();
  s.history.mockResolvedValue(new Collection());
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledTimes(1);
});

it('prevents overlapping checks of the same ticket', async () => {
  const s = setup();
  let release!: (value: Collection<string, Message>) => void;
  s.history.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const first = remindUnansweredTripSitTicket(s.data);
  await flushPromises();
  await remindUnansweredTripSitTicket(s.data);
  release(new Collection());
  await first;
  expect(s.team.send).toHaveBeenCalledTimes(1);
});

it('retries only the user follow-up after the team alert succeeded', async () => {
  const s = setup();
  s.thread.send.mockRejectedValueOnce(new Error('unavailable'));
  await expect(remindUnansweredTripSitTicket(s.data)).rejects.toThrow('unavailable');
  expect(s.data.team_reminded_at).toEqual(NOW);
  expect(s.data.user_reminded_at).toBeNull();
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledTimes(1);
  expect(s.thread.send).toHaveBeenCalledTimes(2);
  expect(s.thread.send.mock.calls[0][0].nonce).toBe(s.thread.send.mock.calls[1][0].nonce);
});

it('does not reassure the user when the team alert fails', async () => {
  const s = setup();
  s.team.send.mockRejectedValueOnce(new Error('unavailable'));
  await expect(remindUnansweredTripSitTicket(s.data)).rejects.toThrow('unavailable');
  expect(s.data.team_reminded_at).toBeNull();
  expect(s.thread.send).not.toHaveBeenCalled();
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledTimes(2);
  expect(s.team.send.mock.calls[0][0].nonce).toBe(s.team.send.mock.calls[1][0].nonce);
});

it('rechecks responses after the history request completes', async () => {
  const s = setup();
  s.history.mockImplementationOnce(async () => { s.data.responded_at = NOW; return new Collection(); });
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).not.toHaveBeenCalled();
  expect(s.thread.send).not.toHaveBeenCalled();
});

it('does not repeat an alert another check completed during preparation', async () => {
  const s = setup();
  s.team.isSendable = () => { s.data.team_reminded_at = NOW; return true; };
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).not.toHaveBeenCalled();
  expect(s.thread.send).toHaveBeenCalledTimes(1);
});

it('does not repeat an already completed requester message', async () => {
  const s = setup();
  s.team.send.mockImplementationOnce(async () => { s.data.user_reminded_at = NOW; });
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledTimes(1);
  expect(s.thread.send).not.toHaveBeenCalled();
});

it('reuses the nonce if persisting a successful team delivery fails', async () => {
  const s = setup();
  dbMock.user_tickets.updateMany.mockRejectedValueOnce(new Error('database unavailable'));
  await expect(remindUnansweredTripSitTicket(s.data)).rejects.toThrow('database unavailable');
  expect(s.thread.send).not.toHaveBeenCalled();
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send.mock.calls[0][0].nonce).toBe(s.team.send.mock.calls[1][0].nonce);
  expect(s.thread.send).toHaveBeenCalledTimes(1);
});

it.each(['team', 'user'] as const)('does not complete a reopened request after an old %s delivery', async phase => {
  const s = setup();
  const reopenedDue = new Date(NOW.getTime() + 300000);
  const reopen = async () => {
    s.data.response_due_at = reopenedDue;
    s.data.team_reminded_at = null;
    s.data.user_reminded_at = null;
  };
  const send = phase === 'team' ? s.team.send : s.thread.send;
  send.mockImplementationOnce(reopen);
  await remindUnansweredTripSitTicket(s.data);
  expect(s.data.team_reminded_at).toBeNull();
  expect(s.data.user_reminded_at).toBeNull();
  vi.setSystemTime(reopenedDue);
  await remindUnansweredTripSitTicket(s.data);
  expect(s.data.team_reminded_at).toEqual(reopenedDue);
  expect(s.data.user_reminded_at).toEqual(reopenedDue);
  expect(s.team.send.mock.calls[0][0].nonce).not.toBe(s.team.send.mock.calls[1][0].nonce);
});

it('stops after a response arrives while preparing the alert', async () => {
  const s = setup();
  s.team.isSendable = () => { s.data.responded_at = NOW; return true; };
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).not.toHaveBeenCalled();
  expect(s.thread.send).not.toHaveBeenCalled();
});

it('stops user follow-up after a helper responds to the team alert', async () => {
  const s = setup();
  s.team.send.mockImplementationOnce(async () => { s.data.responded_at = NOW; });
  await remindUnansweredTripSitTicket(s.data);
  expect(s.team.send).toHaveBeenCalledTimes(1);
  expect(s.thread.send).not.toHaveBeenCalled();
});

it.each(['roles', 'channel', 'missing', 'unsendable', 'dm', 'guild'])('rejects invalid coordination: %s', async kind => {
  const s = setup();
  if (kind === 'roles') s.thread.guild.roles.fetch.mockResolvedValue(null as never);
  if (kind === 'channel') dbMock.discord_guilds.upsert.mockResolvedValue({ role_helper: HELPER_ROLE } as never);
  if (kind === 'missing') s.fetch.mockImplementation(async id => (id === 'help' ? s.thread : null) as never);
  if (kind === 'unsendable') s.team.isSendable = () => false;
  if (kind === 'dm') s.team.isDMBased = () => true;
  if (kind === 'guild') s.team.guildId = 'other';
  await expect(remindUnansweredTripSitTicket(s.data)).rejects.toThrow();
  expect(s.team.send).not.toHaveBeenCalled();
  expect(s.thread.send).not.toHaveBeenCalled();
});

it('uses a ticket-specific coordination thread and deduplicates role mentions', async () => {
  const s = setup({ meta_thread_id: 'ticket-meta' });
  dbMock.discord_guilds.upsert.mockResolvedValue({ role_helper: HELPER_ROLE, role_tripsitter: HELPER_ROLE } as never);
  await remindUnansweredTripSitTicket(s.data);
  expect(s.fetch).toHaveBeenCalledWith('ticket-meta');
  expect(s.team.send.mock.calls[0][0].allowedMentions.roles).toEqual([HELPER_ROLE]);
});

describe('response tracking', () => {
  const message = (over: Record<string, unknown> = {}) => ({
    guild: { id: 'guild' },
    author: { id: 'helper', bot: false },
    system: false,
    channel: { isThread: () => true },
    channelId: 'help',
    createdAt: NOW,
    ...over,
  } as Message);

  it.each([
    { guild: null }, { author: { id: 'bot', bot: true } }, { system: true }, { channel: { isThread: () => false } },
  ])('ignores non-human or non-thread messages: %j', async over => {
    await recordTripSitResponse(message(over));
    expect(dbMock.user_tickets.updateMany).not.toHaveBeenCalled();
  });

  it('only records another human for the current open TRIPSIT request', async () => {
    await recordTripSitResponse(message());
    expect(dbMock.user_tickets.updateMany).toHaveBeenCalledWith({
      where: {
        thread_id: 'help',
        type: 'TRIPSIT',
        status: 'OPEN',
        responded_at: null,
        response_due_at: { not: null, lte: new Date(NOW.getTime() + 300000) },
        users_user_tickets_user_idTousers: { discord_id: { not: 'helper' } },
      },
      data: { responded_at: NOW },
    });
  });
});
