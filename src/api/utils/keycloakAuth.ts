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
    // Check for Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Validate token with Keycloak
    const userInfoRes = await fetch(`${process.env.KEYCLOAK_URL}/realms/TripSit/protocol/openid-connect/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userInfoRes.ok) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const userInfo = await userInfoRes.json();

    // Get Discord ID from identity providers
    try {
      const adminToken = await getAdminToken(); // We'll need to import this

      const identityRes = await fetch(
        `${process.env.KEYCLOAK_URL}/admin/realms/TripSit/users/${userInfo.sub}/federated-identity`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      if (identityRes.ok) {
        const identityProviders = await identityRes.json();
        const discordProvider = identityProviders.find(
          (provider: any) => provider.identityProvider === 'discord',
        );

        if (discordProvider) {
          userInfo.discord_id = discordProvider.userId;
        }
      }
    } catch (error) {
      log.warn(F, `Failed to get Discord ID for user ${userInfo.sub}: ${error}`);
    }

    // Attach user info to request
    req.user = userInfo;
    next();
  } catch (error) {
    log.error(F, `Auth middleware error: ${error}`);
    res.status(500).json({ error: 'Authentication error' });
  }
}

export { AuthenticatedRequest };
