import KcAdminClient from '@keycloak/keycloak-admin-client';

const F = f(__filename);

// Initialize Keycloak Admin Client
const kcAdminClient = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  realmName: process.env.KEYCLOAK_REALM || 'TripSit',
});

let isAuthenticated = false;
let authPromise: Promise<void> | null = null;

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
        clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID as string,
        clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET as string,
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

// Helper function to get Discord ID from user's federated identities
export async function getDiscordIdFromFederatedIdentity(userId: string): Promise<string | null> {
  try {
    const adminClient = await getAdminClient();

    const federatedIdentities = await adminClient.users.listFederatedIdentities({
      id: userId,
      realm: process.env.KEYCLOAK_REALM || 'TripSit',
    });

    const discordProvider = federatedIdentities.find(
      (provider: any) => provider.identityProvider === 'discord',
    );

    if (discordProvider) {
      log.debug(F, `Found Discord provider for user ${userId}: ${discordProvider.userId}`);
      return discordProvider.userId as string;
    }

    log.debug(F, `No Discord provider found for user ${userId}`);
    return null;
  } catch (error) {
    log.error(F, `Error getting Discord ID for user ${userId}: ${error}`);
    throw error;
  }
}
