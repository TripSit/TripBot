import { DateTime } from 'luxon';
import { birthday } from '../../commands/g.birthday';
import { timezone } from '../../commands/g.timezone';
import { profile } from '../../commands/g.profile';
import { dramacounter } from '../../commands/g.dramacounter';
import { dbMock } from '../../../vitest/utils/mockDb';

type Upsert = Awaited<ReturnType<typeof dbMock.users.upsert>>;
const asUser = (u: object) => u as unknown as Upsert;

describe('birthday', () => {
  it('sets a birthday in the placeholder year 2000', async () => {
    const result = await birthday('set', '1', 3, 14);
    expect(result?.toISODate()).toBe('2000-03-14');
    expect(dbMock.users.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { discord_id: '1' } }));
  });

  it('gets an existing birthday', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(asUser({ id: 'u', birthday: new Date('2000-05-06T12:00:00Z') }));
    const result = await birthday('get', '1');
    expect(DateTime.isDateTime(result)).toBe(true);
  });

  it('returns null when no birthday is stored', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(asUser({ id: 'u', birthday: null }));
    expect(await birthday('get', '1')).toBeNull();
  });
});

describe('timezone', () => {
  it('rejects unknown labels without touching the database', async () => {
    expect(await timezone('set', '1', 'Not/AZone')).toBe('invalid');
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });

  it('stores a valid timezone', async () => {
    const timezones = (await import('../../../../assets/data/timezones.json')).default;
    dbMock.users.upsert.mockResolvedValueOnce(asUser({ id: 'u', timezone: null }));
    expect(await timezone('set', '1', timezones[0].label)).toBe('updated');
    expect(dbMock.users.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { timezone: timezones[0].tzCode } }),
    );
  });

  it('formats the current time for a stored timezone', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(asUser({ id: 'u', timezone: 'UTC' }));
    expect(await timezone('get', '1')).toMatch(/^It's \d{2}:\d{2} (AM|PM) \(GMT/);
  });

  it('shows the configured GMT offset for a known timezone', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(asUser({ id: 'u', timezone: 'Pacific/Pago_Pago' }));
    expect(await timezone('get', '1')).toMatch(/\(GMT-11:00\)$/);
  });

  it('returns an empty string when no timezone is stored', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(asUser({ id: 'u', timezone: null }));
    expect(await timezone('get', '1')).toBe('');
  });
});

describe('profile', () => {
  it('sums text and voice experience, ignoring TOTAL and IGNORED', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(asUser({
      id: 'u', birthday: null, timezone: 'UTC', karma_given: null, karma_received: 4,
    }));
    dbMock.user_experience.findMany.mockResolvedValueOnce([
      { type: 'TEXT', category: 'GENERAL', total_points: 10 },
      { type: 'TEXT', category: 'TOTAL', total_points: 99 },
      { type: 'VOICE', category: 'GENERAL', total_points: 5 },
      { type: 'VOICE', category: 'IGNORED', total_points: 50 },
    ] as unknown as Awaited<ReturnType<typeof dbMock.user_experience.findMany>>);
    dbMock.personas.findFirst.mockResolvedValueOnce({ tokens: 7 } as unknown as Awaited<
    ReturnType<typeof dbMock.personas.findFirst>>);

    expect(await profile('1')).toEqual({
      birthday: null,
      timezone: 'UTC',
      karma_given: 0,
      karma_received: 4,
      totalTextExp: 10,
      totalVoiceExp: 5,
      tokens: 7,
    });
  });

  it('propagates experience lookup failures', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(asUser({ id: 'u' }));
    dbMock.user_experience.findMany.mockRejectedValueOnce(new Error('boom'));
    await expect(profile('1')).rejects.toThrow('boom');
    expect(dbMock.personas.findFirst).not.toHaveBeenCalled();
  });

  it('returns zero tokens and karma for a user without a persona or karma', async () => {
    dbMock.users.upsert.mockResolvedValueOnce(asUser({ id: 'u', karma_given: null, karma_received: null }));
    dbMock.user_experience.findMany.mockResolvedValueOnce([]);
    dbMock.personas.findFirst.mockResolvedValueOnce(null);
    await expect(profile('1')).resolves.toMatchObject({ tokens: 0, karma_given: 0, karma_received: 0 });
  });
});

describe('dramacounter', () => {
  const guild = (g: object) => g as unknown as Awaited<ReturnType<typeof dbMock.discord_guilds.upsert>>;

  it('returns nulls when there has been no drama', async () => {
    dbMock.discord_guilds.upsert.mockResolvedValueOnce(guild({ id: 'g', last_drama_at: null }));
    expect(await dramacounter('get', 'g', new Date(), '')).toEqual({ dramaReason: null, lastDramaAt: null });
  });

  it('returns the stored drama with a default reason', async () => {
    const at = new Date('2024-01-01');
    dbMock.discord_guilds.upsert.mockResolvedValueOnce(guild({ id: 'g', last_drama_at: at, drama_reason: null }));
    expect(await dramacounter('get', 'g', new Date(), '')).toEqual({ dramaReason: 'No reason given', lastDramaAt: at });
  });

  it('records new drama', async () => {
    const at = new Date('2024-02-02');
    dbMock.discord_guilds.upsert.mockResolvedValueOnce(guild({ id: 'g' }));
    expect(await dramacounter('set', 'g', at, 'spicy')).toEqual({ dramaReason: 'spicy', lastDramaAt: at });
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({
      where: { id: 'g' }, data: { last_drama_at: at, drama_reason: 'spicy' },
    });
  });
});
