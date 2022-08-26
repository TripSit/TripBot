declare global {
    // eslint-disable-next-line no-unused-vars
    namespace NodeJS {
      // eslint-disable-next-line no-unused-vars
      interface ProcessEnv {
        GITHUB_AUTH_TOKEN?: string;
        NODE_ENV?: 'development' | 'production';
        PORT?: number;
        TS_ICON_URL?: string;
        FLAME_ICON_URL?: string;
        DISCLAIMER?: string;
        DISCORD_CLIENT_ID: number;
        DISCORD_CLIENT_SECRET: string;
        DISCORD_CLIENT_REDIRECT_URI: string;
        DISCORD_CLIENT_TOKEN: string;
        DISCORD_OWNER_ID: number;
        DISCORD_GUILD_ID: number;
        FIREBASE_DB_URL: string;
        FIREBASE_DB_TICKETS: string;
        FIREBASE_DB_GUILDS: string;
        FIREBASE_DB_USERS: string;
        FIREBASE_PRIVATE_KEY_ID: string;
        FIREBASE_PRIVATE_KEY: string;
        FIREBASE_CLIENT_ID: number;
        FIREBASE_CLIENT_EMAIL: string;
        FIREBASE_REALTIME_KEY: string;
        CHANNEL_GENERAL: number;
        CHANNEL_START: number;
        CHANNEL_TRIPSIT: number;
        CHANNEL_MODLOG: number;
        ROLE_DRUNK: number;
        ROLE_HIGH: number;
        ROLE_ROLLING: number;
        ROLE_TRIPPING: number;
        ROLE_DISSOCIATING: number;
        ROLE_STIMMING: number;
        ROLE_NODDING: number;
        ROLE_SOBER: number;
      }
    }
  }

export {};
