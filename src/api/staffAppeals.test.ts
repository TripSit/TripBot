import express from 'express';
import supertest from 'supertest';
import staff from './v2/appeals/staff.routes';
import { decideStaffAppeal, listStaffAppeals } from './v2/appeals/staff.queries';
import { getDiscordIdFromFederatedIdentity } from '../global/utils/keycloak';

vi.mock('../global/utils/keycloak', () => ({ getDiscordIdFromFederatedIdentity: vi.fn() }));
vi.mock('./v2/appeals/staff.queries', async importOriginal => {
  const original = await importOriginal<typeof import('./v2/appeals/staff.queries')>();
  return { ...original, decideStaffAppeal: vi.fn(), listStaffAppeals: vi.fn() };
});

const authorization = 'Authorization';
const bearerToken = 'Bearer token';
const staffSession = '/staff/session';
const app = express();
app.use(express.json());
app.use('/staff', staff);
const appealId = '11111111-1111-4111-8111-111111111111';
const memberFetch = vi.fn();
const permission = vi.fn();
const guild = { id: 'guild', members: { fetch: memberFetch } };
let identity = 0;

beforeEach(() => {
  identity += 1;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sub: 'keycloak-user' }) }));
  vi.mocked(getDiscordIdFromFederatedIdentity).mockResolvedValue(`reviewer-${identity}`);
  permission.mockReturnValue(true);
  memberFetch.mockResolvedValue({ id: `reviewer-${identity}`, displayName: 'Reviewer', permissions: { has: permission } });
  vi.stubGlobal('discordClient', { guilds: { fetch: vi.fn().mockResolvedValue(guild) } });
  vi.mocked(listStaffAppeals).mockResolvedValue({ appeals: [], hasMore: false });
  vi.mocked(decideStaffAppeal).mockResolvedValue({ success: true });
});
afterEach(() => vi.unstubAllGlobals());

it('requires a validated token before any staff data is read', async () => {
  await supertest(app).get('/staff').expect(401);
  expect(listStaffAppeals).not.toHaveBeenCalled();
  vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);
  await supertest(app).get('/staff').set(authorization, 'Bearer invalid').expect(401);
  expect(listStaffAppeals).not.toHaveBeenCalled();
});

it('denies users without linked staff identity or live ban permission', async () => {
  vi.mocked(getDiscordIdFromFederatedIdentity).mockResolvedValueOnce(null);
  await supertest(app).get(staffSession).set(authorization, bearerToken).expect(403);
  permission.mockReturnValue(false);
  await supertest(app).get('/staff').set(authorization, bearerToken).expect(403);
  expect(listStaffAppeals).not.toHaveBeenCalled();
});

it('fails closed when membership cannot be fetched', async () => {
  memberFetch.mockRejectedValueOnce(new Error('member unavailable'));
  await supertest(app).get('/staff').set(authorization, bearerToken).expect(503);
  expect(listStaffAppeals).not.toHaveBeenCalled();
});

it('fetches fresh membership and returns a minimal staff session', async () => {
  const result = await supertest(app).get(staffSession).set(authorization, bearerToken).expect(200);
  expect(memberFetch).toHaveBeenCalledWith({ user: `reviewer-${identity}`, force: true });
  expect(result.body).toEqual({ canManageAppeals: true, displayName: 'Reviewer' });
  expect(result.headers['cache-control']).toBe('private, no-store');
});

it('validates queue filters and pagination', async () => {
  await supertest(app).get('/staff?status=DENIED&page=2').set(authorization, bearerToken).expect(200);
  expect(listStaffAppeals).toHaveBeenCalledWith('guild', 'DENIED', 2);
  await supertest(app).get('/staff?status=other').set(authorization, bearerToken).expect(400);
  await supertest(app).get('/staff?page=-1').set(authorization, bearerToken).expect(400);
});

it('ignores forged actor IDs and checks permission again on writes', async () => {
  await supertest(app).post(`/staff/${appealId}`).set(authorization, bearerToken)
    .send({ decision: 'ACCEPTED', responseMessage: ' Welcome back ', decidedByDiscordId: 'forged' })
    .expect(200);
  expect(decideStaffAppeal).toHaveBeenCalledWith(guild, appealId, 'ACCEPTED', 'Welcome back', `reviewer-${identity}`);
  permission.mockReturnValue(false);
  await supertest(app).post(`/staff/${appealId}`).set(authorization, bearerToken)
    .send({ decision: 'DENIED', responseMessage: 'No' })
    .expect(403);
  expect(decideStaffAppeal).toHaveBeenCalledTimes(1);
});

it.each([
  { decision: 'RECEIVED', responseMessage: 'No' },
  { decision: 'DENIED', responseMessage: ' ' },
  { decision: 'DENIED', responseMessage: 'x'.repeat(2001) },
])('rejects invalid decisions', async body => {
  await supertest(app).post(`/staff/${appealId}`).set(authorization, bearerToken).send(body)
    .expect(400);
  expect(decideStaffAppeal).not.toHaveBeenCalled();
});

it('rate limits each verified reviewer', async () => {
  const calls = Array.from({ length: 21 }, () => supertest(app).post(`/staff/${appealId}`).set(authorization, bearerToken)
    .send({ decision: 'DENIED', responseMessage: 'No' }));
  const results = await Promise.all(calls);
  expect(results.filter(result => result.status === 429)).toHaveLength(1);
});
