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
};
