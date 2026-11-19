import express, { NextFunction, Response } from 'express';
import supertest from 'supertest';
import type { AuthenticatedRequest } from './middlewares/keycloakAuth';
import router from './v2/appeals/appeals.routes';

const mocks = vi.hoisted(() => ({
  userId: 'authenticated-user',
  guildId: 'configured-guild',
  checkBanStatus: vi.fn(),
  createAppeal: vi.fn(),
  rollbackAppeal: vi.fn(),
  messageModThread: vi.fn(),
}));

vi.mock('./middlewares/keycloakAuth', () => ({
  default: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    req.user = { sub: 'test-account', discord_id: mocks.userId };
    next();
  },
}));
vi.mock('./v2/users/users.queries', () => ({ default: { checkBanStatus: mocks.checkBanStatus } }));
vi.mock('./v2/appeals/appeals.queries', () => ({ default: { createAppeal: mocks.createAppeal, rollbackAppeal: mocks.rollbackAppeal } }));
vi.mock('../discord/utils/modUtils', () => ({ messageModThread: mocks.messageModThread }));

const app = express();
app.use(express.json());
app.use(router);

describe('appeals authenticated identity', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_GUILD_ID', mocks.guildId);
    mocks.checkBanStatus.mockResolvedValue({ banned: true });
    mocks.createAppeal.mockResolvedValue({ success: true, appealId: 'new-appeal' });
    mocks.rollbackAppeal.mockReset();
    (global as unknown as { discordClient: unknown }).discordClient = {
      user: { id: 'bot' },
      guilds: { fetch: vi.fn(async () => ({ members: { fetch: vi.fn(async () => ({ id: 'bot' })) } })) },
      users: { fetch: vi.fn(async () => ({ id: mocks.userId })) },
    };
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each([
    {},
    { discordId: 'spoofed-user', guildId: 'spoofed-guild' },
    { discordId: null, guildId: null },
  ])('uses the authenticated user and configured guild despite body overrides %j', async overrides => {
    const answers = {
      reason: 'Reason', solution: 'Solution', future: 'Future', extra: 'Extra',
    };
    const response = await supertest(app).post('/create').send({ ...answers, ...overrides });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mocks.checkBanStatus).toHaveBeenCalledWith(mocks.userId);
    expect(mocks.createAppeal).toHaveBeenCalledWith({
      guild_id: mocks.guildId,
      discord_id: mocks.userId,
      ...answers,
    });
    expect(mocks.messageModThread).toHaveBeenCalledWith(
      null,
      expect.anything(),
      { id: mocks.userId },
      'BAN_APPEAL',
      expect.objectContaining({
        appealData: { ...answers, guildId: mocks.guildId, discordId: mocks.userId },
      }),
    );
  });

  it.each([
    ['creating the appeal', () => mocks.createAppeal.mockRejectedValue(new Error('prisma: relation "appeals" secret detail'))],
    ['notifying the mod thread', () => mocks.messageModThread.mockRejectedValue(new Error('discord token abc123 failed'))],
  ])('returns a stable message and hides internal errors when %s fails', async (_name, fail) => {
    fail();
    const response = await supertest(app).post('/create').send({
      reason: 'Reason', solution: 'Solution', future: 'Future', extra: 'Extra',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to submit appeal' });
    expect(JSON.stringify(response.body)).not.toMatch(/prisma|secret|token|abc123/);
  });

  it('rolls the appeal back when the moderators could not be notified, so the cooldown does not start', async () => {
    mocks.messageModThread.mockRejectedValue(new Error('thread gone'));
    const response = await supertest(app).post('/create').send({
      reason: 'Reason', solution: 'Solution', future: 'Future', extra: 'Extra',
    });
    expect(response.status).toBe(500);
    expect(mocks.rollbackAppeal).toHaveBeenCalledWith('new-appeal');
  });

  it('keeps the appeal when the moderators were notified', async () => {
    mocks.messageModThread.mockResolvedValue(undefined);
    await supertest(app).post('/create').send({
      reason: 'Reason', solution: 'Solution', future: 'Future', extra: 'Extra',
    });
    expect(mocks.rollbackAppeal).not.toHaveBeenCalled();
  });
});
