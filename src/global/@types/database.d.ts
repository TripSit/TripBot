/* eslint-disable no-unused-vars */

export type userDbEntry = {
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
  experience?: expDict;
  modActions: modActionDict;
}

export type modActionDict = {
  [key: string]: {
    actor: string;
    command: string;
    target: string;
    channel?: string;
    duration?: number;
    pubReason?: string;
    privReason?: string;
  };
};

export type expDict = {
  total: expEntry,
  general?: expEntry,
  tripsitter?: expEntry,
  developer?: expEntry,
  team?: expEntry,
}

export type expEntry = {
  level: number,
  levelExpPoints: number,
  totalExpPoints: number,
  lastMessageDate: number,
  lastMessageChannel: string,
  mee6converted?: boolean
}

export type ticketDbEntry = {
  issueDesc: string;
  issueStatus: 'open' | 'closed' | 'blocked' | 'paused' | 'resolved';
  issueThread: string;
  issueType: 'appeal' | 'tripsit' | 'tech';
  issueUser: string;
  issueUserIsBanned: boolean;
  issueFirstMessage: string;
}

export type reactionRoleList = {
  [key: string]: {
    channelName?: string;
    [key:string]: reactionRole[];
  }
}

export type reactionRole = {
  messageId?: string;
  name: string;
  reaction: string;
  roleId: string;
}
