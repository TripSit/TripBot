declare global {
  // eslint-disable-next-line no-unused-vars
  namespace NodeJS {
    // eslint-disable-next-line no-unused-vars
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production';
      POSTGRES_DBURL: string;
      YOUTUBE_TOKEN: string;
      GITHUB_TOKEN: string;
      IMGUR_ID: string;
      RAPID_TOKEN: string;
      IMDB_TOKEN: string;
      PORT?: number;
      TS_ICON_URL?: string;
      FLAME_ICON_URL?: string;
      DISCLAIMER?: string;
      DISCORD_CLIENT_ID: string;
      DISCORD_CLIENT_SECRET: string;
      DISCORD_CLIENT_REDIRECT_URI: string;
      DISCORD_CLIENT_TOKEN: string;
      DISCORD_OWNER_ID: string;
      DISCORD_GUILD_ID: string;
      IRC_SERVER: string;
      IRC_USERNAME: string;
      IRC_PASSWORD: string;
      IRC_BOTPREFIX: string;
      CATEGORY_GATEWAY: string;
      CHANNEL_TICKETBOOTH: string;
      CHANNEL_START: string;
      CHANNEL_ANNOUNCEMENTS: string;
      CHANNEL_BOTSPAM: string;
      CHANNEL_RULES: string;
      CHANNEL_HELPDESK: string;

      CATEGORY_HRCENTER: string;
      CHANNEL_HOWTOTRIPSIT: string;
      CHANNEL_TRIPSITMETA: string;
      CHANNEL_RTRIPSIT: string;

      CATEGROY_HARMREDUCTIONCENTRE: string;
      CHANNEL_TRIPSIT: string;
      CHANNEL_OPENTRIPSIT: string;
      CHANNEL_OPENTRIPSIT1: string;
      CHANNEL_OPENTRIPSIT2: string;
      CHANNEL_CLOSEDTRIPSIT: string;
      CHANNEL_SANCTUARY: string;
      CHANNEL_HRRESOURCES: string;
      CHANNEL_DRUGQUESTIONS: string;

      CATEGORY_CAMPGROUND: string;
      CHANNEL_GENERAL: string;
      CHANNEL_PETS: string;
      CHANNEL_FOOD: string;
      CHANNEL_MUSIC: string;
      CHANNEL_MOVIES: string;
      CHANNEL_SCIENCE: string;
      CHANNEL_GAMING: string;
      CHANNEL_CREATIVE: string;
      CHANNEL_MEMES: string;
      CHANNEL_TRIVIA: string;

      CATEGORY_BACKSTAGE: string;
      CHANNEL_LOUNGE: string;
      CHANNEL_OPIATES: string;
      CHANNEL_STIMS: string;
      CHANNEL_DISSOCIATIVES: string;
      CHANNEL_PSYCHEDELICS: string;

      CATEGORY_VIPCABINS: string;
      CHANNEL_KUDOS: string;
      CHANNEL_VIPLOUNGE: string;
      CHANNEL_REALTALK: string;
      CHANNEL_GOLDLOUNGE: string;
      CHANNEL_TALKTOTS: string;
      CHANNEL_BESTOF: string;
      CHANNEL_MINECRAFT: string;
      CHANNEL_CAMPFIRE: string;

      CATEGORY_COLLABORATION: string;

      CATEGORY_TEAMTRIPSIT: string;
      CHANNEL_TRIPSITME: string;
      CHANNEL_MODHAVEN: string;
      CHANNEL_TEAMTRIPSIT: string;
      CHANNEL_MODERATORS: string;
      CHANNEL_OPERATORS: string;
      CHANNEL_MODLOG: string;
      CHANNEL_TEAMMEETING: string;

      CATEGORY_DEVELOPMENT: string;
      CHANNEL_DEVWELCOME: string;
      CHANNEL_DEVANNCOUNCE: string;
      CHANNEL_DEVOFFTOPIC: string;
      CHANNEL_DEVELOPMENT: string;
      CHANNEL_DEVPOLLS: string;
      CHANNEL_DISCORD: string;
      CHANNEL_TRIPBOT: string;
      CHANNEL_DESIGN: string;
      CHANNEL_SANDBOX: string;
      CHANNEL_WIKICONTENT: string;
      CHANNEL_MINECRAFTADMIN: string;
      CHANNEL_BOTLOG: string;
      CHANNEL_DEVELOPMENTVC: string;

      CATEGORY_ARCHIVED: string;
      CHANNEL_TRIPBMOBILE: string;
      CHANNEL_TRIPSITREDDIT: string;
      CHANNEL_VIPWELCOME: string;
      CHANNEL_CLEARMIND: string;
      CHANNEL_PSYCHONAUT: string;
      CHANNEL_DISSONAUT: string;
      CHANNEL_TEMPVOICE: string;
      CATEGORY_TEMPVOICE: string;
      CHANNEL_DELERIANTS: string;

      ROLE_ADMIN: string;
      ROLE_DISCORDOP: string;

      ROLE_DIRECTOR: string;
      ROLE_SUCCESSOR: string;
      ROLE_SYSADMIN: string;
      ROLE_LEADDEV: string;
      ROLE_IRCADMIN: string;
      ROLE_DISCORDADMIN: string;
      ROLE_IRCOP: string;
      ROLE_MODERATOR: string;
      ROLE_TRIPSITTER: string;
      ROLE_DEVELOPER: string;
      ROLE_TEAMTRIPSIT: string;

      ROLE_NEWBIE: string;
      ROLE_MUTED: string;
      ROLE_TEMPVOICE: string;

      ROLE_NEEDSHELP: string;
      ROLE_RESEARCHER: string;
      ROLE_CLEARMIND: string;
      ROLE_CONSULTANT: string;
      ROLE_MEMBER: string;
      ROLE_UNDERBAN: string;
      ROLE_VIP: string;

      ROLE_TRIPBOT2: string;
      ROLE_TRIPBOT: string;
      ROLE_BOT: string;

      ROLE_TREE: string;
      ROLE_PATRON: string;
      ROLE_SPROUT: string;
      ROLE_SEEDLING: string;
      ROLE_BOOSTER: string;

      ROLE_DRUNK: string;
      ROLE_HIGH: string;
      ROLE_ROLLING: string;
      ROLE_TRIPPING: string;
      ROLE_DISSOCIATING: string;
      ROLE_STIMMING: string;
      ROLE_NODDING: string;
      ROLE_SOBER: string;
      ROLE_HELPER: string;
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
    }
  }
}

export {};
