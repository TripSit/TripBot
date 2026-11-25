/* eslint-disable sonarjs/no-duplicate-string */
import type { Prisma } from '@db/tripbot';
import {
  privacy, pruneModerationActions, purgeInactiveUsers, SCRUBBED_LAST_SEEN,
} from '../../commands/g.privacy';
import { dbMock } from '../../../vitest/utils/mockDb';

type Upsert = Awaited<ReturnType<typeof dbMock.users.upsert>>;
const rows = (n: number) => Array.from({ length: n }, () => ({})) as never[];

function seed(user: object, doses = 0, exp = 0, reminders = 0, activeBans: object[] = []) {
  dbMock.users.upsert.mockResolvedValueOnce(user as unknown as Upsert);
  dbMock.user_drug_doses.findMany.mockResolvedValueOnce(rows(doses));
  dbMock.user_experience.findMany.mockResolvedValueOnce(rows(exp));
  dbMock.user_reminders.findMany.mockResolvedValueOnce(rows(reminders));
  dbMock.user_actions.findMany.mockResolvedValueOnce(activeBans as never);
}

beforeEach(() => {
  dbMock.discord_guilds.findMany.mockResolvedValue([]);
  dbMock.user_tickets.findMany.mockResolvedValue([]);
  dbMock.appeals.findMany.mockResolvedValue([]);
  dbMock.best_of.findMany.mockResolvedValue([]);
  dbMock.$transaction.mockImplementation(async callback => {
    if (typeof callback !== 'function') throw new Error('Expected an interactive transaction');
    return callback(dbMock);
  });
});
describe('privacy get', () => {
  it('lists stored fields while hiding ids and bans', async () => {
    seed({
      id: 'u',
      discord_id: '1',
      discord_bot_ban: true,
      ticket_ban: true,
      email: 'a@b.c',
      username: '',
      timezone: null,
      roles: 'x',
      mindset_role: 'm',
      mindset_role_expires_at: new Date(0),
    }, 1, 2, 3);
    const out = await privacy('get', '1');
    expect(out).toContain('**email**: a@b.c');
    expect(out).not.toContain('discord_bot_ban');
    expect(out).not.toContain('**id**');
    expect(out).not.toContain('**username**');
    expect(out).toContain('Roles are only stored');
    expect(out).toContain('Mindset role is only stored');
    expect(out).toContain('You have 1 Idose records');
    expect(out).toContain('You have 2 experience records');
    expect(out).toContain('You have 3 reminders');
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });

  it('serializes structured values instead of printing [object Object]', async () => {
    seed({ id: 'u', discord_id: '1', preferences: { theme: 'dark' } });
    expect(await privacy('get', '1')).toContain('**preferences**: {"theme":"dark"}');
  });

  it('is empty for a user with nothing stored', async () => {
    seed({ id: 'u', discord_id: '1' });
    expect(await privacy('get', '1')).toBe('');
  });

  it('reports stored ticket and appeal records', async () => {
    seed({ id: 'u', discord_id: '1' });
    dbMock.user_tickets.findMany.mockResolvedValueOnce([{ thread_id: 't', meta_thread_id: null }] as never);
    dbMock.appeals.findMany.mockResolvedValueOnce([{ id: 'a' }] as never);
    dbMock.best_of.findMany.mockResolvedValueOnce([{ message_id: 'best-of' }] as never);
    const out = await privacy('get', '1');
    expect(out).toContain('1 support ticket lifecycle records and any remaining Discord threads');
    expect(out).toContain('1 moderation appeal records');
    expect(out).toContain('1 saved messages in the Best Of archive');
  });
});

