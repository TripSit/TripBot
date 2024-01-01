import { PrismaClient } from '@prisma/client';
import { Client as DiscordClient } from 'discord.js';
import { DateTime } from 'luxon';
// import { MatrixClient } from 'matrix-bot-sdk';
// import { Client as IRCClient } from 'matrix-org-irc';
// import { Telegraf as TelegramClient } from 'telegraf';
// import Sentry from '@sentry/node';

declare global {
  var guildInvites: Collection; // eslint-disable-line
  var reactionRoles: { [key: string]: any };// eslint-disable-line
  var bootTime: Date; // eslint-disable-line
  var discordClient: DiscordClient; // eslint-disable-line
  // var ircClient: IRCClient; // eslint-disable-line
  // var matrixClient: MatrixClient; // eslint-disable-line
  // var telegramClient: TelegramClient; // eslint-disable-line
  var announcements: string[]; // eslint-disable-line
  var lpmDict: LpmDict; // eslint-disable-line
  var lpmTime: number[]; // eslint-disable-line
  // var sentry: Sentry; // eslint-disable-line
  var emojiGet: (name:string) => Emoji; // eslint-disable-line
  var moodleConnection: { // eslint-disable-line
    status: Boolean,
    date: DateTime,
  };
  var db: PrismaClient; // eslint-disable-line
}

export {};
