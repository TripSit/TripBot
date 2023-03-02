import { Client, Guild } from 'discord.js';

declare global {
  var guildInvites: Collection; // eslint-disable-line
  var reactionRoles: { [key: string]: any };// eslint-disable-line
  var bootTime: Date; // eslint-disable-line
  var client: Client; // eslint-disable-line
  var announcements: string[]; // eslint-disable-line
  var lpmDict: LpmDict; // eslint-disable-line
  var lpmTime: number[]; // eslint-disable-line
  var emojiGuildA: Guild; // eslint-disable-line
  var emoji: (name:string) => Emoji; // eslint-disable-line
}

export {};

export type LpmDict = {
  [key: string]: {
    position: number;
    name: string;
    alert: number;
    lp1: number;
    lp1Max: number;
    lp5: number;
    lp5Max: number;
    lp10: number;
    lp10Max: number;
    lp30: number;
    lp30Max: number;
    lp60: number;
    lp60Max: number;
  }
};
