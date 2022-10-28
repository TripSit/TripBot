/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

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
  modActions?: modActionDict;
}

export type modActionDict = {
  [key: string]: {
    actor: string;
    command: modAction;
    target: string;
    duration: number | null;
    pubReason: string | null;
    privReason: string | null;
  };
};

export type modAction = 'ban' | 'unban' | 'underban' | 'ununderban' | 'warn' | 'note' | 'timeout' | 'untimeout' | 'kick' | 'info' | 'note' | 'report';


export type expDict = {
  total?: expEntry,
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
