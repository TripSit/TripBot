import crypto from 'crypto';
import { Request, Response } from 'express';

const F = f(__filename);

type AuthFailure = { status: number; message: string };

/** Compares in constant time, so the response time does not reveal how much of a secret was right. */
function safeEqual(given: string, expected: string): boolean {
  const givenBuf = Buffer.from(given);
  const expectedBuf = Buffer.from(expected);
  return givenBuf.length === expectedBuf.length && crypto.timingSafeEqual(givenBuf, expectedBuf);
}

function checkBasic(authToken: string): AuthFailure | null {
  if (!env.API_USERNAME || !env.API_PASSWORD) {
    log.error(F, 'API_USERNAME or API_PASSWORD not configured on server');
    return { status: 500, message: 'Server authentication misconfigured' };
  }
  const myToken = Buffer.from(`${env.API_USERNAME}:${env.API_PASSWORD}`).toString('base64');
  if (!safeEqual(authToken, myToken)) {
    log.error(F, 'Authorization token is not valid');
    return { status: 401, message: 'Authorization token is not valid' };
  }
  return null;
}

function checkBearer(authToken: string): AuthFailure | null {
  if (!env.TRIPBOT_API_TOKEN) {
    log.error(F, 'TRIPBOT_API_TOKEN not configured');
    return { status: 500, message: 'Server authentication misconfigured' };
  }
  if (!safeEqual(authToken, env.TRIPBOT_API_TOKEN)) {
    log.error(F, 'Bearer token is not valid');
    return { status: 401, message: 'Bearer token is not valid' };
  }
  return null;
}

export default async function checkAuth(
  req: Request,
  res: Response,
):Promise<boolean> {
  // log.debug(F, 'Checking auth');
  // Check the authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    log.error(F, 'No authorization header');
    res.status(401).send('No authorization header');
    return false;
  }

  // Check the authorization header is in the correct format
  const authHeaderParts = authHeader.split(' ');
  if (authHeaderParts.length !== 2) {
    log.error(F, 'Authorization header is not in the correct format');
    res.status(401).send('Authorization header is not in the correct format');
    return false;
  }
  // log.debug(F, 'Authorization header is in the correct format!')

  // Check the authorization type and token
  const authType = authHeaderParts[0];
  const authToken = authHeaderParts[1];

  if (!authToken) {
    log.error(F, 'Authorization header does not have a token');
    res.status(401).send('Authorization header does not have a token');
    return false;
  }
  // log.debug(F, 'Authorization header has a token!')

  // Handle different authentication types
  let failure: AuthFailure | null;
  if (authType === 'Basic') {
    failure = checkBasic(authToken);
  } else if (authType === 'Bearer') {
    failure = checkBearer(authToken);
  } else {
    failure = { status: 401, message: 'Unsupported authorization type' };
    log.error(F, `Unsupported authorization type: ${authType}`);
  }
  if (failure) {
    res.status(failure.status).send(failure.message);
    return false;
  }

  log.debug(F, `Authorization token is valid! (${authType})`);
  return true;
}
