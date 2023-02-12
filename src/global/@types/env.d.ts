declare global {
  // eslint-disable-next-line no-unused-vars
  namespace NodeJS {
    // eslint-disable-next-line no-unused-vars
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production';
      DISCORD_CLIENT_ID: string;
      DISCORD_OWNER_ID: string;
      DISCORD_GUILD_ID: string;
      DISCORD_CLIENT_TOKEN: string;
      DISCORD_CLIENT_SECRET: string | undefined;
      DISCORD_CLIENT_REDIRECT_URI: string | undefined;

      GITHUB_TOKEN: string | undefined;
      RAPID_TOKEN: string | undefined;
      WOLFRAM_TOKEN: string | undefined;
      IMGUR_ID: string | undefined;
      IMGURL_SECRET: string | undefined;
      YOUTUBE_TOKEN: string | undefined;
      IMDB_TOKEN: string | undefined;
      LOGTAIL_TOKEN: string | undefined;

      POSTGRES_DBURL: string;

      SONAR_URL: string | undefined;
      SONAR_TOKEN: string | undefined;

      HTTP_PORT?: number;

      TS_ICON_URL: string;
      FLAME_ICON_URL: string;
      DISCLAIMER: string;

      CHANNEL_TICKETBOOTH: string;
      CHANNEL_WELCOME: string;
      CATEGORY_STATS: string;
      CHANNEL_STATS_TOTAL: string;
      CHANNEL_STATS_ONLINE: string;
      CHANNEL_STATS_MAX: string;
      CHANNEL_STATS_VERIFIED: string;
      CATEGORY_GATEWAY: string;
      CHANNEL_START: string;
      CHANNEL_ANNOUNCEMENTS: string;
      CHANNEL_FAQ: string;
      CHANNEL_RULES: string;
      CHANNEL_BOTSPAM: string;
      CHANNEL_HELPDESK: string;
      CHANNEL_KUDOS: string;
      CHANNEL_BESTOF: string;
      CHANNEL_SUGGESTIONS: string;
      CATEGROY_HARMREDUCTIONCENTRE: string;
      CHANNEL_HOWTOHELP: string;
      CHANNEL_TRIPSITMETA: string;
      CHANNEL_TRIPSIT: string;
      CHANNEL_OPENTRIPSIT1: string;
      CHANNEL_OPENTRIPSIT2: string;
      CHANNEL_WEBTRIPSIT1: string;
      CHANNEL_WEBTRIPSIT2: string;
      CHANNEL_CLOSEDTRIPSIT: string;
      CHANNEL_RTRIPSIT: string;
      CHANNEL_HRRESOURCES: string;
      CHANNEL_DRUGQUESTIONS: string;
      CATEGORY_CAMPGROUND: string;
      // CHANNEL_GENERAL: string;
      CHANNEL_PETS: string;
      CHANNEL_FOOD: string;
      CHANNEL_OCCULT: string;
      CHANNEL_MUSIC: string;
      CHANNEL_MEMES: string;
      CHANNEL_MOVIES: string;
      CHANNEL_GAMING: string;
      CHANNEL_SCIENCE: string;
      CHANNEL_CREATIVE: string;
      CHANNEL_COMPSCI: string;
      CHANNEL_REPLICATIONS: string;
      CHANNEL_PHOTOGRAPHY: string;
      CHANNEL_RECOVERY: string;
      CATEGORY_BACKSTAGE: string;
      CHANNEL_LOUNGE: string;
      CHANNEL_VIPLOUNGE: string;
      CHANNEL_GOLDLOUNGE: string;
      // CHANNEL_REALTALK: string;
      CHANNEL_SANCTUARY: string;
      CHANNEL_TREES: string;
      CHANNEL_OPIATES: string;
      CHANNEL_STIMULANTS: string;
      CHANNEL_DEPRESSANTS: string;
      CHANNEL_DISSOCIATIVES: string;
      CHANNEL_PSYCHEDELICS: string;
      CHANNEL_CAMPFIRE: string;
      CATEGORY_ARCADE: string;
      CHANNEL_TRIVIA: string;
      CHANNEL_GAMES: string;
      CHANNEL_MIDJOURNEY: string;
      CATEGORY_COLLABORATION: string;
      CHANNEL_COLLABVC: string;
      CHANNEL_GROUPCOLLAB: string;
      CATEGORY_TEAMTRIPSIT: string;
      CHANNEL_INTRODUCTIONS: string;
      CHANNEL_APPLICATIONS: string;
      CHANNEL_INTANNOUNCE: string;
      CHANNEL_TALKTOTS: string;
      CHANNEL_MODHAVEN: string;
      CHANNEL_TEAMTRIPSIT: string;
      CHANNEL_MODERATORS: string;
      CHANNEL_TRIPSITTERS: string;
      CHANNEL_DEVELOPERS: string;
      CHANNEL_MODLOG: string;
      CHANNEL_BOTLOG: string;
      CHANNEL_MSGLOG: string;
      CHANNEL_AUDITLOG: string;
      CHANNEL_TEAMMEETING: string;
      CATEGORY_DEVELOPMENT: string;
      CHANNEL_DEVANNCOUNCE: string;
      CHANNEL_DEVOFFTOPIC: string;
      CHANNEL_DEVELOPMENT: string;
      CHANNEL_DISCORD: string;
      CHANNEL_TRIPBOT: string;
      CHANNEL_DBAPI: string;
      CHANNEL_WEBSITE: string;
      CHANNEL_CONTENT: string;
      CHANNEL_DESIGN: string;
      CHANNEL_IRC: string;
      CHANNEL_MATRIX: string;
      CHANNEL_TRIPMOBILE: string;
      CHANNEL_SANDBOX: string;
      CHANNEL_TECHHELP: string;
      CHANNEL_DEVELOPMENTVOICE: string;
      CATEGORY_RADIO: string;
      CHANNEL_SYNTHWAVERADIO: string;
      CHANNEL_GAMINGRADIO: string;
      CHANNEL_STUDYRADIO: string;
      CHANNEL_SLEEPYRADIO: string;
      CHANNEL_FUTON: string;
      CATEGORY_ARCHIVED: string;
      CHANNEL_SANDBOX_DEV: string;
      CHANNEL_MINECRAFTADMIN: string;
      CHANNEL_TRIPSITREDDIT: string;
      CHANNEL_VIPWELCOME: string;
      CHANNEL_CLEARMIND: string;
      CHANNEL_PSYCHONAUT: string;
      CHANNEL_DISSONAUT: string;
      CHANNEL_DELERIANTS: string;
      CHANNEL_MINECRAFT: string;
      CHANNEL_TRIPSITME: string;
      CHANNEL_OPERATORS: string;
      CHANNEL_TRIPSITRADIO: string;
      ROLE_DIRECTOR: string;
      ROLE_SUCCESSOR: string;
      ROLE_LEADDEV: string;
      ROLE_IRCADMIN: string;
      ROLE_DISCORDADMIN: string;
      ROLE_MODERATOR: string;
      ROLE_TRIPSITTER: string;
      ROLE_DEVELOPER: string;
      ROLE_SOCIALMEDIA: string;
      ROLE_TEAMTRIPSIT: string;
      ROLE_TRIPBOTDEV: string;
      ROLE_MATRIXADMIN: string;
      ROLE_DMMEFORHELP: string;
      ROLE_TRIPBOT: string;
      ROLE_BOTS: string;
      ROLE_UNDERBAN: string;
      ROLE_MUTED: string;
      ROLE_TEMPVOICE: string;
      ROLE_HELPER: string;
      ROLE_NEEDSHELP: string;
      ROLE_RESEARCHER: string;
      ROLE_CLEARMIND: string;
      ROLE_CONTRIBUTOR: string;
      ROLE_OCCULT: string;
      ROLE_RECOVERY: string;
      ROLE_MEMBER: string;
      ROLE_DJ: string;
      ROLE_VERIFIED: string;
      ROLE_UNVERIFIED: string;
      ROLE_FRANK: string;
      ROLE_ALUMNI: string;
      ROLE_COLLABORATOR: string;
      ROLE_VIP: string;
      ROLE_VIP_0: string;
      ROLE_VIP_10: string;
      ROLE_VIP_20: string;
      ROLE_VIP_30: string;
      ROLE_VIP_40: string;
      ROLE_VIP_50: string;
      ROLE_VIP_60: string;
      ROLE_VIP_70: string;
      ROLE_VIP_80: string;
      ROLE_VIP_90: string;
      ROLE_VIP_100: string;
      ROLE_PRONOUN_HE: string;
      ROLE_PRONOUN_SHE: string;
      ROLE_PRONOUN_THEY: string;
      ROLE_PRONOUN_ANY: string;
      ROLE_PRONOUN_ASK: string;
      ROLE_HR_PRESENTER: string;
      ROLE_HR_LISTENER: string;
      ROLE_HR_MODERATOR: string;
      ROLE_VOTEBANNED: string;
      ROLE_VOTEKICKED: string;
      ROLE_VOTETIMEOUT: string;
      ROLE_VUTEUNDERBAN: string;
      ROLE_PATRON: string;
      ROLE_TREE: string;
      ROLE_SPROUT: string;
      ROLE_SEEDLING: string;
      ROLE_BOOSTER: string;
      ROLE_DRUNK: string;
      ROLE_HIGH: string;
      ROLE_ROLLING: string;
      ROLE_TRIPPING: string;
      ROLE_DISSOCIATING: string;
      ROLE_STIMMING: string;
      ROLE_SEDATED: string;
      ROLE_SOBER: string;
      ROLE_TALKATIVE: string;
      ROLE_WORKING: string;
      ROLE_TRIVIABIGBRAIN: string;
      ROLE_RED: string;
      ROLE_ORANGE: string;
      ROLE_YELLOW: string;
      ROLE_GREEN: string;
      ROLE_BLUE: string;
      ROLE_PURPLE: string;
      ROLE_PINK: string;
      ROLE_WHITE: string;
      ROLE_BLACK: string;
      ROLE_DONOR_RED: string;
      ROLE_DONOR_ORANGE: string;
      ROLE_DONOR_YELLOW: string;
      ROLE_DONOR_GREEN: string;
      ROLE_DONOR_BLUE: string;
      ROLE_DONOR_PURPLE: string;
      // ROLE_DONOR_WHITE: string;
      // ROLE_DONOR_BLACK: string;
      ROLE_DONOR_PINK: string;
      EMOJI_HELPER: string;
      EMOJI_INVISIBLE: string;
      EMOJI_DRUNK: string;
      EMOJI_HIGH: string;
      EMOJI_ROLLING: string;
      EMOJI_TRIPPING: string;
      EMOJI_DISSOCIATING: string;
      EMOJI_STIMMING: string;
      EMOJI_SEDATED: string;
      EMOJI_SOBER: string;
      EMOJI_TALKATIVE: string;
      EMOJI_WORKING: string;
      EMOJI_VOTEUP: string;
      EMOJI_VOTEDOWN: string;
      EMOJI_THUMBUP: string;
      EMOJI_THUMBDOWN: string;
      EMOJI_PINKHEART: string;
      EMOJI_RESEARCHER: string;
      EMOJI_CONTRIBUTOR: string;
      EMOJI_CLEARMIND: string;
    }
  }
}

export {};
