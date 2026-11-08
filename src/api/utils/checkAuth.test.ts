import { Request, Response } from 'express';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import checkAuth from './checkAuth';

const MISCONFIGURED_ERROR = 'Server authentication misconfigured';
const TEST_CREDENTIALS = 'testuser:testpassword';

describe('checkAuth', () => {
  let mockRes: Response;
  let statusMock: ReturnType<typeof vi.fn>;
  let sendMock: ReturnType<typeof vi.fn>;
  const origUsername = env.API_USERNAME;
  const origPassword = env.API_PASSWORD;
  const origTripbotToken = env.TRIPBOT_API_TOKEN;

  beforeEach(() => {
    statusMock = vi.fn().mockReturnThis();
    sendMock = vi.fn().mockReturnThis();
    mockRes = {
      status: statusMock,
      send: sendMock,
    } as unknown as Response;

    env.API_USERNAME = 'testuser';
    env.API_PASSWORD = 'testpassword';
    env.TRIPBOT_API_TOKEN = 'valid_bearer_token';
  });

  afterEach(() => {
    env.API_USERNAME = origUsername;
    env.API_PASSWORD = origPassword;
    env.TRIPBOT_API_TOKEN = origTripbotToken;
  });

  it('rejects requests with no authorization header with 401', async () => {
    const req = { headers: {} } as Request;
    const result = await checkAuth(req, mockRes);

    expect(result).toBe(false);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith('No authorization header');
  });

  it('rejects requests with invalid authorization format with 401', async () => {
    const req = { headers: { authorization: 'Basic' } } as Request;
    const result = await checkAuth(req, mockRes);

    expect(result).toBe(false);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith('Authorization header is not in the correct format');
  });

  it('rejects requests with empty token with 401', async () => {
    const req = { headers: { authorization: 'Basic ' } } as Request;
    const result = await checkAuth(req, mockRes);

    expect(result).toBe(false);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith('Authorization header does not have a token');
  });

  it('rejects unsupported authorization types with 401', async () => {
    const req = { headers: { authorization: 'Digest some-token' } } as Request;
    const result = await checkAuth(req, mockRes);

    expect(result).toBe(false);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith('Unsupported authorization type');
  });

  describe('Basic auth', () => {
    it('returns 500 when API_USERNAME is unset', async () => {
      // @ts-expect-error testing undefined environment variable
      env.API_USERNAME = undefined;
      const validToken = Buffer.from(TEST_CREDENTIALS).toString('base64');
      const req = { headers: { authorization: `Basic ${validToken}` } } as Request;

      const result = await checkAuth(req, mockRes);

      expect(result).toBe(false);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith(MISCONFIGURED_ERROR);
    });

    it('returns 500 when API_PASSWORD is unset', async () => {
      // @ts-expect-error testing undefined environment variable
      env.API_PASSWORD = undefined;
      const validToken = Buffer.from(TEST_CREDENTIALS).toString('base64');
      const req = { headers: { authorization: `Basic ${validToken}` } } as Request;

      const result = await checkAuth(req, mockRes);

      expect(result).toBe(false);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith(MISCONFIGURED_ERROR);
    });

    it('returns 500 when both credentials are unset and rejects base64("undefined:undefined") (#1294)', async () => {
      // @ts-expect-error testing undefined environment variables
      env.API_USERNAME = undefined;
      // @ts-expect-error testing undefined environment variables
      env.API_PASSWORD = undefined;

      // base64("undefined:undefined") === "dW5kZWZpbmVkOnVuZGVmaW5lZA=="
      const undefinedBase64 = Buffer.from('undefined:undefined').toString('base64');
      const req = { headers: { authorization: `Basic ${undefinedBase64}` } } as Request;

      const result = await checkAuth(req, mockRes);

      expect(result).toBe(false);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith(MISCONFIGURED_ERROR);
    });

    it('rejects invalid basic credentials with 401', async () => {
      const invalidToken = Buffer.from('wrong:creds').toString('base64');
      const req = { headers: { authorization: `Basic ${invalidToken}` } } as Request;

      const result = await checkAuth(req, mockRes);

      expect(result).toBe(false);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith('Authorization token is not valid');
    });

    it('authenticates valid basic credentials and returns true', async () => {
      const validToken = Buffer.from(TEST_CREDENTIALS).toString('base64');
      const req = { headers: { authorization: `Basic ${validToken}` } } as Request;

      const result = await checkAuth(req, mockRes);

      expect(result).toBe(true);
      expect(statusMock).not.toHaveBeenCalled();
      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  describe('Bearer auth', () => {
    it('returns 500 when TRIPBOT_API_TOKEN is unset', async () => {
      // @ts-expect-error testing undefined environment variable
      env.TRIPBOT_API_TOKEN = undefined;
      const req = { headers: { authorization: 'Bearer valid_bearer_token' } } as Request;

      const result = await checkAuth(req, mockRes);

      expect(result).toBe(false);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith(MISCONFIGURED_ERROR);
    });

    it('rejects invalid bearer token with 401', async () => {
      const req = { headers: { authorization: 'Bearer wrong_token' } } as Request;

      const result = await checkAuth(req, mockRes);

      expect(result).toBe(false);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith('Bearer token is not valid');
    });

    it('authenticates valid bearer token and returns true', async () => {
      const req = { headers: { authorization: 'Bearer valid_bearer_token' } } as Request;

      const result = await checkAuth(req, mockRes);

      expect(result).toBe(true);
      expect(statusMock).not.toHaveBeenCalled();
      expect(sendMock).not.toHaveBeenCalled();
    });
  });
});
