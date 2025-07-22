import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

import KcAdminClient from '@keycloak/keycloak-admin-client';

const F = f(__filename);

// Initialize Keycloak Admin Client
const kcAdminClient = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080',
  realmName: process.env.KEYCLOAK_REALM || 'master',
});

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

    // Fetch all users in batches
    const allUsers = await fetchAllUsers();
    log.debug(F, `Found ${allUsers.length} total users to search through`);

    // Process users in parallel batches to find matching GitHub identity
    const BATCH_SIZE = 10; // Process 10 users at a time to avoid overwhelming the API
    const batches = [];

    // Create batches
    for (let index = 0; index < allUsers.length; index += BATCH_SIZE) {
      batches.push(allUsers.slice(index, index + BATCH_SIZE));
    }

    // Process all batches in parallel
    const batchResults = await Promise.all(
      batches.map(async (batch) =>
        Promise.all(batch.map(async (user) => checkUserIdentities(user, githubUsername))),
      ),
    );

    // Flatten results and find first match
    const matchedResult = batchResults.flat().find((result) => result !== null);
    if (matchedResult) {
      return matchedResult;
    }

    log.info(F, `No user found with GitHub username: ${githubUsername}`);
    return null;
  } catch (error) {
    log.error(F, `Error looking up Discord user by GitHub username ${githubUsername}: ${error}`);
    throw error;
  }
}

// Authenticate with Keycloak
async function authenticateKeycloak() {
  try {
    await kcAdminClient.auth({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      grantType: 'client_credentials',
    });
    log.debug(F, 'Successfully authenticated with Keycloak');
  } catch (error) {
    log.error(F, `Failed to authenticate with Keycloak: ${error}`);
    throw error;
  }
}

/**
 * Check a user's federated identities for GitHub and Discord accounts
 * @param {any} user - The Keycloak user object
 * @param {string} githubUsername - The GitHub username to match
 * @returns {Promise<Object|null>} Discord user info if found, null otherwise
 */
async function checkUserIdentities(
  user: UserRepresentation,
  githubUsername: string,
): Promise<null | {
  email: null | string;
  githubUsername: string;
  id: string;
  keycloakUserId: string | undefined;
  username: string;
}> {
  try {
    // Get federated identities for this user
    const federatedIdentities = await kcAdminClient.users.listFederatedIdentities({
      id: user.id!,
      realm: process.env.KEYCLOAK_REALM || 'master',
    });

    // Look for GitHub identity
    const githubIdentity = federatedIdentities.find(
      (identity) =>
        identity.identityProvider === 'github' &&
        identity.userName &&
        identity.userName.toLowerCase() === githubUsername.toLowerCase(),
    );

    if (!githubIdentity) {
      return null;
    }

    log.debug(F, `Found user ${user.id} with GitHub username ${githubUsername}`);

    // Look for Discord identity for the same user
    const discordIdentity = federatedIdentities.find(
      (identity) => identity.identityProvider === 'discord',
    );

    if (discordIdentity) {
      log.debug(F, `Found Discord identity for user: ${discordIdentity.userName}`);

      return {
        email: user.email || null, // Email from Keycloak user
        githubUsername: githubIdentity.userName!, // GitHub username
        id: discordIdentity.userId!, // Discord user ID
        keycloakUserId: user.id, // Keycloak user ID
        username: discordIdentity.userName!, // Discord username
      };
    }

    log.warn(F, `User ${user.id} has GitHub account but no Discord account linked`);
    return null;
  } catch (error) {
    // Some users might not have federated identities, that's okay
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.debug(F, `No federated identities for user ${user.id}: ${errorMessage}`);
    return null;
  }
}

async function fetchAllUsers(): Promise<UserRepresentation[]> {
  const max = 100;
  const maxUsers = 10_000; // Safety limit

  // Create an array of page numbers to fetch
  const pageCount = Math.ceil(maxUsers / max);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index);

  // Fetch pages in parallel batches
  const PARALLEL_PAGES = 5; // Fetch 5 pages at a time

  // Create all page batches
  const pageBatches = [];
  for (let index = 0; index < pageNumbers.length; index += PARALLEL_PAGES) {
    pageBatches.push(pageNumbers.slice(index, index + PARALLEL_PAGES));
  }

  // Fetch all pages in parallel
  const allPageResults = await Promise.all(
    pageBatches.map(async (pageNumberBatch) =>
      Promise.all(
        pageNumberBatch.map(async (pageNumber) =>
          kcAdminClient.users.find({
            first: pageNumber * max,
            max,
            realm: process.env.KEYCLOAK_REALM || 'master',
          }),
        ),
      ),
    ),
  );

  // Process results and collect users
  return allPageResults.reduce<UserRepresentation[]>((accumulator, batchResults, index) => {
    const batchUsers = batchResults.flat();

    // Only include results up to and including the first incomplete batch
    if (
      index === 0 ||
      !allPageResults.slice(0, index).some((batch) => batch.flat().length < batch.length * max)
    ) {
      accumulator.push(...batchUsers);
    }

    return accumulator;
  }, []);
}

export default getDiscordUserByGitHub;
