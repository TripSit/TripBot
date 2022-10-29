// The TypeScript definitions below are automatically generated.
// Do not touch them, or risk, your modifications being lost.

export enum DrugNameType {
  Brand = 'BRAND',
  Common = 'COMMON',
  Substitutive = 'SUBSTITUTIVE',
  Systematic = 'SYSTEMATIC',
}

export enum DrugRoa {
  Oral = 'ORAL',
  Insufflated = 'INSUFFLATED',
  Inhaled = 'INHALED',
  Topical = 'TOPICAL',
  Sublingual = 'SUBLINGUAL',
  Buccal = 'BUCCAL',
  Rectal = 'RECTAL',
  Intramuscular = 'INTRAMUSCULAR',
  Intravenous = 'INTRAVENOUS',
  Subcutanious = 'SUBCUTANIOUS',
  Transdermal = 'TRANSDERMAL',
}

export enum DrugUnit {
  Mg = 'MG',
  Ml = 'ML',
  G = 'µG',
  G = 'G',
  Oz = 'OZ',
  Floz = 'FLOZ',
}

export enum ExperienceType {
  Total = 'TOTAL',
  General = 'GENERAL',
  Tripsitter = 'TRIPSITTER',
  Developer = 'DEVELOPER',
  Team = 'TEAM',
  Ignored = 'IGNORED',
}

export enum TicketStatus {
  Open = 'OPEN',
  Closed = 'CLOSED',
  Blocked = 'BLOCKED',
  Paused = 'PAUSED',
  Resolved = 'RESOLVED',
}

export enum TicketType {
  Appeal = 'APPEAL',
  Tripsit = 'TRIPSIT',
  Tech = 'TECH',
  Feedback = 'FEEDBACK',
}

export enum UserActionType {
  Note = 'NOTE',
  Warning = 'WARNING',
  FullBan = 'FULL_BAN',
  TicketBan = 'TICKET_BAN',
  DiscordBotBan = 'DISCORD_BOT_BAN',
  BanEvasion = 'BAN_EVASION',
  Underban = 'UNDERBAN',
  Timeout = 'TIMEOUT',
  Report = 'REPORT',
  Kick = 'KICK',
}

export enum Table {
  DiscordGuilds = 'discord_guilds',
  DrugArticles = 'drug_articles',
  DrugNames = 'drug_names',
  DrugVariantRoas = 'drug_variant_roas',
  DrugVariants = 'drug_variants',
  Drugs = 'drugs',
  KnexMigrations = 'knex_migrations',
  KnexMigrationsLock = 'knex_migrations_lock',
  ReactionRoles = 'reaction_roles',
  UserActions = 'user_actions',
  UserDrugDoses = 'user_drug_doses',
  UserExperience = 'user_experience',
  UserTickets = 'user_tickets',
  Users = 'users',
}

export type DiscordGuilds = {
  id: string;
  is_banned: boolean;
  last_drama_at: Date | null;
  drama_reason: string | null;
  joined_at: Date;
  removed_at: Date | null;
};

export type DrugArticles = {
  id: string;
  drug_id: string;
  url: string;
  title: string;
  description: string | null;
  published_at: Date | null;
  last_modified_by: string;
  last_modified_at: Date;
  posted_by: string;
  created_at: Date;
};

export type DrugNames = {
  id: string;
  drug_id: string;
  name: string;
  is_default: boolean;
  type: DrugNameType;
};

export type DrugVariantRoas = {
  id: string;
  drug_variant_id: string;
  route: DrugRoa;
  dose_threshold: number | null;
  dose_light: number | null;
  dose_common: number | null;
  dose_strong: number | null;
  dose_heavy: number | null;
  dose_warning: string | null;
  duration_total_min: number | null;
  duration_total_max: number | null;
  duration_onset_min: number | null;
  duration_onset_max: number | null;
  duration_comeup_min: number | null;
  duration_comeup_max: number | null;
  duration_peak_min: number | null;
  duration_peak_max: number | null;
  duration_offset_min: number | null;
  duration_offset_max: number | null;
  duration_after_effects_min: number | null;
  duration_after_effects_max: number | null;
};

export type DrugVariants = {
  id: string;
  drug_id: string;
  name: string | null;
  description: string | null;
  default: boolean;
  last_updated_by: string;
  updated_at: Date;
  created_at: Date;
};

export type Drugs = {
  id: string;
  summary: string | null;
  psychonaut_wiki_url: string | null;
  errowid_experiences_url: string | null;
  last_updated_by: string;
  updated_at: Date;
  created_at: Date;
};

export type KnexMigrations = {
  id: number;
  name: string | null;
  batch: number | null;
  migration_time: Date | null;
};

export type KnexMigrationsLock = {
  index: number;
  is_locked: number | null;
};

export type ReactionRoles = {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id: string;
  reaction_id: string;
  role_id: string;
  name: string;
  created_at: Date;
};

export type UserActions = {
  id: string;
  user_id: string;
  type: UserActionType | null;
  ban_evasion_related_user: string | null;
  description: string;
  internal_note: string | null;
  expires_at: Date | null;
  repealed_by: string | null;
  repealed_at: Date | null;
  created_by: string;
  created_at: Date;
};

export type UserDrugDoses = {
  id: string;
  user_id: string;
  drug_id: string;
  route: DrugRoa;
  dose: number;
  units: DrugUnit;
  created_at: Date;
};

export type UserExperience = {
  id: string;
  user_id: string;
  type: ExperienceType | null;
  level: number;
  level_points: number;
  total_points: number;
  last_message_at: Date;
  last_message_channel: string;
  created_at: Date;
};

export type UserTickets = {
  id: string;
  user_id: string;
  description: string;
  thread_id: string;
  type: TicketType;
  status: TicketStatus;
  first_message_id: string;
  closed_by: string | null;
  closed_at: Date | null;
  created_at: Date;
};

export type Users = {
  id: string;
  email: string | null;
  username: string | null;
  password_hash: string | null;
  discord_id: string | null;
  irc_id: string | null;
  matrix_id: string | null;
  timezone: string | null;
  birthday: Date | null;
  karma_given: number;
  karma_received: number;
  sparkle_points: number;
  move_points: number;
  empathy_points: number;
  discord_bot_ban: boolean;
  ticket_ban: boolean;
  last_seen_at: Date;
  last_seen_in: Date | null;
  joined_at: Date;
  removed_at: Date | null;
};
