import { createHash } from 'crypto';
import { Message, Role, ThreadChannel } from 'discord.js';
import { ticket_status, ticket_type, user_tickets } from '@db/tripbot';
import { getOrCreateGuild } from '../../global/utils/dbRecords';

const WAIT_MS = 5 * 60 * 1000;
const pending = new Set<string>();
type ReminderTicket = user_tickets & { response_due_at: Date };

export function tripSitResponseDueAt(startedAt = new Date()): Date {
  return new Date(startedAt.getTime() + WAIT_MS);
}

export function tripSitReminderState(ticketType: ticket_type, status: ticket_status, startedAt = new Date()) {
  return {
    response_due_at: ticketType === 'TRIPSIT' && status === 'OPEN' ? tripSitResponseDueAt(startedAt) : null,
    responded_at: null,
    team_reminded_at: null,
    user_reminded_at: null,
  };
}

export async function recordTripSitResponse(message: Message): Promise<void> {
  if (!message.guild || message.author.bot || message.system || !message.channel.isThread()) return;
  await db.user_tickets.updateMany({
    where: {
      thread_id: message.channelId,
      type: 'TRIPSIT',
      status: 'OPEN',
      responded_at: null,
      response_due_at: { not: null, lte: tripSitResponseDueAt(message.createdAt) },
      users_user_tickets_user_idTousers: { discord_id: { not: message.author.id } },
    },
    data: { responded_at: message.createdAt },
  });
}

function reminderState(ticket: ReminderTicket) {
  return db.user_tickets.findFirst({
    where: {
      id: ticket.id,
      type: 'TRIPSIT',
      status: 'OPEN',
      response_due_at: ticket.response_due_at,
      responded_at: null,
    },
    select: { team_reminded_at: true, user_reminded_at: true },
  });
}

async function findResponse(thread: ThreadChannel, userId: string, since: Date): Promise<Date | null> {
  let before: string | undefined;
  // Inspect author/time metadata only; help content is never copied to logs or storage.
  for (let page = 0; page < 10; page += 1) {
    const messages = await thread.messages.fetch({ limit: 100, before }); // eslint-disable-line no-await-in-loop
    const response = messages.find(message => message.createdTimestamp >= since.getTime()
      && !message.author.bot && !message.system && message.author.id !== userId);
    if (response) return response.createdAt;
    const oldest = messages.last();
    if (!oldest || oldest.createdTimestamp < since.getTime() || messages.size < 100) return null;
    before = oldest.id;
  }
  throw new Error('Could not verify the full help-thread response history');
}

function reminderNonce(ticket: ReminderTicket, phase: string): string {
  return createHash('sha256').update(`${ticket.id}:${ticket.response_due_at.toISOString()}:${phase}`)
    .digest('hex').slice(0, 24);
}

async function sendTeamReminder(ticket: ReminderTicket, thread: ThreadChannel, userId: string): Promise<void> {
  const guildData = await getOrCreateGuild(thread.guildId);
  const roleIds = [...new Set([guildData.role_helper, guildData.role_tripsitter]
    .filter((id): id is string => Boolean(id)))];
  const roles = await Promise.all(roleIds.map(id => thread.guild.roles.fetch(id)));
  const availableRoles = roles.filter((role): role is Role => role !== null).map(role => role.id);
  if (!availableRoles.length) throw new Error('No help-team roles configured for an unanswered request');
  const channelId = ticket.meta_thread_id ?? guildData.channel_tripsitmeta;
  if (!channelId) throw new Error('No coordination channel configured for an unanswered request');
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel?.isSendable() || channel.isDMBased() || channel.guildId !== thread.guildId) {
    throw new Error('The help coordination destination is unavailable or belongs to another guild');
  }
  const state = await reminderState(ticket);
  if (!state || state.team_reminded_at) return;
  const team = availableRoles.map(id => `<@&${id}>`).join(' ');
  await channel.send({
    content: `${team} <@${userId}> is still waiting for help in <#${thread.id}> after five minutes.`,
    allowedMentions: { parse: [], roles: availableRoles },
    nonce: reminderNonce(ticket, 'team'),
    enforceNonce: true,
  });
  await db.user_tickets.updateMany({
    where: { id: ticket.id, response_due_at: ticket.response_due_at },
    data: { team_reminded_at: new Date() },
  });
}

async function deliverReminders(ticket: ReminderTicket, thread: ThreadChannel, userId: string): Promise<void> {
  const state = await reminderState(ticket);
  if (!state) return;
  if (!state.team_reminded_at) await sendTeamReminder(ticket, thread, userId);
  const current = await reminderState(ticket);
  if (!current?.team_reminded_at || current.user_reminded_at) return;
  await thread.send({
    content: [
      `Hey there <@${userId}>, we're sending out another alert.`,
      "In the meantime, there are friends in #open-tripsit who may be able to help if you're okay talking in a group!",
    ].join(' '),
    allowedMentions: { parse: [], users: [userId] },
    nonce: reminderNonce(ticket, 'user'),
    enforceNonce: true,
  });
  await db.user_tickets.updateMany({
    where: { id: ticket.id, response_due_at: ticket.response_due_at },
    data: { user_reminded_at: new Date() },
  });
}

export async function remindUnansweredTripSitTicket(ticket: user_tickets, now = new Date()): Promise<void> {
  const due = ticket.response_due_at;
  if (ticket.type !== 'TRIPSIT' || ticket.status !== 'OPEN' || !due || due.getTime() > now.getTime()
    || ticket.responded_at || (ticket.team_reminded_at && ticket.user_reminded_at) || pending.has(ticket.id)) return;
  pending.add(ticket.id);
  try {
    const scheduled = { ...ticket, response_due_at: due };
    if (!(await reminderState(scheduled))) return;
    const user = await db.users.findUnique({ where: { id: ticket.user_id }, select: { discord_id: true } });
    if (!user?.discord_id) return;
    const thread = await discordClient.channels.fetch(ticket.thread_id);
    if (!thread?.isThread() || thread.archived || thread.locked) return;
    const responseAt = await findResponse(thread, user.discord_id, new Date(due.getTime() - WAIT_MS));
    if (responseAt) {
      await db.user_tickets.updateMany({
        where: { id: ticket.id, response_due_at: due, responded_at: null },
        data: { responded_at: responseAt },
      });
      return;
    }
    await deliverReminders(scheduled, thread, user.discord_id);
  } finally {
    pending.delete(ticket.id);
  }
}
