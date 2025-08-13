import { Request, Response, NextFunction } from 'express';

const F = f(__filename);

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string; // Keycloak user ID
    discord_id?: string;
  };
}

// Helper function to get admin token
export async function getAdminToken() {
  if (!process.env.KEYCLOAK_ADMIN_CLIENT_ID || !process.env.KEYCLOAK_ADMIN_CLIENT_SECRET) {
    throw new Error('Missing required environment variables for Keycloak admin authentication');
  }

  const tokenRes = await fetch(`${process.env.KEYCLOAK_URL}/realms/TripSit/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error('Failed to get admin token');
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
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

    const userInfo = await userInfoRes.json();
    log.info(F, `✅ Auth middleware - Got user info: ${JSON.stringify(userInfo, null, 2)}`);

    // Get Discord ID from identity providers
    try {
      log.info(F, '🔍 Auth middleware - Getting admin token...');
      const adminToken = await getAdminToken();
      log.info(F, '✅ Auth middleware - Got admin token');

      const identityUrl = `${process.env.KEYCLOAK_URL}/admin/realms/TripSit/users/${userInfo.sub}/federated-identity`;
      log.info(F, `🔍 Auth middleware - Fetching identity providers from: ${identityUrl}`);

      const identityRes = await fetch(identityUrl, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (identityRes.ok) {
        const identityProviders = await identityRes.json();
        log.info(F, `✅ Auth middleware - Identity providers: ${JSON.stringify(identityProviders, null, 2)}`);

        const discordProvider = identityProviders.find(
          (provider: any) => provider.identityProvider === 'discord',
        );

        if (discordProvider) {
          userInfo.discord_id = discordProvider.userId;
          log.info(F, `✅ Auth middleware - Found Discord ID: ${discordProvider.userId}`);
        } else {
          log.warn(F, '❌ Auth middleware - No Discord provider found');
        }
      } else {
        const errorText = await identityRes.text();
        log.error(F, `❌ Auth middleware - Identity providers fetch failed: ${identityRes.status} ${errorText}`);
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
