import express, { NextFunction, Response } from 'express';
import supertest from 'supertest';
import { DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';
import type { AuthenticatedRequest } from './middlewares/keycloakAuth';
import router from './v2/users/users.routes';

const mocks = vi.hoisted(() => {
  const userId = 'authenticated-user';
  return { userId, discordId: userId as string | undefined };
});

vi.mock('./middlewares/keycloakAuth', () => ({
  default: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    req.user = { sub: 'test-account', discord_id: mocks.discordId };
    next();
  },
}));

const app = express();
app.use(router);

const failure = { error: 'Failed to check ban status' };
const fetchGuild = vi.fn();
const fetchBan = vi.fn();
const discordError = (code: number) => new DiscordAPIError({ code, message: 'x' }, code, 404, 'GET', '/bans/1', {});

// The route runs the real checkBanStatus; only Discord and the token are stubbed.
describe('GET /api/v2/users/banned', () => {
  beforeEach(() => {
    mocks.discordId = mocks.userId;
    fetchBan.mockReset();
    fetchGuild.mockReset().mockResolvedValue({ bans: { fetch: fetchBan } });
    vi.stubEnv('DISCORD_GUILD_ID', 'configured-guild');
    vi.stubGlobal('discordClient', { guilds: { fetch: fetchGuild } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('reports a ban for the authenticated user', async () => {
    fetchBan.mockResolvedValue({ reason: 'spam' });
    const response = await supertest(app).get('/banned').expect(200);
    expect(response.body).toEqual({ success: true, banned: true, reason: 'spam' });
    expect(fetchGuild).toHaveBeenCalledWith('configured-guild');
    expect(fetchBan).toHaveBeenCalledWith(mocks.userId);
  });

  it('reports not banned when Discord answers that there is no ban', async () => {
    fetchBan.mockRejectedValue(discordError(RESTJSONErrorCodes.UnknownBan));
    const response = await supertest(app).get('/banned').expect(200);
    expect(response.body).toEqual({ success: true, banned: false });
  });

  // Regression: these failures used to answer 200 with banned: false, which read as "not banned".
  const missingPermissions = () => discordError(RESTJSONErrorCodes.MissingPermissions);
  it.each([
    ['Discord refuses the ban lookup', () => fetchBan.mockRejectedValue(missingPermissions())],
    ['the ban lookup fails on the network', () => fetchBan.mockRejectedValue(new Error('ECONNRESET token abc123'))],
    ['the guild cannot be fetched', () => fetchGuild.mockRejectedValue(new Error('guild secret detail'))],
  ])('answers 503 with no ban flag when %s', async (_name, fail) => {
    fail();
    const response = await supertest(app).get('/banned').expect(503);
    expect(response.body).toEqual(failure);
    expect(response.body).not.toHaveProperty('banned');
    expect(JSON.stringify(response.body)).not.toMatch(/ECONNRESET|token|abc123|secret/);
  });

  it('rejects a token without a Discord ID before asking Discord', async () => {
    mocks.discordId = undefined;
    const response = await supertest(app).get('/banned').expect(400);
    expect(response.body).toEqual({ error: 'Discord ID not found in token' });
    expect(fetchGuild).not.toHaveBeenCalled();
  });
});
