import Express, { Request, Response } from 'express';

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

  // Check the authorization header is a basic token
  const authHeaderType = authHeaderParts[0];
  if (authHeaderType !== 'Basic') {
    log.error(F, 'Authorization header is not a basic token');
    res.status(401).send('Authorization header is not a basic token');
    return false;
  }
  // log.debug(F, 'Authorization header is a basic token!')

  // Check the authorization header has a token
  const authToken = authHeaderParts[1];
  if (!authToken) {
    log.error(F, 'Authorization header does not have a token');
    res.status(401).send('Authorization header does not have a token');
    return false;
  }
  // log.debug(F, 'Authorization header has a token!')

  // Check the authorization token is valid
  const myToken = Buffer.from(`${env.API_USERNAME}:${env.API_PASSWORD}`).toString('base64');

  if (authToken !== myToken) {
    log.error(F, 'Authorization token is not valid');
    log.error(F, `authToken: ${authToken}`);
    log.error(F, `myToken: ${myToken}`);
    log.error(F, `env.API_USERNAME: ${env.API_USERNAME}`);
    log.error(F, `env.API_PASSWORD: ${env.API_PASSWORD}`);
    res.status(401).send('Authorization token is not valid');
    return false;
  }

  log.debug(F, 'Authorization token is valid!')
  return true;
}