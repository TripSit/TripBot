import { Guild } from 'discord.js';
import { decideStaffAppeal, listStaffAppeals } from './v2/appeals/staff.queries';
import { dbMock } from '../vitest/utils/mockDb';

const unban = vi.fn();
const guild = { id: 'guild', bans: { remove: unban } } as unknown as Guild;
const appeal = {
  id: 'appeal', guild_id: 'guild', user_id: 'user', status: 'RECEIVED', users: { discord_id: 'target' },
};
beforeEach(() => {
  unban.mockReset();
  // Prisma's interactive transaction gets a mock client; no real database or Discord is used.
  dbMock.$transaction.mockImplementation(async callback => {
    if (typeof callback !== 'function') throw new Error('Expected interactive transaction');
    return callback(dbMock);
  });
  dbMock.appeals.findFirst.mockResolvedValue(appeal as never);
  dbMock.users.upsert.mockResolvedValue({ id: 'actor' } as never);
  dbMock.appeals.update.mockResolvedValue({ id: 'appeal' } as never);
});

it('scopes and bounds listing, flattening only explicitly selected identity fields', async () => {
  dbMock.appeals.findMany.mockResolvedValue(Array.from({ length: 26 }, () => ({
    id: 'a', users: { discord_id: 'member', username: 'Member' },
  })) as never);
  const result = await listStaffAppeals('guild', 'RECEIVED', 1);
  expect(result.hasMore).toBe(true);
  expect(result.appeals).toHaveLength(25);
  expect(result.appeals[0]).toEqual({ id: 'a', discord_id: 'member', username: 'Member' });
  expect(dbMock.appeals.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { guild_id: 'guild', status: 'RECEIVED' }, skip: 25, take: 26,
  }));
  const select = dbMock.appeals.findMany.mock.calls[0][0]?.select;
  expect(select?.users).toEqual({ select: { discord_id: true, username: true } });
});

it('locks the guild-scoped appeal and records the verified actor before unbanning', async () => {
  expect(await decideStaffAppeal(guild, 'appeal', 'ACCEPTED', 'Welcome', 'moderator')).toEqual({ success: true });
  expect(dbMock.$queryRaw).toHaveBeenCalled();
  expect(dbMock.appeals.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'appeal', guild_id: 'guild' },
  }));
  expect(dbMock.user_actions.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      created_by: 'actor', type: 'APPEAL_ACCEPT', user_id: 'user', description: 'Welcome',
    }),
  });
  expect(dbMock.appeals.update).toHaveBeenCalledWith({
    where: { id: 'appeal' },
    data: expect.objectContaining({ status: 'ACCEPTED', response_message: 'Welcome' }),
  });
  expect(unban).toHaveBeenCalledWith('target', expect.stringContaining('moderator'));
});

it('denies without calling Discord unban', async () => {
  await decideStaffAppeal(guild, 'appeal', 'DENIED', 'Not yet', 'moderator');
  expect(unban).not.toHaveBeenCalled();
  expect(dbMock.user_actions.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'APPEAL_REJECT' }) });
});

it.each(['ACCEPTED', 'DENIED'])('rejects already-reviewed appeals without side effects', async status => {
  dbMock.appeals.findFirst.mockResolvedValue({ ...appeal, status } as never);
  await expect(decideStaffAppeal(guild, 'appeal', 'ACCEPTED', 'Welcome', 'moderator')).rejects.toMatchObject({ status: 409 });
  expect(unban).not.toHaveBeenCalled();
  expect(dbMock.user_actions.create).not.toHaveBeenCalled();
});

it('rejects nonexistent, cross-guild, and superseded appeals', async () => {
  dbMock.appeals.findFirst.mockResolvedValueOnce(null);
  await expect(decideStaffAppeal(guild, 'appeal', 'DENIED', 'No', 'moderator')).rejects.toMatchObject({ status: 404 });
  dbMock.appeals.findFirst.mockResolvedValueOnce(appeal as never).mockResolvedValueOnce({ id: 'newer' } as never);
  await expect(decideStaffAppeal(guild, 'appeal', 'ACCEPTED', 'Welcome', 'moderator')).rejects.toMatchObject({ status: 409 });
  expect(unban).not.toHaveBeenCalled();
});

it('fails the transaction on a failed unban and tolerates an already-removed ban', async () => {
  unban.mockRejectedValueOnce(new Error('Discord unavailable'));
  await expect(decideStaffAppeal(guild, 'appeal', 'ACCEPTED', 'Welcome', 'moderator')).rejects.toMatchObject({ status: 502 });
  unban.mockRejectedValueOnce({ code: 10026 });
  await expect(decideStaffAppeal(guild, 'appeal', 'ACCEPTED', 'Welcome', 'moderator')).resolves.toEqual({ success: true });
});

it('does not unban an accepted appeal without a linked account', async () => {
  dbMock.appeals.findFirst.mockResolvedValue({ ...appeal, users: { discord_id: null } } as never);
  await expect(decideStaffAppeal(guild, 'appeal', 'ACCEPTED', 'Welcome', 'moderator')).rejects.toMatchObject({ status: 409 });
  expect(unban).not.toHaveBeenCalled();
});
