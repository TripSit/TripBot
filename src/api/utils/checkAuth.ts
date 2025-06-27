import { Request, Response } from 'express';

const F = f(__filename);

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
    // Existing Basic auth logic
    const myToken = Buffer.from(`${env.API_USERNAME}:${env.API_PASSWORD}`).toString('base64');

    if (authToken !== myToken) {
      log.error(F, 'Authorization token is not valid');
      res.status(401).send('Authorization token is not valid');
      return false;
    }
  } else if (authType === 'Bearer') {
    // New Bearer token logic
    if (!env.TRIPBOT_API_TOKEN) {
      log.error(F, 'TRIPBOT_API_TOKEN not configured');
      res.status(500).send('Server authentication misconfigured');
      return false;
    }

    if (authToken !== env.TRIPBOT_API_TOKEN) {
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
