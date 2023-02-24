import { Client } from 'discord.js';

declare global {
  var guildInvites: Collection; // eslint-disable-line
  var reactionRoles: { [key: string]: any };// eslint-disable-line
  var bootTime: Date; // eslint-disable-line
  var client: Client; // eslint-disable-line
  var announcements: string[]; // eslint-disable-line
  var lpmDict: LpmDict; // eslint-disable-line
  var lpmTime: number[]; // eslint-disable-line
}

export {};

export type LpmDict = {
  [key: string]: {
    position: number;
    name: string;
    lpm: number;
    lph: number;
    maxLpm: number;
    maxLph: number;
  }
};
