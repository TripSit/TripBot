import KcAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

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
      grantType: 'client_credentials',
      clientId: process.env.KEYCLOAK_CLIENT_ID as string,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    });
    log.debug(F, 'Successfully authenticated with Keycloak');
  } catch (error) {
    log.error(F, `Failed to authenticate with Keycloak: ${error}`);
    throw error;
  }
}

async function fetchAllUsers(): Promise<UserRepresentation[]> {
  const max = 100;
  const maxUsers = 10000; // Safety limit

  // Create an array of page numbers to fetch
  const pageCount = Math.ceil(maxUsers / max);
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i);

  // Fetch pages in parallel batches
  const PARALLEL_PAGES = 5; // Fetch 5 pages at a time

  // Create all page batches
  const pageBatches = [];
  for (let i = 0; i < pageNumbers.length; i += PARALLEL_PAGES) {
    pageBatches.push(pageNumbers.slice(i, i + PARALLEL_PAGES));
  }

  // Fetch all pages in parallel
  const allPageResults = await Promise.all(
    pageBatches.map(pageNumberBatch => Promise.all(
      pageNumberBatch.map(pageNum => kcAdminClient.users.find({
        first: pageNum * max,
        max,
        realm: process.env.KEYCLOAK_REALM || 'master',
      })),
    )),
  );

  // Process results and collect users
  return allPageResults.reduce<UserRepresentation[]>((acc, batchResults, index) => {
    const batchUsers = batchResults.flat();

    // Only include results up to and including the first incomplete batch
    if (index === 0 || !allPageResults.slice(0, index).some(batch => batch.flat().length < batch.length * max)) {
      acc.push(...batchUsers);
    }

    return acc;
  }, []);
}

/**
 * Check a user's federated identities for GitHub and Discord accounts
 * @param {any} user - The Keycloak user object
 * @param {string} githubUsername - The GitHub username to match
 * @returns {Promise<Object|null>} Discord user info if found, null otherwise
 */
async function checkUserIdentities(user: UserRepresentation, githubUsername: string): Promise<{
  id: string;
  username: string;
  keycloakUserId: string | undefined;
  githubUsername: string;
  email: string | null;
} | null> {
  try {
    // Get federated identities for this user
    const federatedIdentities = await kcAdminClient.users.listFederatedIdentities({
      id: user.id as string,
      realm: process.env.KEYCLOAK_REALM || 'master',
    });

    // Look for GitHub identity
    const githubIdentity = federatedIdentities.find(
      identity => identity.identityProvider === 'github'
      && identity.userName
      && identity.userName.toLowerCase() === githubUsername.toLowerCase(),
    );

    if (!githubIdentity) {
      return null;
    }

    log.debug(F, `Found user ${user.id} with GitHub username ${githubUsername}`);

    // Look for Discord identity for the same user
    const discordIdentity = federatedIdentities.find(
      identity => identity.identityProvider === 'discord',
    );

    if (discordIdentity) {
      log.debug(F, `Found Discord identity for user: ${discordIdentity.userName}`);

      return {
        id: discordIdentity.userId as string, // Discord user ID
        username: discordIdentity.userName as string, // Discord username
        keycloakUserId: user.id, // Keycloak user ID
        githubUsername: githubIdentity.userName as string, // GitHub username
        email: user.email || null, // Email from Keycloak user
      };
    }

    log.warn(F, `User ${user.id} has GitHub account but no Discord account linked`);
    return null;
  } catch (error) {
    // Some users might not have federated identities, that's okay
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.debug(F, `No federated identities for user ${user.id}: ${errorMsg}`);
    return null;
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

    // Fetch all users in batches
    const allUsers = await fetchAllUsers();
    log.debug(F, `Found ${allUsers.length} total users to search through`);

    // Process users in parallel batches to find matching GitHub identity
    const BATCH_SIZE = 10; // Process 10 users at a time to avoid overwhelming the API
    const batches = [];

    // Create batches
    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      batches.push(allUsers.slice(i, i + BATCH_SIZE));
    }

    // Process all batches in parallel
    const batchResults = await Promise.all(
      batches.map(batch => Promise.all(batch.map(user => checkUserIdentities(user, githubUsername)))),
    );

    // Flatten results and find first match
    const matchedResult = batchResults.flat().find(result => result !== null);
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

export default getDiscordUserByGitHub;
