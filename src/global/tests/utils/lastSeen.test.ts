import { LAST_SEEN_INTERVAL_MS, touchLastSeen } from '../../utils/lastSeen';
import { dbMock } from '../../../vitest/utils/mockDb';

describe('touchLastSeen', () => {
  it('updates users who have not been seen within the interval', async () => {
    await touchLastSeen({ id: 'u', last_seen_at: new Date(Date.now() - LAST_SEEN_INTERVAL_MS - 1000) });
    expect(dbMock.users.update).toHaveBeenCalledWith({
      where: { id: 'u' }, data: { last_seen_at: expect.any(Date) },
    });
  });

  it('skips users seen recently', async () => {
    await touchLastSeen({ id: 'u', last_seen_at: new Date() });
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });

  it('logs instead of throwing when the update fails', async () => {
    dbMock.users.update.mockRejectedValueOnce(new Error('db down'));
    vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
    await expect(touchLastSeen({ id: 'u', last_seen_at: new Date(0) })).resolves.toBeUndefined();
    expect(global.log.error).toHaveBeenCalledWith('lastSeen', expect.stringContaining('db down'));
  });
});
