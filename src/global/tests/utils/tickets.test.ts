import { getOpenTicket, ticketExpiryDates } from '../../utils/tickets';
import { dbMock } from '../../../vitest/utils/mockDb';

describe('tickets', () => {
  it('getOpenTicket excludes finished statuses', async () => {
    dbMock.user_tickets.findFirst.mockResolvedValueOnce(null);
    expect(await getOpenTicket('u')).toBeNull();
    expect(dbMock.user_tickets.findFirst).toHaveBeenCalledWith({
      where: { user_id: 'u', status: { not: { in: ['CLOSED', 'RESOLVED', 'DELETED'] } } },
    });
  });

  describe('ticketExpiryDates', () => {
    const original = env.NODE_ENV;
    afterEach(() => {
      (env as { NODE_ENV: string }).NODE_ENV = original;
    });

    it('uses days in production', () => {
      (env as { NODE_ENV: string }).NODE_ENV = 'production';
      const { archivedAt, deletedAt } = ticketExpiryDates();
      const day = 86400000;
      expect(Math.round((archivedAt.getTime() - Date.now()) / day)).toBe(3);
      expect(Math.round((deletedAt.getTime() - Date.now()) / day)).toBe(5);
    });

    it('uses minutes outside production', () => {
      (env as { NODE_ENV: string }).NODE_ENV = 'development';
      const { archivedAt, deletedAt } = ticketExpiryDates();
      expect(Math.round((archivedAt.getTime() - Date.now()) / 60000)).toBe(15);
      expect(Math.round((deletedAt.getTime() - Date.now()) / 60000)).toBe(30);
    });
  });
});
