import appeals from './v2/appeals/appeals.queries';
import { dbMock } from '../vitest/utils/mockDb';

const mocks = vi.hoisted(() => ({ reminder: vi.fn() }));
vi.mock('../discord/utils/appeal', () => ({ appealReminder: mocks.reminder }));

const pending = {
  id: 'appeal', user_id: 'user', status: 'RECEIVED', reminded_at: null,
};

beforeEach(() => {
  mocks.reminder.mockReset();
  dbMock.users.findFirst.mockResolvedValue({ id: 'user' } as never);
  dbMock.appeals.findFirst.mockResolvedValue(pending as never);
});

describe('remindAppeal', () => {
  it('starts the reminder wait only after the reminder was delivered', async () => {
    mocks.reminder.mockResolvedValue({ success: true, message: 'sent' });
    expect(await appeals.remindAppeal('d1')).toEqual({ success: true, message: 'sent' });
    expect(dbMock.appeals.update).toHaveBeenCalledWith({
      where: { id: 'appeal' }, data: { reminded_at: expect.any(Date) },
    });
  });

  it('does not lock the user out when the reminder could not be sent', async () => {
    mocks.reminder.mockResolvedValue({ success: false, message: 'Mod thread not found or invalid' });
    expect(await appeals.remindAppeal('d1')).toEqual({ success: false, message: 'Mod thread not found or invalid' });
    expect(dbMock.appeals.update).not.toHaveBeenCalled();
  });
});

describe('rollbackAppeal', () => {
  it('deletes only a still-pending appeal', async () => {
    await appeals.rollbackAppeal('appeal');
    expect(dbMock.appeals.deleteMany).toHaveBeenCalledWith({ where: { id: 'appeal', status: 'RECEIVED' } });
  });

  it('swallows database errors', async () => {
    dbMock.appeals.deleteMany.mockRejectedValue(new Error('db'));
    await expect(appeals.rollbackAppeal('appeal')).resolves.toBeUndefined();
  });
});

const NEW_APPEAL = 'new-appeal';

describe('createAppeal', () => {
  const data = {
    guild_id: 'g1', discord_id: 'd1', reason: 'r', solution: 's', future: 'f', extra: 'e',
  };

  beforeEach(() => {
    dbMock.users.upsert.mockResolvedValue({ id: 'user' } as never);
    // The interactive transaction runs against the same mocked client
    dbMock.$transaction.mockImplementation(async callback => {
      if (typeof callback !== 'function') throw new Error('Expected an interactive transaction');
      return callback(dbMock);
    });
    dbMock.$queryRaw.mockResolvedValue([] as never);
    dbMock.appeals.findFirst.mockResolvedValue(null);
    dbMock.appeals.create.mockResolvedValue({ id: NEW_APPEAL } as never);
  });

  it('locks the user row before checking the cooldown and inserting', async () => {
    const order: string[] = [];
    dbMock.$queryRaw.mockImplementation((async () => { order.push('lock'); return []; }) as never);
    dbMock.appeals.findFirst.mockImplementation((async () => { order.push('check'); return null; }) as never);
    dbMock.appeals.create.mockImplementation((async () => { order.push('insert'); return { id: NEW_APPEAL }; }) as never);
    expect(await appeals.createAppeal(data)).toEqual({ success: true, appealId: NEW_APPEAL });
    expect(order).toEqual(['lock', 'check', 'insert']);
  });

  it('refuses a second appeal inside the cooldown without inserting', async () => {
    dbMock.appeals.findFirst.mockResolvedValue({ id: 'earlier' } as never);
    expect(await appeals.createAppeal(data)).toEqual({ success: false, error: 'COOLDOWN' });
    expect(dbMock.appeals.create).not.toHaveBeenCalled();
  });

  it('lets only one of two simultaneous submissions through', async () => {
    // The row lock serializes the transactions; the second one then sees the first one's appeal
    let created = false;
    let chain: Promise<unknown> = Promise.resolve();
    dbMock.$transaction.mockImplementation(((callback: (client: unknown) => Promise<unknown>) => {
      const run = chain.then(() => callback(dbMock));
      chain = run.catch(() => undefined);
      return run;
    }) as never);
    dbMock.appeals.findFirst.mockImplementation((async () => (created ? { id: 'first' } : null)) as never);
    dbMock.appeals.create.mockImplementation((async () => { created = true; return { id: 'first' }; }) as never);
    const results = await Promise.all([appeals.createAppeal(data), appeals.createAppeal(data)]);
    expect(results.map(result => result.success).sort()).toEqual([false, true]);
    expect(dbMock.appeals.create).toHaveBeenCalledTimes(1);
  });

  it('reports database failures', async () => {
    dbMock.$transaction.mockRejectedValue(new Error('db down'));
    expect(await appeals.createAppeal(data)).toEqual({ success: false, error: 'DATABASE_ERROR' });
  });
});