describe('privacy delete', () => {
  it('deletes the user row and related records', async () => {
    seed({
      id: 'u', discord_id: '1', email: 'a@b.c', roles: 'r',
    }, 1, 1, 1);
    const out = await privacy('delete', '1');
    expect(dbMock.users.delete).toHaveBeenCalledWith({ where: { id: 'u' } });
    expect(dbMock.user_drug_doses.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(dbMock.user_experience.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(dbMock.user_reminders.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(dbMock.watch_request.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ usersId: 'u' }, { caller_id: '1' }, { watched_user_id: '1' }] },
    });
    expect(dbMock.user_tickets.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(dbMock.appeals.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(out).toContain('I removed your TripBot profile data and feature data');
    expect(out).toContain('I deleted 1 Idose records');
    expect(out).toContain('I deleted 1 experience records');
    expect(out).toContain('I deleted 1 reminders');
    expect(out).toContain('aggregate totals');
    expect(out).toContain('moderation history');
    expect(out).not.toContain('a@b.c');
  });

  it('deletes quotes, scores, RPG data, linked accounts and moderation data', async () => {
    seed({
      id: 'u', discord_id: '1', lastfm_username: 'fm', irc_id: 'i', matrix_id: 'm', moodle_id: '7', password_hash: 'h',
    }, 0, 0, 0, [{ id: 'active-ban' }]);
    const out = await privacy('delete', '1');
    expect(dbMock.users.delete).toHaveBeenCalledWith({ where: { id: 'u' } });
    [dbMock.wordle_scores, dbMock.connections_scores, dbMock.mini_scores, dbMock.personas, dbMock.ai_info]
      .forEach(table => expect(table.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } }));
    expect(dbMock.quotes.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ user_id: 'u' }, { created_by: 'u' }] },
    });
    expect(dbMock.rpg_inventory.deleteMany).toHaveBeenCalledWith({ where: { personas: { user_id: 'u' } } });
    expect(dbMock.best_of.deleteMany).toHaveBeenCalledWith({ where: { user_id: '1' } });
    expect(dbMock.claimed_bounties.deleteMany).toHaveBeenCalledWith({ where: { user_id: '1' } });
    expect(dbMock.members.deleteMany).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(dbMock.user_actions.updateMany).toHaveBeenCalledWith({
      where: { created_by: 'u', NOT: { user_id: 'u' } },
      data: { created_by: null, internal_note: '', description: null },
    });
    expect(dbMock.user_actions.updateMany).toHaveBeenCalledWith({
      where: { OR: [{ repealed_by: 'u' }, { ban_evasion_related_user: 'u' }] },
      data: { repealed_by: null, ban_evasion_related_user: null },
    });
    expect(dbMock.user_actions.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ user_id: 'u' }, { target_discord_id: '1' }],
        type: 'FULL_BAN',
        expires_at: { not: null },
        repealed_at: null,
      },
      select: { id: true },
    });
    expect(dbMock.user_actions.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['active-ban'] } },
      data: expect.objectContaining({
        user_id: null, created_by: null, internal_note: '', description: null,
      }),
    });
    expect(dbMock.drug_articles.updateMany).toHaveBeenCalledWith({
      where: { OR: [{ posted_by: 'u' }, { last_modified_by: 'u' }] },
      data: { posted_by: null, last_modified_by: null },
    });
    expect(dbMock.drug_variants.updateMany).toHaveBeenCalledWith({ where: { last_updated_by: 'u' }, data: { last_updated_by: null } });
    expect(dbMock.drugs.updateMany).toHaveBeenCalledWith({ where: { last_updated_by: 'u' }, data: { last_updated_by: null } });
    expect(dbMock.user_actions.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{ user_id: 'u' }, { target_discord_id: '1' }],
        NOT: { id: { in: ['active-ban'] } },
      },
    });
    expect(dbMock.appeals.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(out).toContain('quotes, game scores');
    expect(out).not.toContain('AI consent');
  });

  it('deletes ticket threads before database rows and clears the user’s ticket and appeal data', async () => {
    seed({ id: 'u', discord_id: '1', mod_thread_id: 'mod-thread' });
    dbMock.user_tickets.findMany.mockResolvedValueOnce([
      { thread_id: 'ticket', meta_thread_id: 'meta' },
    ] as never);
    dbMock.discord_guilds.findMany.mockResolvedValueOnce([
      { channel_mod_log: 'mod-log' }, { channel_mod_log: null },
    ] as never);
    const deleteDiscordData = vi.fn().mockResolvedValue(undefined);
    const out = await privacy('delete', '1', deleteDiscordData);
    expect(deleteDiscordData).toHaveBeenCalledWith('1', ['mod-thread', 'ticket', 'meta'], [], ['mod-log']);
    expect(dbMock.user_tickets.updateMany).toHaveBeenCalledWith({
      where: { OR: [{ closed_by: 'u' }, { reopened_by: 'u' }] },
      data: { closed_by: null, reopened_by: null },
    });
    expect(dbMock.user_tickets.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(dbMock.appeals.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(out).toContain('support ticket records and Discord threads');
  });

  it('requires Discord cleanup and supplies saved archive message IDs', async () => {
    seed({ id: 'u', discord_id: '1', mod_thread_id: 'thread' });
    await expect(privacy('delete', '1')).rejects.toThrow('Discord thread cleanup is required');
    expect(dbMock.users.delete).not.toHaveBeenCalled();
    seed({ id: 'u', discord_id: '1' });
    dbMock.best_of.findMany.mockResolvedValueOnce([{ message_id: 'source' }] as never);
    dbMock.appeals.findMany.mockResolvedValueOnce([{ id: 'appeal' }] as never);
    const cleanup = vi.fn().mockResolvedValue(undefined);
    expect(await privacy('delete', '1', cleanup)).toContain('1 saved messages');
    expect(cleanup).toHaveBeenCalledWith('1', [], ['source'], []);
  });

  it('does not delete database records if Discord thread cleanup fails', async () => {
    seed({ id: 'u', discord_id: '1' });
    dbMock.user_tickets.findMany.mockResolvedValueOnce([{ thread_id: 'ticket', meta_thread_id: null }] as never);
    await expect(privacy('delete', '1', vi.fn().mockRejectedValue(new Error('missing permissions'))))
      .rejects.toThrow('missing permissions');
    expect(dbMock.$transaction).not.toHaveBeenCalled();
  });

  it('propagates a mid-delete failure from the transaction without writing through the root client', async () => {
    seed({ id: 'u', discord_id: '1' });
    const tx = {
      users: { delete: vi.fn() },
      user_drug_doses: { deleteMany: vi.fn() },
      user_experience: { deleteMany: vi.fn().mockRejectedValue(new Error('delete failed')) },
    };
    dbMock.$transaction.mockImplementationOnce(async callback => {
      if (typeof callback !== 'function') throw new Error('Expected an interactive transaction');
      return callback(tx as unknown as Prisma.TransactionClient);
    });

    await expect(privacy('delete', '1')).rejects.toThrow('delete failed');
    expect(tx.user_drug_doses.deleteMany).toHaveBeenCalled();
    expect(dbMock.user_drug_doses.deleteMany).not.toHaveBeenCalled();
    expect(dbMock.quotes.deleteMany).not.toHaveBeenCalled();
  });

  it('skips the Discord-ID tables for a user without a Discord ID', async () => {
    seed({ id: 'u', discord_id: null });
    await privacy('delete', 'x');
    expect(dbMock.best_of.deleteMany).not.toHaveBeenCalled();
  });

  it('omits record summaries when there were none', async () => {
    seed({ id: 'u', discord_id: '1' });
    expect(await privacy('delete', '1')).not.toContain('I deleted 0');
  });
});

