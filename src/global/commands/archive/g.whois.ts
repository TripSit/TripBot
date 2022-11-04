
// import {stripIndents} from 'common-tags';
// import log from '../../utils/log';
// import * as path from 'path';
// import {WhoisResponse} from 'matrix-org-irc';
// const PREFIX = path.parse(__filename).name;

/**
 * Does something
 * @param {string} target Who you're whoising
 * @return {string} The whois
 */
// export async function whoisIRC(target:string):Promise<string> {
// let data = {} as WhoisResponse;

// if (global.ircClient) {
//   await global.ircClient.whois(target, async (resp) => {
//     if (resp) {
//       data = resp;
//     }
//   });
// } else {
//   log.debug(`[${PREFIX}] Failed! IRC Client not running`);
//   throw new Error('IRC Client not running!');
// }

// This is a hack substanc3 helped create to get around the fact that the whois command
// is asyncronous by default, so we need to make this syncronous
// while (data === null) {
//           await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
// }

// if (!data.host) {
//   log.debug(`[${PREFIX}] Failed! ${target} not found on IRC.`);
//   throw new Error('User not found on IRC!');
// }

// return stripIndents`
//       **${data.nick}** (${data.user}@${data.host}) ${data.account ? `${data.accountinfo} ${data.account}` : ''}
//       Channels include: ${data.channels ? data.channels.join(', ') : 'None'}
//     `;
// };
