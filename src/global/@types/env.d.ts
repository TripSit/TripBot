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
        DISCORD_OWNER_ID: string;
        DISCORD_GUILD_ID: string;
        FIREBASE_DB_URL: string;
        FIREBASE_DB_TICKETS: string;
        FIREBASE_DB_GUILDS: string;
        FIREBASE_DB_USERS: string;
        FIREBASE_PRIVATE_KEY_ID: string;
        FIREBASE_PRIVATE_KEY: string;
        FIREBASE_CLIENT_ID: number;
        FIREBASE_CLIENT_EMAIL: string;
        FIREBASE_REALTIME_KEY: string;
        CHANNEL_GENERAL: string;
        CHANNEL_START: string;
        CHANNEL_TRIPSIT: string;
        CHANNEL_MODLOG: string;
        CHANNEL_SANCTUARY: string;
        CHANNEL_TRIPSITTERS: string;
        CHANNEL_HOWTOTRIPSIT: string;
        CHANNEL_DRUGQUESTIONS: string;
        CHANNEL_OPENTRIPSIT: string;
        CHANNEL_BESTOF: string;
        CHANNEL_MODERATORS: string;
        CHANNEL_IRC: string;
        CHANNEL_BOTSPAM: string;
        CHANNEL_RULES: string;
        CHANNEL_DEVOFFTOPIC: string;
        CHANNEL_DEVELOPMENT: string;
        CHANNEL_TRIPCORD: string;
        CHANNEL_TRIPBOT: string;
        CHANNEL_TRIPBMOBILE: string;
        CHANNEL_WIKICONTENT: string;
        CHANNEL_TRIPSITREDDIT: string;
        CHANNEL_VIPWELCOME: string;
        CHANNEL_VIPLOUNGE: string;
        CHANNEL_TALKTOTS: string;
        CHANNEL_CLEARMIND: string;
        CHANNEL_PSYCHONAUT: string;
        CHANNEL_DISSONAUT: string;
        CHANNEL_GOLDLOUNGE: string;
        CHANNEL_HUB: string;
        CHANNEL_TRIPBOTLOGS: string;
        ROLE_MODERATOR: string;
        ROLE_IRCADMIN: string;
        ROLE_DISCORDADMIN: string;
        ROLE_RESEARCHER: string;
        ROLE_CLEARMIND: string;
        ROLE_DEVELOPER: string;
        ROLE_CODER: string;
        ROLE_MEMBER: string;
        ROLE_UNDERBAN: string;
        ROLE_DRUNK: string;
        ROLE_HIGH: string;
        ROLE_ROLLING: string;
        ROLE_TRIPPING: string;
        ROLE_DISSOCIATING: string;
        ROLE_STIMMING: string;
        ROLE_NODDING: string;
        ROLE_SOBER: string;
        ROLE_HELPER: string;
        ROLE_TRIPSITTER: string;
        ROLE_TALKATIVE: string;
        ROLE_WORKING: string;
        ROLE_RED: string;
        ROLE_GREEN: string;
        ROLE_BLUE: string;
        ROLE_YELLOW: string;
        ROLE_PURPLE: string;
        ROLE_ORANGE: string;
        ROLE_WHITE: string;
        ROLE_BLACK: string;
        ROLE_PINK: string;
        ROLE_DIRECTOR: string;
        ROLE_SUCCESSOR: string;
        ROLE_SYSADMIN: string;
        ROLE_LEADDEV: string;
        ROLE_IRCOP: string;
        ROLE_TEAMTRIPSIT: string;
        ROLE_TRIPBOT2: string;
        ROLE_TRIPBOT: string;
        ROLE_BOT: string;
        ROLE_TREE: string;
        ROLE_SPROUT: string;
        ROLE_SEEDLING: string;
        ROLE_BOOSTER: string;
        ROLE_PATRON: string;
        ROLE_NEEDSHELP: string;
        ROLE_NEWBIE: string;
        ROLE_MUTED: string;
        ROLE_TEMPVOICE: string;
        ROLE_VIP: string;
        CHANNEL_OPENTRIPSIT1: string;
        CHANNEL_OPENTRIPSIT2: string;
        CHANNEL_CLOSEDTRIPSIT: string;
        CHANNEL_TEMPVOICE: string;
        CATEGORY_TEMPVOICE: string;
        IRC_BOTPREFIX: string;
        YOUTUBE_TOKEN: string;
        GITHUB_TOKEN: string;
      }
    }
  }

export {};
