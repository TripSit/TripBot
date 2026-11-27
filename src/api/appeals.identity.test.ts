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
    mocks.messageModThread.mockResolvedValue(undefined);
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

  it('refuses the appeal, rather than calling the user not banned, when the ban check fails', async () => {
    mocks.checkBanStatus.mockRejectedValue(new Error('discord token abc123 missing access'));
    const response = await supertest(app).post('/create').send({
      reason: 'Reason', solution: 'Solution', future: 'Future', extra: 'Extra',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to submit appeal' });
    expect(JSON.stringify(response.body)).not.toMatch(/token|abc123/);
    expect(mocks.createAppeal).not.toHaveBeenCalled();
    expect(mocks.messageModThread).not.toHaveBeenCalled();
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

  const answers = {
    reason: 'Reason', solution: 'Solution', future: 'Future', extra: 'Extra',
  };

  it.each(['reason', 'solution', 'future'])('rejects missing or blank required %s before side effects', async field => {
    await Promise.all([undefined, '', ' \n\t '].map(async value => {
      const response = await supertest(app).post('/create').send({ ...answers, [field]: value });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Reason, solution and future must be nonempty text; extra must be text' });
    }));
    expect(mocks.checkBanStatus).not.toHaveBeenCalled();
    expect(mocks.createAppeal).not.toHaveBeenCalled();
    expect(mocks.messageModThread).not.toHaveBeenCalled();
  });

  it.each(['reason', 'solution', 'future', 'extra'])('rejects nontext %s before side effects', async field => {
    await Promise.all([null, 5, false, [], {}, { length: -100_000 }].map(async value => {
      const response = await supertest(app).post('/create').send({ ...answers, [field]: value });
      expect(response.status).toBe(400);
    }));
    expect(mocks.checkBanStatus).not.toHaveBeenCalled();
    expect(mocks.createAppeal).not.toHaveBeenCalled();
    expect(mocks.messageModThread).not.toHaveBeenCalled();
  });

  it.each([{}, [], ['text']])('rejects an invalid form body %j', async body => {
    const response = await supertest(app).post('/create').send(body);
    expect(response.status).toBe(400);
    expect(mocks.createAppeal).not.toHaveBeenCalled();
  });

  it('accepts omitted optional text without leaking arbitrary fields to the moderator message', async () => {
    const { reason, solution, future } = answers;
    const required = { reason, solution, future };
    const response = await supertest(app).post('/create').send({ ...required, ignored: 'untrusted' });
    expect(response.status).toBe(200);
    expect(mocks.createAppeal).toHaveBeenCalledWith({
      guild_id: mocks.guildId, discord_id: mocks.userId, ...required, extra: '',
    });
    expect(mocks.messageModThread).toHaveBeenCalledWith(
      null,
      expect.anything(),
      expect.anything(),
      'BAN_APPEAL',
      expect.objectContaining({
        appealData: {
          ...required, extra: '', guildId: mocks.guildId, discordId: mocks.userId,
        },
      }),
    );
  });

  it.each([3600, 3601])('preserves the total text limit at %i characters', async length => {
    const response = await supertest(app).post('/create').send({
      reason: 'r'.repeat(length - 2), solution: 's', future: 'f',
    });
    expect(response.status).toBe(length === 3600 ? 200 : 400);
    expect(mocks.createAppeal).toHaveBeenCalledTimes(length === 3600 ? 1 : 0);
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
    const response = await supertest(app).post('/create').send({
      reason: 'Reason', solution: 'Solution', future: 'Future', extra: 'Extra',
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Appeal submitted successfully' });
    expect(mocks.rollbackAppeal).not.toHaveBeenCalled();
  });
});
