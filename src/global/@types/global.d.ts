/* eslint no-var: 0 */
/* eslint no-unused-vars: 0 */
import {Client} from 'discord.js';
// import * as irc from 'matrix-org-irc';

declare global {
  // var userDb: { [key: string]: any };
  // var guildDb: { [key: string]: any };
  var guildInvites: Collection;
  var reactionRoles: { [key: string]: any };
  var bootTime: Date;
  var client: Client;
  // var ircClient: irc.Client;
}

export {};
