/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

export type UserDbEntry = {
  karma?: {
    karma_given: number;
    karma_received: number;
  }
  discord?: {
    id: string;
  };
  birthday?: {
    month: string;
    day: number;
  };
  timezone?: string;
  experience?: ExpDict;
  ModActions?: ModActionDict;
};

export type ModActionDict = {
  [key: string]: {
    actor: string;
    command: ModAction;
    target: string;
    duration: number | null;
    pubReason: string | null;
    privReason: string | null;
  };
};

export type ModAction = 'ban' | 'unban' | 'underban' | 'ununderban' | 'warn' | 'note' | 'timeout' | 'untimeout' | 'kick' | 'info' | 'note' | 'report';

export type ExpDict = {
  total?: ExpEntry,
  general?: ExpEntry,
  tripsitter?: ExpEntry,
  developer?: ExpEntry,
  team?: ExpEntry,
};

export type ExpEntry = {
  level: number,
  levelExpPoints: number,
  totalExpPoints: number,
  lastMessageDate: number,
  lastMessageChannel: string,
  mee6converted?: boolean
};

export type TicketDbEntry = {
  issueDesc: string;
  issueStatus: 'open' | 'closed' | 'blocked' | 'paused' | 'resolved';
  issueThread: string;
  issueType: 'appeal' | 'tripsit' | 'tech';
  issueUser: string;
  issueUserIsBanned: boolean;
  issueFirstMessage: string;
};

export type ReactionRoleList = {
  [key: string]: {
    channelName?: string;
    [key:string]: ReactionRole[];
  }
};

export type ReactionRole = {
  messageId?: string;
  name: string;
  reaction: string;
  roleId: string;
};
