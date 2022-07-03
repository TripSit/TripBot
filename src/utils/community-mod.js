'use strict';

const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags');
const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('./firebase');

const {
  NODE_ENV,
  roleModeratorId,
  roleNewbieId,
  roleVotebannedId,
  roleVotekickedId,
  roleVotetimeoutId,
  roleVoteunderbanId,
  roleDirectorId,
  roleSuccessorId,
  roleSysadminId,
  roleLeaddevId,
  roleIrcadminId,
  roleDiscordadminId,
  roleIrcopId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbotId,
  roleTripbot2Id,
  roleBotId,
  roleDeveloperId,
  roleTreeId,
  roleSproutId,
  roleSeedlingId,
  roleBoosterId,
  roleRedId,
  roleOrangeId,
  roleYellowId,
  roleGreenId,
  roleBlueId,
  rolePurpleId,
  rolePinkId,
  roleBrownId,
  roleBlackId,
  roleWhiteId,
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  roleSoberId,
} = require('../../env');

const teamRoles = [
  roleDirectorId,
  roleSuccessorId,
  roleSysadminId,
  roleLeaddevId,
  roleIrcadminId,
  roleDiscordadminId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbot2Id,
  roleTripbotId,
  roleBotId,
  roleDeveloperId,
];

const colorRoles = [
  roleTreeId,
  roleSproutId,
  roleSeedlingId,
  roleBoosterId,
  roleRedId,
  roleOrangeId,
  roleYellowId,
  roleGreenId,
  roleBlueId,
  rolePurpleId,
  rolePinkId,
  roleBrownId,
  roleBlackId,
  roleWhiteId,

];

