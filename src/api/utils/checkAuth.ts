import { Request, Response } from 'express';
import crypto from 'crypto';

const F = f(__filename);

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function checkAuth(
  req: Request,
  res: Response,
):Promise<boolean> {
  // log.debug(F, 'Checking auth');
  // Check the authorization header
  const authHeader = req.headers.authorization;
  // log.debug(F, `${JSON.stringify(authHeader, null, 2)}`);
  if (!authHeader) {
    log.error(F, 'No authorization header');
    res.status(401).send('No authorization header');
    return false;
  }
  // log.debug(F, 'Authorization header exists!');

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
  if (authType === 'Basic') {
    if (!env.API_USERNAME || !env.API_PASSWORD) {
      log.error(F, 'API_USERNAME or API_PASSWORD not configured');
      res.status(500).send('Server authentication misconfigured');
      return false;
    }

    const myToken = Buffer.from(`${env.API_USERNAME}:${env.API_PASSWORD}`).toString('base64');

    if (!safeCompare(authToken, myToken)) {
      log.error(F, 'Authorization token is not valid');
      res.status(401).send('Authorization token is not valid');
      return false;
    }
  } else if (authType === 'Bearer') {
    if (!env.TRIPBOT_API_TOKEN) {
      log.error(F, 'TRIPBOT_API_TOKEN not configured');
      res.status(500).send('Server authentication misconfigured');
      return false;
    }

    if (!safeCompare(authToken, env.TRIPBOT_API_TOKEN)) {
      log.error(F, 'Bearer token is not valid');
      res.status(401).send('Bearer token is not valid');
      return false;
    }
  } else {
    log.error(F, `Unsupported authorization type: ${authType}`);
    res.status(401).send('Unsupported authorization type');
    return false;
  }

  log.debug(F, `Authorization token is valid! (${authType})`);
  return true;
}
