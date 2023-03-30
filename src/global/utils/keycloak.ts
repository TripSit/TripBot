import KeycloakAdminClient from 'keycloak-admin';

const F = f(__filename);

// KeyCloak admin client
const kcAdminClient = new KeycloakAdminClient({
  baseUrl: env.KEYCLOAK_BASE_URL,
  realmName: env.KEYCLOAK_REALM_NAME,
});

let authenticated = false;

/**
* Authenticate the admin clien with KeyCloak
*
* @return Promise<void>
* */
export async function authenticate(): Promise<void> {
  await kcAdminClient.auth({
    grantType: 'client_credentials',
    clientId: env.KEYCLOAK_CLIENT_ID,
    clientSecret: env.KEYCLOAK_CLIENT_SECRET,
  });
  authenticated = true;
}

/**
* Ensure the admin client is authenticated with keyCloak
*
* @return Promise<void>
* */
async function ensureAuthentication(): Promise<void> {
  if (!authenticated) {
    await authenticate();
  }
}

/**
* Find a user by any given identifier (username, email or id)
*
* @param {string} identifier
* @returns any
* */
export async function findUser(identifier: string): Promise<any | false> {
  await ensureAuthentication();
  const usersByUsername = await kcAdminClient.users.find({ username: identifier });
  const usersByEmail = await kcAdminClient.users.find({ email: identifier });
  const usersById = await kcAdminClient.users.find({ id: identifier });

  const users = [...usersByUsername, ...usersByEmail, ...usersById];

  if (users.length > 0) {
    return users[0];
  }
  return false;
}
