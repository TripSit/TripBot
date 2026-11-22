import express from 'express';
import supertest from 'supertest';
import router from './v2/bounty/bounty.routes';
import { dbMock } from '../vitest/utils/mockDb';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  lookup: vi.fn(),
  award: vi.fn(),
}));

vi.mock('express-rate-limit', () => ({ default: () => (_req: unknown, _res: unknown, next: () => void) => next() }));
vi.mock('./utils/checkAuth', () => ({ default: mocks.auth }));
vi.mock('../global/utils/keycloak', () => ({ getDiscordUserByGitHub: mocks.lookup }));
vi.mock('../global/utils/experience', () => ({ awardGitHubXP: mocks.award }));

const e = env as unknown as Record<string, string>;

const app = express();
app.use(express.json());
app.use(router);
// Unhandled route errors reach Express' default handler as a 500
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { res.status(500).json({ error: 'boom' }); });

const post = (body: Record<string, unknown>) => supertest(app).post('/award-xp').send(body);
const MISSING_FIELDS = 'Missing required fields';
const WHOLE_NUMBER = 'whole number';
const BAD_REFERENCE = 'Reference must look like';
const valid = { github_username: 'octocat', bounty: 100, reference: '12#34' };

function setGuild(member: unknown) {
  (global as unknown as { discordClient: unknown }).discordClient = {
    guilds: {
      fetch: vi.fn(async () => ({
        members: { fetch: vi.fn(async () => { if (!member) throw new Error('Unknown Member'); return member; }) },
        channels: { fetch: vi.fn(async () => ({ id: 'dev' })) },
      })),
    },
  };
}
const contributor = (roles: string[] = []) => ({ id: 'd1', displayName: 'Cat', roles: { cache: { has: (id: string) => roles.includes(id) } } });

beforeEach(() => {
  mocks.auth.mockResolvedValue(true);
  mocks.lookup.mockResolvedValue({ id: 'd1' });
  mocks.award.mockResolvedValue(undefined);
  dbMock.claimed_bounties.create.mockResolvedValue({ id: 'claim1' } as never);
  dbMock.claimed_bounties.delete.mockResolvedValue({} as never);
  setGuild(contributor());
});

describe('POST /award-xp validation', () => {
  it.each([
    [{ bounty: 5 }, MISSING_FIELDS],
    [{ github_username: 'a' }, MISSING_FIELDS],
    [{ github_username: 'a', bounty: 2.5 }, WHOLE_NUMBER],
    [{ github_username: 'a', bounty: '5' }, WHOLE_NUMBER],
    [{ github_username: 'a', bounty: 100000 }, WHOLE_NUMBER],
    [{ github_username: 'a', bounty: -1 }, WHOLE_NUMBER],
    [{ github_username: 'a', bounty: 5, reference: 'abc' }, BAD_REFERENCE],
    [{ github_username: 'a', bounty: 5, reference: 7 }, BAD_REFERENCE],
  ])('rejects %j', async (body, message) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(response.body.error).toContain(message);
    expect(mocks.award).not.toHaveBeenCalled();
  });

  it('passes through when the caller is not authorized', async () => {
    mocks.auth.mockResolvedValue(false);
    const response = await post(valid);
    expect(response.status).toBe(404);
    expect(mocks.award).not.toHaveBeenCalled();
  });
});

describe('POST /award-xp', () => {
  it('records the claim and awards the XP', async () => {
    const response = await post(valid);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, discordUserId: 'd1', bountyAmount: 100 });
    expect(dbMock.claimed_bounties.create).toHaveBeenCalledWith({
      data: {
        type: 'GitHub', amount: 100, user_id: 'd1', reference: '12#34',
      },
    });
    expect(mocks.award).toHaveBeenCalledTimes(1);
  });

  it('keeps accepting requests without a reference, as a plain GitHub claim', async () => {
    const response = await post({ github_username: 'octocat', bounty: 50 });
    expect(response.status).toBe(200);
    expect(dbMock.claimed_bounties.create).toHaveBeenCalledWith({
      data: {
        type: 'GitHub', amount: 50, user_id: 'd1', reference: null,
      },
    });
  });

  it('refuses to pay the same bounty twice, relying on the unique reference', async () => {
    dbMock.claimed_bounties.create.mockRejectedValue(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }));
    const response = await post(valid);
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('12#34');
    expect(mocks.award).not.toHaveBeenCalled();
  });

  it('reports other database failures as errors, not as already awarded', async () => {
    dbMock.claimed_bounties.create.mockRejectedValue(new Error('db down'));
    expect((await post(valid)).status).toBe(500);
    expect(mocks.award).not.toHaveBeenCalled();
  });

  it('releases the claim when awarding fails, so the award can be retried', async () => {
    mocks.award.mockRejectedValue(new Error('discord down'));
    const response = await post(valid);
    expect(response.status).toBe(500);
    expect(dbMock.claimed_bounties.delete).toHaveBeenCalledWith({ where: { id: 'claim1' } });
  });

  it('still reports the award failure when releasing the claim fails too', async () => {
    mocks.award.mockRejectedValue(new Error('discord down'));
    dbMock.claimed_bounties.delete.mockRejectedValue(new Error('db down'));
    expect((await post(valid)).status).toBe(500);
  });

  it('answers 404 for a GitHub user without a linked Discord account', async () => {
    mocks.lookup.mockResolvedValue(null);
    expect((await post(valid)).status).toBe(404);
  });

  it('answers 404 (not 500) for a linked user who is not in the guild', async () => {
    setGuild(null);
    const response = await post(valid);
    expect(response.status).toBe(404);
    expect(response.body.error).toContain('could not be found');
    expect(dbMock.claimed_bounties.create).not.toHaveBeenCalled();
  });

  it('never awards team members', async () => {
    setGuild(contributor([e.ROLE_TEAMTRIPSIT]));
    expect((await post(valid)).status).toBe(403);
    expect(dbMock.claimed_bounties.create).not.toHaveBeenCalled();
  });
});
