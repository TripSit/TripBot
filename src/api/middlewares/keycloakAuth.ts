import { Request, Response, NextFunction } from 'express';
import { getDiscordIdFromFederatedIdentity } from '../../global/utils/keycloak';

const F = f(__filename);

interface KeycloakUserInfo {
  sub: string;
  discord_id?: string;
}

interface AuthenticatedRequest extends Request {
  user?: KeycloakUserInfo;
}

export default async function keycloakAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    log.info(F, `🔍 Auth middleware - processing token for: ${req.path}`);

    // Validate token with Keycloak
    const userInfoRes = await fetch(`${process.env.KEYCLOAK_URL}/realms/TripSit/protocol/openid-connect/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userInfoRes.ok) {
      log.error(F, `❌ Auth middleware - Keycloak userinfo failed: ${userInfoRes.status}`);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    const userInfo = await userInfoRes.json() as KeycloakUserInfo;

    log.info(F, `✅ Auth middleware - Got user info: ${JSON.stringify(userInfo, null, 2)}`);

    // Get Discord ID using admin client
    try {
      log.info(F, '🔍 Auth middleware - Getting Discord ID from federated identities...');

      const discordId = await getDiscordIdFromFederatedIdentity(userInfo.sub);

      if (discordId) {
        userInfo.discord_id = discordId;
        log.info(F, `✅ Auth middleware - Found Discord ID: ${discordId}`);
      } else {
        log.info(F, '❌ Auth middleware - No Discord provider found');
      }
    } catch (error) {
      log.error(F, `❌ Auth middleware - Error getting Discord ID: ${error}`);
    }

    log.info(F, `🏁 Auth middleware - Final user object: ${JSON.stringify(userInfo, null, 2)}`);
    req.user = userInfo;
    next();
  } catch (error) {
    log.error(F, `💥 Auth middleware - Unexpected error: ${error}`);
    res.status(500).json({ error: 'Authentication error' });
  }
}

export { AuthenticatedRequest };
