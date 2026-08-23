import { remindMe } from '../../commands/g.remindme';
import { dbMock } from '../../../vitest/utils/mockDb';

const userId = '123456789';
const dbUserId = 'a0000000-0000-4000-8000-000000000001';
const DRINK_WATER = 'drink water';
const userRecord = { id: dbUserId, discord_id: userId } as unknown as Awaited<ReturnType<typeof dbMock.users.upsert>>;

function reminder(overrides: Partial<{
  id: string,
  user_id: string,
  reminder_text: string,
  created_at: Date,
  trigger_at: Date,
}>) {
  return {
    id: 'b0000000-0000-4000-8000-000000000001',
    user_id: dbUserId,
    reminder_text: DRINK_WATER,
    created_at: new Date('2024-01-01'),
    trigger_at: new Date('2024-01-02'),
    ...overrides,
  } as unknown as Awaited<ReturnType<typeof dbMock.user_reminders.findMany>>[number];
}

describe('remindMe', () => {
  describe('delete', () => {
    it('requires a record number', async () => {
      const response = await remindMe('delete', userId, null, null, null);
      expect(response).toBe('You must provide a record number to delete!');
      expect(dbMock.users.upsert).not.toHaveBeenCalled();
    });

    it('reports when there are no reminders', async () => {
      dbMock.users.upsert.mockResolvedValueOnce(userRecord);
      dbMock.user_reminders.findMany.mockResolvedValueOnce([]);

      const response = await remindMe('delete', userId, 0, null, null);
      expect(response).toBe('You have no reminder records, you can use /remind_me to add some!');
    });

    it('reports when the requested record does not exist', async () => {
      dbMock.users.upsert.mockResolvedValueOnce(userRecord);
      dbMock.user_reminders.findMany.mockResolvedValueOnce([reminder({})]);

      const response = await remindMe('delete', userId, 5, null, null);
      expect(response).toBe('That record does not exist!');
    });

    it('deletes the requested reminder', async () => {
      dbMock.users.upsert.mockResolvedValueOnce(userRecord);
      dbMock.user_reminders.findMany.mockResolvedValueOnce([
        reminder({ id: 'c0000000-0000-4000-8000-000000000042' }),
      ]);

      const response = await remindMe('delete', userId, 0, null, null);
      expect(dbMock.user_reminders.delete).toHaveBeenCalledWith({
        where: { id: 'c0000000-0000-4000-8000-000000000042' },
      });
      expect(response).toContain('I deleted:');
      expect(response).toContain(DRINK_WATER);
    });
  });

  describe('get', () => {
    it('reports when there are no reminders', async () => {
      dbMock.users.upsert.mockResolvedValueOnce(userRecord);
      dbMock.user_reminders.findMany.mockResolvedValueOnce([]);

      const response = await remindMe('get', userId, null, null, null);
      expect(response).toBe('You have no reminder records, you can use /remind_me to add some!');
    });

    it('returns reminders sorted by trigger_at', async () => {
      dbMock.users.upsert.mockResolvedValueOnce(userRecord);
      dbMock.user_reminders.findMany.mockResolvedValueOnce([
        reminder({ reminder_text: 'second', trigger_at: new Date('2024-02-01') }),
        reminder({ reminder_text: 'first', trigger_at: new Date('2024-01-15') }),
      ]);

      const response = await remindMe('get', userId, null, null, null);
      expect(response).toEqual([
        { index: 0, date: new Date('2024-01-15'), value: 'first' },
        { index: 1, date: new Date('2024-02-01'), value: 'second' },
      ]);
    });
  });

  describe('set', () => {
    it('requires a trigger date', async () => {
      const response = await remindMe('set', userId, null, DRINK_WATER, null);
      expect(response).toBe('You must provide a date and time for the reminder!');
      expect(dbMock.users.upsert).not.toHaveBeenCalled();
    });

    it('creates the reminder', async () => {
      dbMock.users.upsert.mockResolvedValueOnce(userRecord);
      const triggerAt = new Date('2024-03-01T00:00:00.000Z');

      const response = await remindMe('set', userId, null, DRINK_WATER, triggerAt);
      expect(dbMock.user_reminders.create).toHaveBeenCalledWith({
        data: {
          user_id: userRecord.id,
          reminder_text: DRINK_WATER,
          trigger_at: triggerAt,
        },
      });
      expect(response).toBe(`I will remind you to ${DRINK_WATER} at ${triggerAt}!`);
    });
  });
});