describe('purgeInactiveUsers', () => {
  const now = new Date('2026-11-12T00:00:00Z');

  it('looks for unbanned users unseen for six months, skipping already-scrubbed ones', async () => {
    dbMock.users.findMany.mockResolvedValueOnce([]);
    expect(await purgeInactiveUsers(now)).toBe(0);
    const { where } = dbMock.users.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(where.last_seen_at).toEqual({ lt: new Date('2026-05-12T00:00:00Z'), gt: SCRUBBED_LAST_SEEN });
    expect(where.user_actions_user_actions_user_idTousers).toEqual({ none: { type: 'FULL_BAN', repealed_at: null } });
    expect(dbMock.user_actions.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes each inactive user and their linked moderation data', async () => {
    dbMock.users.findMany.mockResolvedValueOnce([
      { id: 'u1', discord_id: 'd1' }, { id: 'u2', discord_id: null },
    ] as never);
    seed({ id: 'u1', discord_id: 'd1', email: 'a@b.c' });
    expect(await purgeInactiveUsers(now)).toBe(1);
    expect(dbMock.users.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(dbMock.user_actions.deleteMany).toHaveBeenCalled();
  });

  it('keeps going when one user fails', async () => {
    dbMock.users.findMany.mockResolvedValueOnce([
      { id: 'u1', discord_id: 'd1' }, { id: 'u2', discord_id: 'd2' },
    ] as never);
    dbMock.users.upsert.mockRejectedValueOnce(new Error('boom'));
    seed({ id: 'u2', discord_id: 'd2' });
    vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
    expect(await purgeInactiveUsers()).toBe(1);
    expect(global.log.error).toHaveBeenCalledWith('g.privacy', 'Retention purge failed for one account');
  });
});

describe('pruneModerationActions', () => {
  it('deletes actions older than two years, keeping permanent bans and the actions of banned users', async () => {
    dbMock.user_actions.deleteMany.mockResolvedValueOnce({ count: 4 });
    expect(await pruneModerationActions(new Date('2026-11-12T00:00:00Z'))).toBe(4);
    expect(dbMock.user_actions.deleteMany).toHaveBeenCalledWith({
      where: {
        created_at: { lt: new Date('2024-11-12T00:00:00Z') },
        type: { notIn: ['FULL_BAN', 'BAN_EVASION'] },
        users_user_actions_user_idTousers: {
          is: { user_actions_user_actions_user_idTousers: { none: { type: 'FULL_BAN', repealed_at: null } } },
        },
      },
    });
  });
});
