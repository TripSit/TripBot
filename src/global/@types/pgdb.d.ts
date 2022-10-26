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
  userId: string;
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
  userId: string;
  type: 'general' | 'tripsitter' | 'developer' | 'team' | 'ignored';
  level: number,
  levelPoints: number,
  totalExpPoints: number,
  lastMessageAt: Date,
  lastMessageChannel: string,
  mee6converted?: boolean
}

export type userHistoryEntry = {
  id: string;
  actorId: string;
  command: 'ban' | 'unban' | 'underban' | 'ununderban' | 'warn' | 'note' | 'timeout' | 'untimeout' | 'kick' | 'info' | 'note' | 'report';
  targetId: string;
  duration: number | null;
  pubReason: string | null;
  privReason: string | null;
  createdAt: Date;
};

export type guildEntry = {
  id: string;
  discordId: string;
  joinedAt: Date;
  discordBotBan: boolean;
}

export type reactionRoleEntry = {
  id: string;
  guildId: string;
  name: string;
  channelId: string;
  messageId: string;
  reactionId: string;
  roleId: string;
}
