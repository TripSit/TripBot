/* eslint-disable sonarjs/no-duplicate-string */
import { getAdminToken } from '../../middlewares/keycloakAuth';

const F = f(__filename);

const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const REDIRECT_URI = `https://${process.env.DNS_DOMAIN}/appeal`;

export default {
  async exchangeCodeForToken(code: string) {
    const KEYCLOAK_URL = `${process.env.KEYCLOAK_URL}/realms/TripSit/protocol/openid-connect/token`;

    if (!CLIENT_ID) {
      throw new Error('Missing client ID');
    }

    try {
      const tokenRes = await fetch(KEYCLOAK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: CLIENT_ID,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        log.error(F, `Keycloak token error: ${errText}`);
        throw new Error(`Failed to fetch token: ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json();
      log.debug(F, 'Successfully exchanged code for token');
      return tokenData;
    } catch (error) {
      log.error(F, `Error exchanging code for token: ${error}`);
      throw error;
    }
  },
  async getUserInfo(accessToken: string) {
    const KEYCLOAK_URL = `${process.env.KEYCLOAK_URL}/realms/TripSit/protocol/openid-connect/userinfo`;

    try {
      const res = await fetch(KEYCLOAK_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: '', // Empty body is fine when using Authorization header
      });

      if (!res.ok) {
        const errText = await res.text();
        log.error(F, `Keycloak userinfo error: ${errText}`);
        throw new Error(`Failed to fetch user info: ${res.status}`);
      }

      const userInfo = await res.json();
      log.debug(F, 'Successfully fetched user info');
      return userInfo;
    } catch (error) {
      log.error(F, `Error fetching user info: ${error}`);
      throw error;
    }
  },

  async getDiscordId(userAccessToken: string) {
    try {
    // First get user info to get the user ID
      const userInfo = await this.getUserInfo(userAccessToken);
      const userId = userInfo.sub; // Keycloak user ID

      // Get admin token
      const adminToken = await getAdminToken();

      // Fetch the user's identity provider links
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
        const errText = await identityProvidersRes.text();
        log.error(F, `Failed to fetch identity providers: ${errText}`);
        throw new Error('Failed to fetch identity providers');
      }

      const identityProviders = await identityProvidersRes.json();
      log.debug(F, `Identity providers: ${JSON.stringify(identityProviders)}`);

      // Find the Discord identity provider
      const discordProvider = identityProviders.find(
        (provider: any) => provider.identityProvider === 'discord',
      );

      if (discordProvider) {
        log.debug(F, `Found Discord provider: ${JSON.stringify(discordProvider)}`);
        return discordProvider.userId; // This should be the Discord ID
      }
      throw new Error('No Discord identity provider found');
    } catch (error) {
      log.error(F, `Error getting Discord ID: ${error}`);
      throw error;
    }
  },
  async refreshToken(refreshToken: string) {
    if (!process.env.KEYCLOAK_CLIENT_ID) {
      throw new Error('Missing client ID');
    }

    const tokenRes = await fetch(`${process.env.KEYCLOAK_URL}/realms/TripSit/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.KEYCLOAK_CLIENT_ID,
      // Don't include client_secret for public clients
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      log.error(F, `Failed to refresh token: ${errText}`);
      throw new Error('Failed to refresh token');
    }

    const tokenData = await tokenRes.json();
    log.debug(F, 'Successfully refreshed token');
    return tokenData;
  },
};
