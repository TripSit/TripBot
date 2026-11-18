import express from 'express';
import supertest from 'supertest';

const fetchMock = vi.fn();
const tokenPath = '/api/v2/keycloak/token';
let app: express.Express;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('KEYCLOAK_BAN_APPEALS_CLIENT_ID', 'test-appeals-client');
  vi.stubEnv('KEYCLOAK_URL', 'https://identity.example.test');
  vi.stubEnv('DNS_DOMAIN', 'example.test');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ access_token: 'test-access' }) });
  const { default: router } = await import('./v2/keycloak/keycloak.routes');
  app = express();
  app.use(express.json());
  app.use('/api/v2/keycloak', router);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each([
  undefined, null, 42, {}, [], '',
  'a'.repeat(42), 'a'.repeat(129),
  `${'a'.repeat(42)}+`, `${'a'.repeat(42)}/`, `${'a'.repeat(42)}=`,
  `${'a'.repeat(43)} `, `${'a'.repeat(43)}\n`, `${'a'.repeat(43)}\r`, `${'a'.repeat(42)}é`,
])('rejects a missing or malformed verifier before contacting Keycloak (%j)', async codeVerifier => {
  const response = await supertest(app).post(tokenPath).send({
    code: 'test-code', code_verifier: codeVerifier,
  });
  expect(response.status).toBe(400);
  expect(response.body).toEqual({ error: 'Missing or invalid code verifier' });
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([
  'a'.repeat(43), 'b'.repeat(128), `${'a'.repeat(39)}-._~`,
  'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
])('forwards a valid verifier unchanged in the form-encoded token request (%s)', async codeVerifier => {
  const response = await supertest(app).post(tokenPath).send({
    code: 'test-code', code_verifier: codeVerifier,
  });
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ access_token: 'test-access' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(
    'https://identity.example.test/realms/TripSit/protocol/openid-connect/token',
    expect.objectContaining({ method: 'POST' }),
  );
  const { body, headers } = fetchMock.mock.calls[0][1];
  expect(headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
  expect(Object.fromEntries(body as URLSearchParams)).toEqual({
    grant_type: 'authorization_code',
    code: 'test-code',
    code_verifier: codeVerifier,
    client_id: 'test-appeals-client',
    redirect_uri: 'https://example.test/appeal',
  });
});

it('still requires an authorization code', async () => {
  const response = await supertest(app).post(tokenPath).send({ code_verifier: 'a'.repeat(43) });
  expect(response.status).toBe(400);
  expect(response.body).toEqual({ error: 'Missing code' });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('does not issue tokens when Keycloak rejects the proof', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'invalid_grant' });
  const response = await supertest(app).post(tokenPath).send({
    code: 'test-code', code_verifier: 'a'.repeat(43),
  });
  expect(response.status).toBe(500);
  expect(response.body).toEqual({ error: 'Server error' });
});
