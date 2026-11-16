import { DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';
import users from './v2/users/users.queries';

// Regression tests for TripSit/TripBot#1344: any failure of the ban lookup used to read as "not banned".
describe('users.checkBanStatus', () => {
  const setGuild = (fetchBan: () => Promise<unknown>) => {
    (global as unknown as { discordClient: unknown }).discordClient = {
      guilds: { fetch: vi.fn(async () => ({ bans: { fetch: vi.fn(fetchBan) } })) },
    };
  };
  const discordError = (code: number) => new DiscordAPIError({ code, message: 'x' }, code, 404, 'GET', '/bans/1', {});

  it('reports a ban with its reason', async () => {
    setGuild(async () => ({ reason: 'spam' }));
    expect(await users.checkBanStatus('1')).toEqual({ success: true, banned: true, reason: 'spam' });
  });

  it('treats only the explicit unknown-ban answer as not banned', async () => {
    setGuild(async () => { throw discordError(RESTJSONErrorCodes.UnknownBan); });
    expect(await users.checkBanStatus('1')).toEqual({ success: true, banned: false });
  });

  it('propagates other Discord errors and network failures instead of claiming not banned', async () => {
    setGuild(async () => { throw discordError(RESTJSONErrorCodes.MissingPermissions); });
    await expect(users.checkBanStatus('1')).rejects.toBeInstanceOf(DiscordAPIError);
    setGuild(async () => { throw new Error('ECONNRESET'); });
    await expect(users.checkBanStatus('1')).rejects.toThrow('ECONNRESET');
  });

  it('propagates a failed guild lookup', async () => {
    (global as unknown as { discordClient: unknown }).discordClient = { guilds: { fetch: vi.fn(async () => { throw new Error('no guild'); }) } };
    await expect(users.checkBanStatus('1')).rejects.toThrow('no guild');
  });
});
