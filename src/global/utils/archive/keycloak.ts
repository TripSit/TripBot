import KeycloakAdminClient from 'keycloak-admin';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';

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
export async function findUser(identifier: string): Promise<UserRepresentation | false> {
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

/**
 *
 * @param {String} identifier
 * @returns {RoleMappings}
 */
export async function getUserRoleMappings(identifier:string):Promise<any | false> {
  await ensureAuthentication();
  // Find the user by identifier
  const user = await findUser(identifier);

  if (!user) {
    return false;
  }

  if (!user.id) {
    return false;
  }

  // Retrieve the role mappings for the user
  return kcAdminClient.users.listRealmRoleMappings({ id: user.id });
}

/**
 * Check if a user has a specific role
 *
 * @param {String} identifier can be a username, email or UUID.
 * @param  {String} roleName human-readable name of the role (case sensitive!)
 */
export async function hasRole(identifier:string, roleName:string):Promise<Boolean> {
  await ensureAuthentication();
  const userRoleMappings = await getUserRoleMappings(identifier);
  if (!userRoleMappings) return false;
  return userRoleMappings.some((role: { name: string; }) => role.name === roleName);
}

/**
 * Get all members of a specified role
 *
 * @param {String} roleName
 * @returns {RoleMembers} roleMembers
 */
export async function getRoleMembers(roleName:string):Promise<any> {
  await ensureAuthentication();
  const users = await kcAdminClient.users.find();
  const roleMembers = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const user of users) {
    // eslint-disable-next-line no-await-in-loop
    const userRoles = await kcAdminClient.users.listRealmRoleMappings({ id: user.id as string });
    if (userRoles.some(userRole => userRole.name === roleName)) {
      roleMembers.push(user.username);
    }
  }
  return roleMembers;
}

/**
 * Set an attribute for a user
 *
 * @param {String} identifier username, id or email
 * @param {String} attributeName Name of the attribute to set
 * @param {String} attributeValue Value of the attribute to set
 *
 *  @returns {Boolean}
 */
export async function setUserAttribute(
  identifier:string,
  attributeName:string,
  attributeValue:string,
):Promise<Boolean> {
  await ensureAuthentication();
  try {
    await kcAdminClient.users.update(
      { id: ((await findUser(identifier)).id) },
      { attributes: { [attributeName]: attributeValue } },
    );
    return true;
  } catch (error) {
    log.error(F, `Failed to set attribute "${attributeName}" for user ${identifier}":`);
    // eslint-disable-next-line no-console
    // console.log(error);
    return false;
  }
}

/**
 * Get a specific attribute from a user
 *
 * @param {String} identifier email, username or id of the user
 * @param {String} attributeName name of the attribute to get
 *
 * @returns {UserAttribute}
 */
// eslint-disable-next-line max-len
export async function getUserAttribute(identifier:string, attributeName:string): Promise<{ name: string, value: string } | false> {
  await ensureAuthentication();
  const user = await findUser(identifier);
  return user?.attributes?.[attributeName] ?? false;
}

/**
 *
 * @param {String} identifier
 * @param {String} attributeName
 * @returns {Boolean}
 */
export async function deleteUserAttribute(identifier: string, attributeName: string): Promise<boolean> {
  await ensureAuthentication();
  const user = await findUser(identifier);
  if (!user) return false;
  const attribute = user.attributes[attributeName];
  if (!attribute) return false;
  delete user.attributes[attributeName];
  await kcAdminClient.users.update({ id: user.id }, user);
  return true;
}
