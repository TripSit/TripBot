/* eslint no-var: 0 */
/* eslint no-unused-vars: 0 */
import {Client} from 'discord.js';
// import * as irc from 'matrix-org-irc';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {startLog} from '../../utils/startLog';
import env from '../../../global/utils/env.config';
import {parse} from 'path';
import log from '../../../global/utils/log';


declare global {
  // var userDb: { [key: string]: any };
  // var guildDb: { [key: string]: any };
  // var log: log;
  // var SlashCommand: SlashCommand;
  // var embedTemplate: embedTemplate;
  // var startLog: startLog;
  // var env: env;
  // var parse: parse;
  var guildInvites: Collection;
  var reactionRoles: { [key: string]: any };
  var bootTime: Date;
  var client: Client;
  // var ircClient: irc.Client;
}

export {};
