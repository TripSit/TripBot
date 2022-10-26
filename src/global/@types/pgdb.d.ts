/* eslint-disable max-len */

export type userEntry = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string | null;
  discordId: string;
  timezone: string | null;
  birthday: Date | null;
  karmaGiven: number;
  karmaReceived: number;
  sparklePoints: number;
  discordBotBan: boolean;
  ticketBan: boolean;
  lastSeen: Date;
  joinedAt: Date;
}

export type userTicketEntry = {
  id: string;
  userUid: string;
  description: string;
  threadId: string;
  type: 'appeal' | 'tripsit' | 'tech' | 'feedback';
  status: 'open' | 'closed' | 'blocked' | 'paused' | 'resolved';
  firstMessageId: string;
  closedAt: Date | null;
  createdAt: Date;
}

export type userExperienceEntry = {
  id: string;
  userUid: string;
  type: 'general' | 'tripsitter' | 'developer' | 'team' | 'ignored';
  level: number,
  levelPoints: number,
  totalExpPoints: number,
  lastMessageAt: Date,
  lastMessageChannel: string,
  mee6converted?: boolean
}

export type userModHistoryEntry = {
  id: string;
  actorUid: string;
  command: 'ban' | 'unban' | 'underban' | 'ununderban' | 'warn' | 'note' | 'timeout' | 'untimeout' | 'kick' | 'info' | 'note' | 'report';
  targetUid: string;
  duration: number | null;
  pubReason: string | null;
  privReason: string | null;
  createdAt: Date;
};

export type userDrugHistoryEntry = {
  id: uuid;
  user_uid: uuid;
  route: 'ORAL' | 'INSUFFLATED' | 'INHALED' | 'TOPICAL' | 'SUBLINGUAL' | 'BUCCAL' | 'RECTAL' | 'INTRAMUSCULAR' | 'INTRAVENOUS' | 'SUBCUTANIOUS' | 'TRANSDERMAL';
  dose: float;
  units: 'MG' | 'ML' | 'µG' | 'G' | 'OZ' | 'FLOZ' | 'TABS' | 'CAPS' | 'DROPS' | 'PILLS' | 'PATCHES' | 'SPRAYS';
  drug_uid: uuid;
  dose_date: Date;
};

export type guildEntry = {
  id: string;
  discordId: string;
  joinedAt: Date;
  discordBotBan: boolean;
  drama_date: Date | null;
  drama_reason: string | null;
}

export type reactionRoleEntry = {
  id: string;
  guildUid: string;
  name: string;
  channelId: string;
  messageId: string;
  reactionId: string;
  roleId: string;
}

export type drugNameEntry = {
  id: uuid;
  drug_uid: uuid;
  name: string;
  is_default: boolean;
  type: 'COMMON' | 'SUBSTITUTUVE' | 'SYSTEMATIC';
}
