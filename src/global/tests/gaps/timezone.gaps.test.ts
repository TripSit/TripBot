import { timezone } from '../../commands/g.timezone';

const mocks = vi.hoisted(() => ({ user: vi.fn() }));
vi.mock('../../utils/dbRecords', () => ({ getOrCreateUser: mocks.user }));

afterEach(() => { vi.useRealTimers(); });

describe('timezone get', () => {
  it('shows the local time with the matching GMT offset', async () => {
    mocks.user.mockResolvedValueOnce({ id: 'u', timezone: 'Pacific/Honolulu' });
    expect(await timezone('get', 'u', null)).toMatch(/^It's .* \(GMT-10:00\)$/);
  });

  it.each([
    ['2026-07-15T16:00:00Z', 'It\'s 12:00 PM (GMT-04:00)'],
    ['2026-01-15T16:00:00Z', 'It\'s 11:00 AM (GMT-05:00)'],
  ])('uses the offset in force on the day, not a fixed one, for New York at %s', async (when, expected) => {
    vi.useFakeTimers({ now: new Date(when) });
    mocks.user.mockResolvedValueOnce({ id: 'u', timezone: 'America/New_York' });
    expect(await timezone('get', 'u', null)).toBe(expected);
  });

  it('shows UTC as +00:00', async () => {
    mocks.user.mockResolvedValueOnce({ id: 'u', timezone: 'UTC' });
    expect(await timezone('get', 'u', null)).toMatch(/\(GMT\+00:00\)$/);
  });

  it('returns nothing for members without a timezone', async () => {
    mocks.user.mockResolvedValueOnce({ id: 'u', timezone: null });
    expect(await timezone('get', 'u', null)).toBe('');
  });
});