const mindsetRoles = [
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  roleSoberId,
];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles}`;

// How many votes are needed for each action, in production and dev
const voteBanThreshold = NODE_ENV === 'production' ? 3 : 1;
const voteKickThreshold = NODE_ENV === 'production' ? 3 : 1;
const voteTimeoutThreshold = NODE_ENV === 'production' ? 3 : 1;
const voteUnderbanThreshold = NODE_ENV === 'production' ? 3 : 1;
const voteDownvoteThreshold = NODE_ENV === 'production' ? 3 : 1;

module.exports = {
  async communityMod(reaction/* , user */) {
    logger.debug(`[${PREFIX}] starting!`);

    let target = reaction.message.member;
    if (!target) {
      // logger.debug(`[${PREFIX}] target is null, pulling fresh member data`);
      target = await reaction.message.guild.members.fetch(reaction.message.author.id);
    }
    // logger.debug(`[${PREFIX}] target: ${target}`);

    // If the user is already in timeout then ignore this
    if (target.isCommunicationDisabled()) { return; }

    const moderatorRole = reaction.message.guild.roles.cache
      .find(role => role.id === roleModeratorId);

    // logger.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction, null, 2)}`);
    // logger.debug(`[${PREFIX}] reaction.message: ${JSON.stringify(reaction.message, null, 2)}`);
    if (reaction.count === voteDownvoteThreshold && reaction.emoji.name === 'karma_downvote') {
      logger.debug(`[${PREFIX}] ${target} has been downvoted three times, muting!`);
      reaction.message.member.timeout(604800000, `Was community quieted for saying "${reaction.message}"`);
      return reaction.message.reply(stripIndents`
      Hey ${moderatorRole}! ${target.user.username} was downvoted three times for this, please review!

      **They will be quieted for 1 week unless a moderator takes action!**`);
    }

    // Process vote ban
    if (reaction.count === voteBanThreshold && reaction.emoji.name === 'vote_ban') {
      logger.debug(`[${PREFIX}] ${target} has been ${reaction.emoji.name} ${voteBanThreshold} times!`);
      target.timeout(604800000, `Was community banned for saying "${reaction.message}"`);
      const roleVotebanned = reaction.message.guild.roles.cache
        .find(role => role.id === roleVotebannedId);
      await target.roles.add(roleVotebanned);

      // Extract actor data
      const [actorData, actorFbid] = await getUserInfo(target);

      // Transform actor data
      if ('discord' in actorData) {
        actorData.discord.communityMod = {
          action: reaction.emoji.name,
          date: new Date(),
        };
      } else {
        actorData.discord = {
          communityMod: {
            lastSetMindset: reaction.emoji.name,
            lastSetMindsetDate: new Date(),
          },
        };
      }

      // Load actor data
      await setUserInfo(actorFbid, actorData);

      const userDb = [];
      global.userDb.forEach(doc => {
        if (doc.key === actorFbid) {
          userDb.push({
            key: doc.key,
            value: actorData,
          });
          logger.debug(`[${PREFIX}] Updated actor in userDb`);
        } else {
          userDb.push({
            key: doc.key,
            value: doc.value,
          });
        }
      });
      Object.assign(global, { userDb });
      logger.debug(`[${PREFIX}] Updated global user data.`);

      return reaction.message.reply(stripIndents`
        Hey ${moderatorRole}! ${target.user.username} was community banned for this, please review!

        **They will be auto-banned in 24 hours if the autoban role isnt removed!**`);
    }

    if (reaction.count === voteKickThreshold && reaction.emoji.name === 'vote_kick') {
      logger.debug(`[${PREFIX}] ${target} has been ${reaction.emoji.name} ${voteKickThreshold} times!`);
      target.timeout(604800000, `Was community kicked for saying "${reaction.message}"`);
      const roleVotekicked = reaction.message.guild.roles.cache
        .find(role => role.id === roleVotekickedId);
      await target.roles.add(roleVotekicked);
      return reaction.message.reply(stripIndents`
        Hey ${moderatorRole}! ${target.username} was community kicked for this, please review!

        **They will be auto-kicked in 24 hours if the autokick role isnt removed!**`);
    }
    if (reaction.count === voteTimeoutThreshold && reaction.emoji.name === 'vote_timeout') {
      logger.debug(`[${PREFIX}] ${target} has been ${reaction.emoji.name} ${voteKickThreshold} times!`);
      target.timeout(3600000, `Was community quieted for saying "${reaction.message}"`);
      const roleVotetimeout = reaction.message.guild.roles.cache
        .find(role => role.id === roleVotetimeoutId);
      await target.roles.add(roleVotetimeout);
      return reaction.message.reply(stripIndents`
        Hey ${moderatorRole}! ${target.username} was community quieted for this, please review!

        **They will be un-quieted in 1 hour if the autoquiet role isnt removed!**`);
    }

    if (reaction.count === voteUnderbanThreshold && reaction.emoji.name === 'vote_underban') {
      const isNewbie = target.roles.cache.find(
        role => role.id === roleNewbieId,
      ) !== undefined;
      if (isNewbie) { return; }
      logger.debug(`[${PREFIX}] ${target} has been ${reaction.emoji.name} ${voteUnderbanThreshold} times!`);
      const roleVoteunderban = reaction.message.guild.roles.cache
        .find(role => role.id === roleVoteunderbanId);
      const roleNewbie = reaction.message.guild.roles.cache
        .find(role => role.id === roleNewbieId);

      // Remove all roles, except team and vanity, from the target
      target.roles.cache.forEach(role => {
        logger.debug(`[${PREFIX}] role: ${role.name} - ${role.id}`);
        if (!ignoredRoles.includes(role.id) && !role.name.includes('@everyone') && !role.name.includes('NeedsHelp')) {
          logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.nickname || target.user.username}`);
          try {
            target.roles.remove(role);
          } catch (err) {
            logger.debug(`[${PREFIX}] There was an error removing the role ${role.name} from ${target.nickname || target.user.username}\n${err}`);
          }
        }
      });

      // Add the roleNewbie and roleVoteunderban role to the target
      try {
        logger.debug(`[${PREFIX}] Adding role ${roleVoteunderban.name} to ${target.nickname || target.user.username}`);
        await target.roles.add(roleVoteunderban);
        logger.debug(`[${PREFIX}] Adding role ${roleNewbie.name} to ${target.nickname || target.user.username}`);
        await target.roles.add(roleNewbie);
      } catch (err) {
        logger.error(`[${PREFIX}] Error adding role to target: ${err}`);
        return reaction.message.reply(stripIndents`There was an error adding the NeedsHelp role!
          Make sure the bot's role is higher than NeedsHelp in the Role list!`);
      }

      return reaction.message.reply(stripIndents`
      Hey ${moderatorRole}! ${target.username} was community underbanned for this, please review!

      **They will stay in the ${roleNewbie.toString()} role until a moderator changes it!**`);
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
