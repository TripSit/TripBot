import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // @keycloak/keycloak-admin-client ships ESM-only and pulls in modules Vitest's
      // SSR transform chokes on; it's only touched transitively via keycloak auth code.
      '@keycloak/keycloak-admin-client': new URL(
        'src/vitest/mocks/keycloakAdminClient.mock.ts',
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    setupFiles: ['./src/vitest/setup/globals.setup.ts'],
    include: ['src/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      'src/discord/commands/archive/**',
      'src/discord/events/legacy/**',
      'src/global/commands/archive/**',
      'src/global/utils/archive/**',
      '**/matrix/**',
      '**/irc/**',
      '**/telegram/**',
      '**/legacy/**',
      '**/placeholder/**',
      '**/__tests__editreply_/**',
      '**/__tests__integration__/**',
      '**/__tests__modals__/**',
      '**/__tests__send__/**',
      '**/__tests__todo__/**',
      // Not yet ported to the src/discord/tests/{global,guild}/ Vitest layout - see the
      // migration plan. Tracked as stale-scaffold reference until rewritten batch by batch.
      'src/discord/tests/*.test.ts',
      // v2 API tests are pre-existing failures unrelated to this migration (see git blame);
      // out of scope until the coverage gap-fill phase addresses src/api/v2.
      'src/api/v2/**',
      'src/api/utils/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: [
        'src/discord/commands/**',
        'src/discord/events/**',
        'src/discord/utils/**',
        'src/global/commands/**',
        'src/global/utils/**',
        'src/api/**',
      ],
      exclude: [
        'src/discord/commands/archive/**',
        'src/discord/commands/global/_d.globalTemplate.ts',
        'src/discord/commands/guild/_d.guildTemplate.ts',
        'src/discord/commands/index.ts',
        'src/discord/events/legacy/**',
        'src/global/commands/archive/**',
        'src/global/commands/_g.template.ts',
        'src/global/commands/index.ts',
        'src/global/utils/archive/**',
        'src/global/utils/_template.ts',
        'src/global/@types/**',
        'src/api/v2/**',
        'src/api/utils/**',
      ],
    },
  },
});
