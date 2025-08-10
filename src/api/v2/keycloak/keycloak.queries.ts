const F = f(__filename);

export default {
  async exchangeCodeForToken(code: string) {
    const KEYCLOAK_URL = `${process.env.KEYCLOAK_URL}/realms/TripSit/protocol/openid-connect/token`;
    const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
    const REDIRECT_URI = `https://${process.env.DNS_DOMAIN}/appeal`;

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
};
