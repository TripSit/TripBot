// 'use strict';

// import { parse } from 'path';

// const PREFIX = parse(__filename).name;
// const { stripIndents } = require('common-tags');
// const logger = require('../../../global/utils/log');
// const { moderate } = require('../../../global/utils/moderate');

// const {
//   NODE_ENV,
//   ROLE_MODERATOR,
//   ROLE_NEWBIEId,
//   roleVotebannedId,
//   roleVotekickedId,
//   roleVotetimeoutId,
//   roleVoteunderbanId,
//   ROLE_DIRECTOR,
//   ROLE_SUCCESSOR,
//   ROLE_SYSADMIN,
//   ROLE_LEADDEV,
//   ROLE_IRCADMIN,
//   ROLE_DISCORDADMIN,
//   ROLE_IRCOP,
//   ROLE_TRIPSITTER,
//   ROLE_TEAMTRIPSIT,
//   ROLE_TRIPBOT,
//   ROLE_TRIPBOT2,
//   ROLE_BOT,
//   ROLE_DEVELOPER,
//   ROLE_TREE,
//   ROLE_SPROUT,
//   ROLE_SEEDLING,
//   ROLE_BOOSTER,
//   ROLE_RED,
//   ROLE_ORANGE,
//   ROLE_YELLOW,
//   ROLE_GREEN,
//   ROLE_BLUE,
//   ROLE_PURPLE,
//   ROLE_PINK,
//   ROLE_BROWN,
//   ROLE_BLACK,
//   ROLE_WHITE,
//   ROLE_DRUNK,
//   ROLE_HIGH,
//   ROLE_ROLLING,
//   ROLE_TRIPPING,
//   ROLE_DISSOCIATING,
//   ROLE_STIMMING,
//   ROLE_NODDING,
//   ROLE_SOBER,
// } = require('../../../../env');

// const teamRoles = [
//   ROLE_DIRECTOR,
//   ROLE_SUCCESSOR,
//   ROLE_SYSADMIN,
//   ROLE_LEADDEV,
//   ROLE_IRCADMIN,
//   ROLE_DISCORDADMIN,
//   ROLE_IRCOP,
//   ROLE_MODERATOR,
//   ROLE_TRIPSITTER,
//   ROLE_TEAMTRIPSIT,
//   ROLE_TRIPBOT2,
//   ROLE_TRIPBOT,
//   ROLE_BOT,
//   ROLE_DEVELOPER,
// ];

// const colorRoles = [
//   ROLE_TREE,
//   ROLE_SPROUT,
//   ROLE_SEEDLING,
//   ROLE_BOOSTER,
//   ROLE_RED,
//   ROLE_ORANGE,
//   ROLE_YELLOW,
//   ROLE_GREEN,
//   ROLE_BLUE,
//   ROLE_PURPLE,
//   ROLE_PINK,
//   ROLE_BROWN,
//   ROLE_BLACK,
//   ROLE_WHITE,

// ];

// const mindsetRoles = [
//   ROLE_DRUNK,
//   ROLE_HIGH,
//   ROLE_ROLLING,
//   ROLE_TRIPPING,
//   ROLE_DISSOCIATING,
//   ROLE_STIMMING,
//   ROLE_NODDING,
//   ROLE_SOBER,
// ];

// const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles}`;

// // How many votes are needed for each action, in production and dev
// const voteBanThreshold = NODE_ENV === 'production' ? 3 : 1;
// const voteKickThreshold = NODE_ENV === 'production' ? 3 : 1;
// const voteTimeoutThreshold = NODE_ENV === 'production' ? 3 : 1;
// const voteUnderbanThreshold = NODE_ENV === 'production' ? 3 : 1;
// const voteDownvoteThreshold = NODE_ENV === 'production' ? 3 : 1;

// module.exports = {
//   async communityMod(reaction/* , user */) {
//     let target = {};
//     if (!target) {
//       // log.debug(`[${PREFIX}] target is null, pulling fresh member data`);
//       target = await reaction.message.guild.members.fetch(reaction.message.author.id);
//     }

//     if (reaction.message.author.discriminator === '0000') {
//       // This is a bot, so we need to get the username of the user
//       target = reaction.message.author.username;
//     } else {
//       target = reaction.message.author.toString();
//       // If the user is already in timeout then ignore this
//       // if (target.isCommunicationDisabled()) { return; }
//     }
//     // log.debug(`[${PREFIX}] target: ${target}`);

//     const moderatorRole = reaction.message.guild.roles.cache
//       .find(role => role.id === ROLE_MODERATOR);

//   // log.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction, null, 2)}`);
//   // log.debug(`[${PREFIX}] reaction.message: ${JSON.stringify(reaction.message, null, 2)}`);
//     if (reaction.count === voteDownvoteThreshold && (reaction.emoji.name === 'karma_downvote' || reaction.emoji.name === 'ts_votedown')) {
//     // log.debug(`[${PREFIX}] ${target} has been downvoted three times, muting!`);
//       const actor = 'The community';
//       const command = 'timeout';
//       const { channel } = reaction.message;
//       const toggle = 'on';
//       const reason = stripIndents`
//       > 'Downvoted multiple times by the community, pending moderator review.'

//       [The offending message:](${reaction.message.url})
//       > ${reaction.message.cleanContent}`;

//       const duration = null;

//       const result = await moderate(actor, command, target, channel, toggle, reason, duration);
//     // log.debug(`[${PREFIX}] Result: ${result}`);

