/* eslint-disable sonarjs/no-duplicate-string */
import {
  privacy, pruneCommandParameters, pruneModerationActions, purgeInactiveUsers, setIrcBridgeOptOut, SCRUBBED_LAST_SEEN,
} from '../../commands/g.privacy';
import { dbMock } from '../../../vitest/utils/mockDb';

type Upsert = Awaited<ReturnType<typeof dbMock.users.upsert>>;
const rows = (n: number) => Array.from({ length: n }, () => ({})) as never[];

function seed(user: object, doses = 0, exp = 0, reminders = 0) {
  dbMock.users.upsert.mockResolvedValueOnce(user as unknown as Upsert);
  dbMock.user_drug_doses.findMany.mockResolvedValueOnce(rows(doses));
  dbMock.user_experience.findMany.mockResolvedValueOnce(rows(exp));
  dbMock.user_reminders.findMany.mockResolvedValueOnce(rows(reminders));
}

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

  it('is empty for a user with nothing stored', async () => {
    seed({ id: 'u', discord_id: '1' });
    expect(await privacy('get', '1')).toBe('');
  });
});

describe('privacy delete', () => {
  it('scrubs the user row and deletes related records', async () => {
    seed({
      id: 'u', discord_id: '1', email: 'a@b.c', roles: 'r',
    }, 1, 1, 1);
    const out = await privacy('delete', '1');
    expect(dbMock.users.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u' }, data: expect.objectContaining({ email: null, roles: '', karma_given: 0 }),
    }));
    expect(dbMock.user_drug_doses.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(dbMock.user_experience.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(dbMock.user_reminders.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u' } });
    expect(out).toContain('I deleted your User Data');
    expect(out).toContain('I deleted 1 Idose records');
    expect(out).toContain('I deleted 1 experience records');
    expect(out).toContain('I deleted 1 reminders');
    expect(out).not.toContain('a@b.c');
  });

  it('omits record summaries when there were none', async () => {
    seed({ id: 'u', discord_id: '1' });
    expect(await privacy('delete', '1')).not.toContain('I deleted 0');
  });
});

describe('setIrcBridgeOptOut', () => {
  it('stores the opt-out on the user and returns it', async () => {
    dbMock.users.upsert.mockResolvedValueOnce({ id: 'u', discord_id: '1' } as unknown as Upsert);
    dbMock.users.update.mockResolvedValueOnce({ irc_bridge_opt_out: true } as never);
    expect(await setIrcBridgeOptOut('1', true)).toBe(true);
    expect(dbMock.users.update).toHaveBeenCalledWith({ where: { id: 'u' }, data: { irc_bridge_opt_out: true } });
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

  it('scrubs each inactive user but leaves their moderation actions to their own retention', async () => {
    dbMock.users.findMany.mockResolvedValueOnce([
      { id: 'u1', discord_id: 'd1' }, { id: 'u2', discord_id: null },
    ] as never);
    seed({ id: 'u1', discord_id: 'd1', email: 'a@b.c' });
    expect(await purgeInactiveUsers(now)).toBe(1);
    expect(dbMock.users.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u1' }, data: expect.objectContaining({ email: null, last_seen_at: SCRUBBED_LAST_SEEN }),
    }));
    expect(dbMock.user_actions.deleteMany).not.toHaveBeenCalled();
  });

  it('keeps going when one user fails', async () => {
    dbMock.users.findMany.mockResolvedValueOnce([
      { id: 'u1', discord_id: 'd1' }, { id: 'u2', discord_id: 'd2' },
    ] as never);
    dbMock.users.upsert.mockRejectedValueOnce(new Error('boom'));
    seed({ id: 'u2', discord_id: 'd2' });
    vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
    expect(await purgeInactiveUsers()).toBe(1);
    expect(global.log.error).toHaveBeenCalledWith('g.privacy', expect.stringContaining('boom'));
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

describe('pruneCommandParameters', () => {
  it('deletes parameters of usages older than 90 days and reports the count', async () => {
    dbMock.command_usage_parameter.deleteMany.mockResolvedValueOnce({ count: 7 });
    expect(await pruneCommandParameters(new Date('2026-11-12T00:00:00Z'))).toBe(7);
    expect(dbMock.command_usage_parameter.deleteMany).toHaveBeenCalledWith({
      where: { usage: { created_at: { lt: new Date('2026-08-14T00:00:00Z') } } },
    });
  });
});
