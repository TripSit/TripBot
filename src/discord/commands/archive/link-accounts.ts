// 'use strict';



// const F = f(__filename);
// const { SlashCommandBuilder } = require('discord.js');
// const { stripIndents } = require('common-tags/lib');
// const logger = require('../../../global/utils/log');
// const template = require('../../utils/embed-template');

// const {
//   DISCORD_GUILD_ID,
//   roleIrcVerifiedId,
// } = require('../../../../env');

// // {
// //   "nick": "unauthed_user",
// //   "user": "~username",
// //   "host": "192.168.0.0",
// //   "realname": "user @ Webchat",
// //   "channels": [
// //   ],
// //   "server": "innsbruck.tripsit.me",
// //   "serverinfo": "TripSit IRC Private Jet Receipt Server",
// //   "idle": "0"
// // }
// // {
// //   "nick": "authed_user",
// //   "user": "~username",
// //   "host": "tripsit/user/username",
// //   "realname": "realname",
// //   "channels": [
// //   ],
// //   "server": "innsbruck.tripsit.me",
// //   "serverinfo": "TripSit IRC Private Jet Receipt Server",
// //   "idle": "0",
// //   "account": "AccountName",
// //   "accountinfo": "is logged in as"
// // }
// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName('link-account')
//     .setDescription('Link your discord account across various services!')
//     .addSubcommand(subcommand => subcommand
//       .setDescription('Link your account to IRC')
//       .addStringOption(option => option
//         .setName('nickname')
//         .setDescription('What is your IRC nickname?')
//         .setRequired(true))
//       .setName('irc')),
//   // .addSubcommand(subcommand => subcommand
//   //   .setDescription('Link your account to Telegram')
//   //   .addStringOption(option => option
//   //     .setName('nickname')
//   //     .setDescription('What is your Telegram username?')
//   //     .setRequired(true))
//   //   .setName('telegram')),
//   async execute(interaction) {
//     module.exports.interaction = interaction;

//     const actor = interaction.member;
//   // log.debug(F, `Actor: ${actor}`);
//     const service = interaction.options.getSubcommand();
//   // log.debug(F, `service: ${service}`);
//     const nickname = interaction.options.getString('nickname');
//   // log.debug(F, `target: ${nickname}`);
//     // Create an authentication token to use for the link
//     const token = `${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 8)}`;

//     if (service === 'irc') {
//       const embed = template.embedTemplate();
//       embed.setTitle('Link your account to IRC');

//       if (global.ircClient) {
//         await global.ircClient.whois(nickname, async data => {
//           // Check if the user is authorized in IRC
//           if (!data.account) {
//             embed.setDescription(stripIndents`${nickname} is not registered on IRC, please go ~register on IRC!`);
//             await interaction.reply({ embeds: [embed], ephemeral: true });
//             return;
//           }
//         // log.debug(F, `${actor} ${data.accountinfo} ${data.account}`);
//           const [actorData, actorFbid] = await getUserInfo(actor);
//           if (actorData.irc && actorData.irc.verified) {
//           // log.debug(F, `actorData.irc: ${actorData.irc}`);
//           // log.debug(F, `actorData.irc.nickname: ${actorData.irc.nickname}`);
//             embed.setDescription(stripIndents`Your account is already linked to '${actorData.irc.nickname}'`);
//             await interaction.reply({ embeds: [embed], ephemeral: true });
//             return;
//           }

//           if (interaction.replied) {
//             return;
//           }

//           embed.setDescription(stripIndents`
//           Your auth token is:

//           ${token}

//           Please copy this token and send it to the "TS" bot on IRC next time you're online!

//           If you forget or otherwise lose this token you can rerun this command to generate a new one.`);
//           await interaction.reply({ embeds: [embed], ephemeral: true });

//           // log.debug(F, `user whois: ${JSON.stringify(data, null, 2)}`);
//           actorData.irc = {
//             accountName: data.account,
//             vhost: data.host,
//             nickname: data.nick,
//             verified: false,
//           };
//           actorData.authToken = token;

//           // log.debug(F, `actorData: ${JSON.stringify(actorData, null, 2)}`);
//         // log.debug(F, `actorFbid: ${actorFbid}`);

//           await setUserInfo(actorFbid, actorData);

//           global.ircClient.say(nickname, stripIndents`
//           ${actor.displayName} has requested to link accounts.

//           If this is expected, please respond with the auth token given in discord.

//           If this is not expected, please contact Moonbear#1024 on discord, but don't worry: your account is safe!`);
//         });
//       } else {
//         embed.setDescription(stripIndents`
//         The IRC client is not connected, please try again later.`);
//         await interaction.reply({ embeds: [embed], ephemeral: true });
//       }
//     }
//   },
//   async verifyLink(service, accountInfo, token) {
//   // log.debug(F, `Actor: ${accountInfo.account}`);
//   // log.debug(F, `givnToken: ${token}`);

//     const [actorData, actorFbid] = await getUserInfo(accountInfo);

//     // log.debug(F, `user: ${JSON.stringify(actorData, null, 2)}`);
//   // log.debug(F, `authToken: ${actorData.authToken}`);
//   // log.debug(F, `typeof authToken: ${typeof actorData.authToken}`);
//   // log.debug(F, `typeof givnToken: ${typeof token}`);

//     if (actorData.authToken) {
//       if (actorData.authToken.toString() === token.toString()) {
//       // log.debug(F, `actorData.authToken matches!`);
//         const embed = template.embedTemplate();
//         embed.setTitle('Link your account to IRC - Success!');
//         if (service === 'irc') {
//           actorData.irc.verified = true;
//           await setUserInfo(actorFbid, actorData);
//           global.ircClient.say(accountInfo.nick, 'Your account has been linked!');
//           const tripsitGuild = module.exports.interaction.client.guilds.cache.get(DISCORD_GUILD_ID);
//           const roleIrcVerified = tripsitGuild.roles.cache.get(roleIrcVerifiedId);
//         // log.debug(F, `discord ID: ${actorData.discord.id}`);
//           const target = await tripsitGuild.members.fetch(actorData.discord.id);
//         // log.debug(F, `target: ${target}`);
//           await target.roles.add(roleIrcVerified);
//           embed.setDescription(stripIndents`You have successfully linked your Discord account to the ${accountInfo.nick} IRC account!
//           If this is not expected please contact Moonbear#1024 on discord, but don't worry: your account is safe!`);
//           target.send({ embeds: [embed] });
//         }
//       } else {
//         global.ircClient.say(accountInfo.nick, 'No auth token found!');
//       }
//     } else {
//       global.ircClient.say(accountInfo.nick, 'Actor does not have auth token!');
//     }
//   },
// };
