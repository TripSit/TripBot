import KcAdminClient from '@keycloak/keycloak-admin-client';

const F = f(__filename);

// Initialize Keycloak Admin Client
const kcAdminClient = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080',
  realmName: process.env.KEYCLOAK_REALM || 'master',
});

// Authenticate with Keycloak
async function authenticateKeycloak() {
  try {
    await kcAdminClient.auth({
      username: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'password',
      grantType: 'password',
      clientId: 'admin-cli',
    });
    log.debug(F, 'Successfully authenticated with Keycloak');
  } catch (error) {
    log.error(F, `Failed to authenticate with Keycloak: ${error}`);
    throw error;
  }
}

/**
 * Find Discord user info by GitHub username
 * @param {string} githubUsername - The GitHub username to search for
 * @returns {Object|null} - Discord user info or null if not found
 */
export async function getDiscordUserByGitHub(githubUsername: string) {
  try {
    log.debug(F, `Looking up Discord user for GitHub username: ${githubUsername}`);

    // Ensure we're authenticated
    await authenticateKeycloak();

    // Search for users - we'll need to get all users and filter by federated identities
    // Unfortunately Keycloak doesn't have a direct way to search by federated identity
    let allUsers = [];
    let first = 0;
    const max = 100; // Get users in batches
    let hasMore = true;

    while (hasMore) {
      const userBatch = await kcAdminClient.users.find({
        first,
        max,
        realm: process.env.KEYCLOAK_REALM || 'master',
      });

      if (userBatch.length === 0) {
        hasMore = false;
      } else {
        allUsers = allUsers.concat(userBatch);
        first += max;

        // Safety check to avoid infinite loops
        if (first > 10000) {
          log.warn(F, 'Breaking user search at 10000 users to avoid infinite loop');
          hasMore = false;
        }
      }
    }

    log.debug(F, `Found ${allUsers.length} total users to search through`);

    // Now check each user's federated identities
    for (const user of allUsers) {
      try {
        // Get federated identities for this user
        const federatedIdentities = await kcAdminClient.users.listFederatedIdentities({
          id: user.id,
          realm: process.env.KEYCLOAK_REALM || 'master',
        });

        // Look for GitHub identity
        const githubIdentity = federatedIdentities.find(identity => identity.identityProvider === 'github'
          && identity.userName.toLowerCase() === githubUsername.toLowerCase());

        if (githubIdentity) {
          log.debug(F, `Found user ${user.id} with GitHub username ${githubUsername}`);

          // Now look for Discord identity for the same user
          const discordIdentity = federatedIdentities.find(identity => identity.identityProvider === 'discord');

          if (discordIdentity) {
            log.debug(F, `Found Discord identity for user: ${discordIdentity.userName}`);

            return {
              id: discordIdentity.userId, // Discord user ID
              username: discordIdentity.userName, // Discord username
              keycloakUserId: user.id,
              githubUsername: githubIdentity.userName,
              email: user.email || null,
            };
          }
          log.warn(F, `User ${user.id} has GitHub account but no Discord account linked`);
          return null;
        }
      } catch (identityError) {
        // Some users might not have federated identities, that's okay
        log.debug(F, `No federated identities for user ${user.id}:`, identityError.message);
        continue;
      }
    }

    log.info(F, `No user found with GitHub username: ${githubUsername}`);
    return null;
  } catch (error) {
    log.error(F, `Error looking up Discord user by GitHub username ${githubUsername}:`, error);
    throw error;
  }
}

/**
 * Alternative function if you want to search by a specific attribute instead
 * This assumes you store GitHub username in a custom attribute
 */
export async function getDiscordUserByGitHubAttribute(githubUsername) {
  try {
    await authenticateKeycloak();

    // Search by custom attribute (if you store GitHub username as an attribute)
    const users = await kcAdminClient.users.find({
      q: `github_username:${githubUsername}`,
      realm: process.env.KEYCLOAK_REALM || 'master',
    });

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Get Discord federated identity
    const federatedIdentities = await kcAdminClient.users.listFederatedIdentities({
      id: user.id,
      realm: process.env.KEYCLOAK_REALM || 'master',
    });

    const discordIdentity = federatedIdentities.find(identity => identity.identityProvider === 'discord');

    if (!discordIdentity) {
      return null;
    }

    return {
      id: discordIdentity.userId,
      username: discordIdentity.userName,
      keycloakUserId: user.id,
      githubUsername,
      email: user.email || null,
    };
  } catch (error) {
    log.error(F, 'Error in alternative lookup:', error);
    throw error;
  }
}