//       if (result.includes('you cannot timeout a team member')) {
//       // log.debug(`[${PREFIX}] ${target} is a team member, not muting!`);
//         return;
//       }

//       return reaction.message.reply(stripIndents`
//       Hey ${moderatorRole.toString()}! ${target} was community quieted for this, please review!

//       **They will be quieted for 1 week unless a moderator takes action!**`);
//     }

//     // Process vote ban
//     if (reaction.count === voteBanThreshold && reaction.emoji.name === 'vote_ban') {
//     // log.debug(`[${PREFIX}] ${target} has been ${reaction.emoji.name} ${voteBanThreshold} times!`);
//       target.timeout(604800000, `Was community banned for saying "${reaction.message}"`);
//       const roleVotebanned = reaction.message.guild.roles.cache
//         .find(role => role.id === roleVotebannedId);
//       await target.roles.add(roleVotebanned);

//       // Extract actor data
//       const [actorData, actorFbid] = await getUserInfo(target);

//       // Transform actor data
//       if ('discord' in actorData) {
//         actorData.discord.communityMod = {
//           action: reaction.emoji.name,
//           date: new Date(),
//         };
//       } else {
//         actorData.discord = {
//           communityMod: {
//             lastSetMindset: reaction.emoji.name,
//             lastSetMindsetDate: new Date(),
//           },
//         };
//       }

//       // Load actor data
//       await setUserInfo(actorFbid, actorData);

//       return reaction.message.reply(stripIndents`
//         Hey ${moderatorRole}! ${target.user.username} was community banned for this, please review!

//         **They will be auto-banned in 24 hours if the autoban role isnt removed!**`);
//     }

//     // Process vote kick
//     if (reaction.count === voteKickThreshold && reaction.emoji.name === 'vote_kick') {
//     // log.debug(`[${PREFIX}] ${target} has been ${reaction.emoji.name} ${voteKickThreshold} times!`);
//       target.timeout(604800000, `Was community kicked for saying "${reaction.message}"`);
//       const roleVotekicked = reaction.message.guild.roles.cache
//         .find(role => role.id === roleVotekickedId);
//       await target.roles.add(roleVotekicked);
//       return reaction.message.reply(stripIndents`
//         Hey ${moderatorRole}! ${target.username} was community kicked for this, please review!

//         **They will be auto-kicked in 24 hours if the autokick role isnt removed!**`);
//     }

//     // Process vote timeout
//     if (reaction.count === voteTimeoutThreshold && reaction.emoji.name === 'vote_timeout') {
//     // log.debug(`[${PREFIX}] ${target} has been ${reaction.emoji.name} ${voteKickThreshold} times!`);
//       target.timeout(3600000, `Was community quieted for saying "${reaction.message}"`);
//       const roleVotetimeout = reaction.message.guild.roles.cache
//         .find(role => role.id === roleVotetimeoutId);
//       await target.roles.add(roleVotetimeout);
//       return reaction.message.reply(stripIndents`
//         Hey ${moderatorRole}! ${target.username} was community quieted for this, please review!

//         **They will be un-quieted in 1 hour if the autoquiet role isnt removed!**`);
//     }

//     // Process vote underban
//     if (reaction.count === voteUnderbanThreshold && reaction.emoji.name === 'vote_underban') {
//       const isNewbie = target.roles.cache.find(
//         role => role.id === ROLE_NEWBIEId,
//       ) !== undefined;
//       if (isNewbie) { return; }
//     // log.debug(`[${PREFIX}] ${target} has been ${reaction.emoji.name} ${voteUnderbanThreshold} times!`);
//       const roleVoteunderban = reaction.message.guild.roles.cache
//         .find(role => role.id === roleVoteunderbanId);
//       const ROLE_NEWBIE = reaction.message.guild.roles.cache
//         .find(role => role.id === ROLE_NEWBIEId);

//       // Remove all roles, except team and vanity, from the target
//       target.roles.cache.forEach(role => {
//       // log.debug(`[${PREFIX}] role: ${role.name} - ${role.id}`);
//         if (!ignoredRoles.includes(role.id) && !role.name.includes('@everyone') && !role.name.includes('NeedsHelp')) {
//         // log.debug(`[${PREFIX}] Removing role ${role.name} from ${target.nickname || target.user.username}`);
//           try {
//             target.roles.remove(role);
//           } catch (err) {
//           // log.debug(`[${PREFIX}] There was an error removing the role ${role.name} from ${target.nickname || target.user.username}\n${err}`);
//           }
//         }
//       });

//       // Add the ROLE_NEWBIE and roleVoteunderban role to the target
//       try {
//       // log.debug(`[${PREFIX}] Adding role ${roleVoteunderban.name} to ${target.nickname || target.user.username}`);
//         await target.roles.add(roleVoteunderban);
//       // log.debug(`[${PREFIX}] Adding role ${ROLE_NEWBIE.name} to ${target.nickname || target.user.username}`);
//         await target.roles.add(ROLE_NEWBIE);
//       } catch (err) {
//         log.error(`[${PREFIX}] Error adding role to target: ${err}`);
//         return reaction.message.reply(stripIndents`There was an error adding the NeedsHelp role!
//           Make sure the bot's role is higher than NeedsHelp in the Role list!`);
//       }

//       return reaction.message.reply(stripIndents`
//       Hey ${moderatorRole}! ${target.username} was community underbanned for this, please review!

//       **They will stay in the ${ROLE_NEWBIE.toString()} role until a moderator changes it!**`);
//     }
//   },
// };
