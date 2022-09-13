/* eslint-disable no-unused-vars */

export type userDbEntry = {
    name: string;
    karma_given: number;
    karma_received: number;
    discord: discordEntry;
    birthday: string;
    timezone: string;
}

export type discordEntry = {
    id: string;
};

export type ticketDbEntry = {
    name: string;
    issueThread: string;
    issueStatus: 'open' | 'closed' | 'blocked' | 'paused';
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
