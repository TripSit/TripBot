import { privacy } from '../../commands/g.privacy';
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
