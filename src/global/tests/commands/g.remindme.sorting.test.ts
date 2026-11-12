/* eslint-disable sonarjs/no-duplicate-string */
import { remindMe } from '../../commands/g.remindme';
import { dbMock } from '../../../vitest/utils/mockDb';

type Row = Awaited<ReturnType<typeof dbMock.user_reminders.findMany>>[number];
const user = { id: 'u', discord_id: '1' } as unknown as Awaited<ReturnType<typeof dbMock.users.upsert>>;
const row = (id: string, created: string, trigger: string) => ({
  id, user_id: 'u', reminder_text: `text ${id}`, created_at: new Date(created), trigger_at: new Date(trigger),
}) as unknown as Row;

describe('remindMe record ordering', () => {
  it('deletes by position in creation order regardless of query order', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(user);
    dbMock.user_reminders.findMany.mockResolvedValueOnce([
      row('newest', '2024-03-01', '2024-04-01'),
      row('oldest', '2024-01-01', '2024-04-01'),
      row('middle', '2024-02-01', '2024-04-01'),
      row('tie', '2024-02-01', '2024-04-01'),
    ]);
    const result = await remindMe('delete', '1', 0, null, null);
    expect(dbMock.user_reminders.delete).toHaveBeenCalledWith({ where: { id: 'oldest' } });
    expect(result).toContain('text oldest');
  });

  it('lists reminders soonest first, keeping ties stable', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(user);
    dbMock.user_reminders.findMany.mockResolvedValueOnce([
      row('later', '2024-01-01', '2024-06-01'),
      row('sooner', '2024-01-02', '2024-05-01'),
      row('same-a', '2024-01-03', '2024-07-01'),
      row('same-b', '2024-01-04', '2024-07-01'),
    ]);
    const result = await remindMe('get', '1', null, null, null);
    const text = JSON.stringify(result);
    expect(text.indexOf('text sooner')).toBeLessThan(text.indexOf('text later'));
    expect(text.indexOf('text same-a')).toBeLessThan(text.indexOf('text same-b'));
  });
});
