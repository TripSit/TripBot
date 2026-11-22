import KcAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

const F = f(__filename);

// Initialize Keycloak Admin Client
const kcAdminClient = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_URL ?? 'http://localhost:8080',
  realmName: process.env.KEYCLOAK_REALM ?? 'TripSit',
});

let isAuthenticated = false;
let authPromise: Promise<void> | null = null;

// Discord ID cache - stores userId -> {discordId, timestamp}
const discordIdCache = new Map<string, { discordId: string | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to check if cache entry is still valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

// Authenticate with Keycloak admin client
async function authenticateAdmin(): Promise<void> {
  if (isAuthenticated) {
    return;
  }

  if (authPromise) {
    await authPromise;
    return;
  }

  authPromise = (async (): Promise<void> => {
    try {
      await kcAdminClient.auth({
        grantType: 'client_credentials',
        clientId: process.env.KEYCLOAK_BAN_APPEALS_ADMIN_CLIENT_ID as string,
        clientSecret: process.env.KEYCLOAK_BAN_APPEALS_ADMIN_CLIENT_SECRET as string,
      });
      isAuthenticated = true;
      log.debug(F, 'Successfully authenticated admin client with Keycloak');
    } catch (error) {
      log.error(F, `Failed to authenticate admin client with Keycloak: ${error}`);
      authPromise = null;
      throw error;
    }
  })();

  await authPromise;
}

// Get authenticated admin client
export async function getAdminClient(): Promise<KcAdminClient> {
  await authenticateAdmin();
  return kcAdminClient;
}

/** Looks up (and caches) the Discord ID linked to a Keycloak user. `suffix` describes the attempt in the logs. */
async function lookupDiscordId(userId: string, suffix = ''): Promise<string | null> {
  const adminClient = await getAdminClient();

  const federatedIdentities = await adminClient.users.listFederatedIdentities({
    id: userId,
    realm: process.env.KEYCLOAK_REALM ?? 'TripSit',
  });

  const discordProvider = federatedIdentities.find(
    (provider: any) => provider.identityProvider === 'discord',
  );

  const discordId = discordProvider ? discordProvider.userId as string : null;

  // Cache the result
  discordIdCache.set(userId, {
    discordId,
    timestamp: Date.now(),
  });

  if (discordId) {
    log.debug(F, `Found Discord provider${suffix}`);
  } else {
    log.debug(F, `No Discord provider found${suffix}`);
  }

  return discordId;
}

// Helper function to get Discord ID from user's federated identities
export async function getDiscordIdFromFederatedIdentity(userId: string): Promise<string | null> {
  // Check cache first
  const cached = discordIdCache.get(userId);
  if (cached && isCacheValid(cached.timestamp)) {
    log.debug(F, 'Using cached Discord ID');
    return cached.discordId;
  }

  try {
    return await lookupDiscordId(userId);
  } catch (error) {
    // If we get a 401, the admin token expired - reset authentication and try once more
    if (!(error instanceof Error && error.message.includes('401'))) {
      log.error(F, `Error getting Discord ID: ${error}`);
      throw error;
    }

    log.error(F, 'Admin token expired, re-authenticating and retrying');

    // Reset authentication state
    isAuthenticated = false;
    authPromise = null;

    try {
      // Try once more with fresh authentication
      return await lookupDiscordId(userId, ' after re-auth');
    } catch (retryError) {
      log.error(F, `Error getting Discord ID after re-auth: ${retryError}`);
      throw retryError;
    }
  }
}

// Helper function to fetch all users, one page at a time, stopping at the first page that is not full
async function fetchAllUsers(): Promise<UserRepresentation[]> {
  const adminClient = await getAdminClient();
  const max = 100;
  const maxUsers = 10000; // Safety limit

  const users: UserRepresentation[] = [];
  for (let first = 0; first < maxUsers; first += max) {
    // eslint-disable-next-line no-await-in-loop
    const page = await adminClient.users.find({
      first,
      max,
      realm: process.env.KEYCLOAK_REALM ?? 'TripSit',
    });
    users.push(...page);
    if (page.length < max) break;
  }
  return users;
}

// Helper function to check user identities for GitHub and Discord accounts
async function checkUserIdentities(user: UserRepresentation, githubUsername: string): Promise<{
  id: string;
  username: string;
  keycloakUserId: string | undefined;
  githubUsername: string;
  email: string | null;
} | null> {
  try {
    const adminClient = await getAdminClient();

    // Get federated identities for this user
    const federatedIdentities = await adminClient.users.listFederatedIdentities({
      id: user.id as string,
      realm: process.env.KEYCLOAK_REALM ?? 'TripSit',
    });

    // Look for GitHub identity
    const githubIdentity = federatedIdentities.find(
      identity => identity.identityProvider === 'github'
      && identity.userName?.toLowerCase() === githubUsername.toLowerCase(),
    );

    if (!githubIdentity) {
      return null;
    }

    log.debug(F, `Found user with GitHub username ${githubUsername}`);

    // Look for Discord identity for the same user
    const discordIdentity = federatedIdentities.find(
      identity => identity.identityProvider === 'discord',
    );

    if (discordIdentity) {
      log.debug(F, 'Found Discord identity for user');

      return {
        id: discordIdentity.userId as string, // Discord user ID
        username: discordIdentity.userName as string, // Discord username
        keycloakUserId: user.id, // Keycloak user ID
        githubUsername: githubIdentity.userName as string, // GitHub username
        email: user.email ?? null, // Email from Keycloak user
      };
    }

    log.info(F, 'User has GitHub account but no Discord account linked');
    return null;
  } catch (error) {
    // Some users might not have federated identities, that's okay
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.debug(F, `No federated identities for user: ${errorMsg}`);
    return null;
  }
}

/**
 * Find Discord user info by GitHub username
 * @param {string} githubUsername - The GitHub username to search for
 * @returns {Object|null} - Discord user info or null if not found
 */
async function lookupDiscordUserByGitHub(githubUsername: string) {
  try {
    log.debug(F, `Looking up Discord user for GitHub username: ${githubUsername}`);

    // Ensure we're authenticated
    await authenticateAdmin();

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

// A lookup by GitHub username scans every Keycloak user, so successful matches are remembered for a while.
// Misses are not cached: a contributor who links their accounts right after a miss must be found on the next try.
const GITHUB_CACHE_TTL = 10 * 60 * 1000;
type GitHubMatch = NonNullable<Awaited<ReturnType<typeof lookupDiscordUserByGitHub>>>;
const githubMatchCache = new Map<string, { match: GitHubMatch; timestamp: number }>();

export async function getDiscordUserByGitHub(githubUsername: string) {
  const cacheKey = githubUsername.toLowerCase();
  const cached = githubMatchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GITHUB_CACHE_TTL) {
    log.debug(F, 'Using cached GitHub to Discord match');
    return cached.match;
  }
  const match = await lookupDiscordUserByGitHub(githubUsername);
  if (match) githubMatchCache.set(cacheKey, { match, timestamp: Date.now() });
  return match;
}

export default getDiscordUserByGitHub;
