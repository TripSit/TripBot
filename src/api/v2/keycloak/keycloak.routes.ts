/* eslint-disable sonarjs/no-duplicate-string */
import express from 'express';
import RateLimit from 'express-rate-limit';
import keycloak from './keycloak.queries';
import { getAdminToken } from '../../middlewares/keycloakAuth';

const F = f(__filename);

const router = express.Router();

// Set up rate limiter: maximum of 20 requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
});

// Apply rate limiter to all requests
router.use(limiter);

router.post('/token', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code' });
    }

    const tokenData = await keycloak.exchangeCodeForToken(code);
    return res.status(200).json(tokenData);
  } catch (error) {
    log.error(F, `Error in /token route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/userinfo', async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { access_token } = req.body;
    log.info(F, `Received access token: ${access_token}`);
    if (!access_token || typeof access_token !== 'string') {
      return res.status(400).json({ error: 'Missing access token' });
    }

    const userInfo = await keycloak.getUserInfo(access_token);
    return res.status(200).json(userInfo);
  } catch (error) {
    log.error(F, `Error in /userinfo route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

/*
router.post('/discord-id', async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { access_token } = req.body;

    if (!access_token || typeof access_token !== 'string') {
      return res.status(400).json({ error: 'Missing access token' });
    }

    // First get user info to get the user ID
    const userInfo = await keycloak.getUserInfo(access_token);
    const userId = userInfo.sub; // Keycloak user ID

    // Now fetch the user's identity provider links
    const adminToken = await getAdminToken();

    const identityProvidersRes = await fetch(
      `${process.env.KEYCLOAK_URL}/admin/realms/TripSit/users/${userId}/federated-identity`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!identityProvidersRes.ok) {
      throw new Error('Failed to fetch identity providers');
    }

    const identityProviders = await identityProvidersRes.json();

    // Find the Discord identity provider
    const discordProvider = identityProviders.find(
      (provider: any) => provider.identityProvider === 'discord',
    );

    if (discordProvider) {
      return res.json({
        discord_id: discordProvider.userId,
        userInfo,
      });
    }
    return res.status(404).json({ error: 'No Discord identity provider found' });
  } catch (error) {
    log.error(F, `Error in /discord-id route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});
*/

/*
router.post('/discord-id', async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { access_token } = req.body;

    if (!access_token || typeof access_token !== 'string') {
      return res.status(400).json({ error: 'Missing access token' });
    }

    const discordId = await keycloak.getDiscordId(access_token);
    return res.json({ discord_id: discordId });
  } catch (error) {
    log.error(F, `Error in /discord-id route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});
*/

router.post('/refresh', async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { refresh_token } = req.body;

    if (!refresh_token || typeof refresh_token !== 'string') {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const newTokens = await keycloak.refreshToken(refresh_token);
    return res.status(200).json(newTokens);
  } catch (error) {
    log.error(F, `Error in /refresh route: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
