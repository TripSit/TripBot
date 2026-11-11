import { timezone } from '../../commands/g.timezone';

const mocks = vi.hoisted(() => ({ user: vi.fn() }));
vi.mock('../../utils/dbRecords', () => ({ getOrCreateUser: mocks.user }));

describe('timezone get', () => {
  it('shows the local time with the matching GMT offset', async () => {
    mocks.user.mockResolvedValueOnce({ id: 'u', timezone: 'Pacific/Honolulu' });
    expect(await timezone('get', 'u', null)).toMatch(/^It's .* \(GMT-10:00\)$/);
  });

  it('returns nothing for members without a timezone', async () => {
    mocks.user.mockResolvedValueOnce({ id: 'u', timezone: null });
    expect(await timezone('get', 'u', null)).toBe('');
  });
});
