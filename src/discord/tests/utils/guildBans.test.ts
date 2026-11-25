import { Collection } from 'discord.js';
import { BAN_PAGE_SIZE, fetchGuildBanIds } from '../../utils/guildBans';

/** A page of bans keyed by user ID, as discord.js returns them. */
function page(ids: string[]) {
  return new Collection(ids.map(id => [id, { user: { id } }]));
}

describe('fetchGuildBanIds', () => {
  const fetchBans = vi.fn();
  const fetchGuild = vi.fn();

  beforeEach(() => {
    fetchBans.mockReset();
    fetchGuild.mockReset();
    fetchGuild.mockResolvedValue({ bans: { fetch: fetchBans } });
    (global as unknown as { discordClient: unknown }).discordClient = { guilds: { fetch: fetchGuild } };
  });

  it('returns every banned ID from a single page', async () => {
    fetchBans.mockResolvedValueOnce(page(['1', '2']));
    expect(await fetchGuildBanIds('g1')).toEqual(new Set(['1', '2']));
    expect(fetchGuild).toHaveBeenCalledWith('g1');
    expect(fetchBans).toHaveBeenCalledWith({ limit: BAN_PAGE_SIZE, cache: false });
  });

  it('pages through a full list, continuing after the largest ID', async () => {
    // Page order is not relied on: the largest snowflake is found numerically, not by position or string order
    // IDs 1..1000 with 1000 first: neither the last position nor the largest string ('999') is the largest ID
    const fullPage = Array.from({ length: BAN_PAGE_SIZE }, (_, index) => String(index + 1));
    fullPage.unshift(fullPage.pop() as string);
    fetchBans.mockResolvedValueOnce(page(fullPage)).mockResolvedValueOnce(page(['99999']));

    const ids = await fetchGuildBanIds('g1');

    expect(ids?.size).toBe(BAN_PAGE_SIZE + 1);
    expect(fetchBans).toHaveBeenNthCalledWith(2, { limit: BAN_PAGE_SIZE, cache: false, after: '1000' });
  });

  it('returns null instead of a partial list when Discord fails', async () => {
    vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
    fetchBans.mockResolvedValueOnce(page(Array.from({ length: BAN_PAGE_SIZE }, (_, index) => String(index + 1))))
      .mockRejectedValueOnce(new Error('Missing Permissions'));
    expect(await fetchGuildBanIds('g1')).toBeNull();

    fetchGuild.mockRejectedValueOnce(new Error('Unknown Guild'));
    expect(await fetchGuildBanIds('g1')).toBeNull();
    expect(global.log.error).toHaveBeenCalledTimes(2);
  });
});
