/* eslint-disable sonarjs/no-duplicate-string */

const F = f(__filename);

const CLIENT_ID = process.env.KEYCLOAK_BAN_APPEALS_CLIENT_ID;
const DNS_DOMAIN = process.env.DNS_DOMAIN || 'tripsit.me';
const REDIRECT_URI = `https://${DNS_DOMAIN}/appeal`;

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

  async refreshToken(refreshToken: string) {
    if (!process.env.KEYCLOAK_BAN_APPEALS_CLIENT_ID) {
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
        client_id: process.env.KEYCLOAK_BAN_APPEALS_CLIENT_ID,
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
