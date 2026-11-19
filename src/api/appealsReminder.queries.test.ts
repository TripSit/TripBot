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
