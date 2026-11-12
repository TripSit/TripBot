import getTripSitStatistics from '../../commands/g.tripsitstats';
import { dbMock } from '../../../vitest/utils/mockDb';

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

type Tickets = Awaited<ReturnType<typeof dbMock.user_tickets.findMany>>;
const tickets = (n: number) => Array.from({ length: n }, () => ({})) as unknown as Tickets;

describe('getTripSitStatistics', () => {
  it('summarises ticket counts and signs the differences', async () => {
    dbMock.user_tickets.findMany
      .mockResolvedValueOnce(tickets(5))
      .mockResolvedValueOnce(tickets(3))
      .mockResolvedValueOnce(tickets(10))
      .mockResolvedValueOnce(tickets(12));
    const out = await getTripSitStatistics('session');
    expect(out).toContain('Tickets this month: 5');
    expect(out).toContain('Tickets last month: 3 (+2)');
    expect(out).toContain('Tickets last year: 12 (-2)');
  });

  it('reports when no commands were used, with filters', async () => {
    asMock(dbMock.command_usage.groupBy).mockResolvedValueOnce([] as never);
    expect(await getTripSitStatistics('command')).toBe('No command usage found.');
    asMock(dbMock.command_usage.groupBy).mockResolvedValueOnce([] as never);
    expect(await getTripSitStatistics('command', 'ping', 7)).toBe(
      'No command usage found for `ping` in the last 7 days.',
    );
  });

  it('lists the top 25 commands, or all when filtered', async () => {
    const stats = Array.from({ length: 30 }, (_, i) => ({ command: `c${i}`, _count: { command: 30 - i } }));
    asMock(dbMock.command_usage.groupBy).mockResolvedValueOnce(stats as never);
    const all = await getTripSitStatistics('command');
    expect(all.split('\n')).toHaveLength(26);
    expect(all).toContain('📊 **Command Stats**');

    asMock(dbMock.command_usage.groupBy).mockResolvedValueOnce(stats as never);
    const filtered = await getTripSitStatistics('command', 'c', 3);
    expect(filtered.split('\n')).toHaveLength(31);
    expect(filtered).toContain('for `c` (Last 3 Days)');
    expect(dbMock.command_usage.groupBy).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { AND: [expect.objectContaining({ created_at: expect.anything() }), expect.objectContaining({ command: expect.anything() })] },
    }));
  });

  it('has a placeholder for helper stats', async () => {
    expect(await getTripSitStatistics('helpers')).toBe('Not implemented');
  });

  it('falls back on unknown features and database errors', async () => {
    expect(await getTripSitStatistics('bogus')).toBe('No stats found.');
    dbMock.user_tickets.findMany.mockRejectedValueOnce(new Error('db'));
    expect(await getTripSitStatistics('session')).toBe('No stats found.');
  });
});
