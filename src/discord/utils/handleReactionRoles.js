'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

const {
  // NODE_ENV,
  // discordGuildId,
  // channelStartId,
  roleRedId,
  roleOrangeId,
  roleYellowId,
  roleGreenId,
  roleBlueId,
  rolePurpleId,
  rolePinkId,
  roleBlackId,
  roleWhiteId,
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  // roleSoberId,
  roleTalkativeId,
  roleWorkingId,
} = require('../../../env');

const mindsetRoleMap = [
  {
    reaction: 'ts_drunk',
    roleId: roleDrunkId,
  },
  {
    reaction: 'ts_high',
    roleId: roleHighId,
  },
  {
    reaction: 'ts_rolling',
    roleId: roleRollingId,
  },
  {
    reaction: 'ts_tripping',
    roleId: roleTrippingId,
  },
  {
    reaction: 'ts_dissociating',
    roleId: roleDissociatingId,
  },
  {
    reaction: 'ts_stimming',
    roleId: roleStimmingId,
  },
  {
    reaction: 'ts_nodding',
    roleId: roleNoddingId,
  },
  // {
  //   reaction: `ts_sober`,
  //   roleId: roleSoberId,
  // },
  {
    reaction: 'ts_talkative',
    roleId: roleTalkativeId,
  },
  {
    reaction: 'ts_working',
    roleId: roleWorkingId,
  },
];

const colorRoleMap = [
  {
    reaction: '❤',
    roleId: roleRedId,
  },
  {
    reaction: '🧡',
    roleId: roleOrangeId,
  },
  {
    reaction: '💛',
    roleId: roleYellowId,
  },
  {
    reaction: '💚',
    roleId: roleGreenId,
  },
  {
    reaction: '💙',
    roleId: roleBlueId,
  },
  {
    reaction: '💜',
    roleId: rolePurpleId,
  },
  {
    reaction: 'pink_heart',
    roleId: rolePinkId,
  },
  {
    reaction: '🖤',
    roleId: roleBlackId,
  },
  {
    reaction: '🤍',
    roleId: roleWhiteId,
  },
];

module.exports = {
  async handleReactionRoles(reaction, user) {
    logger.debug(`[${PREFIX}] started!`);
    // logger.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction, null, 2)}`);
    // logger.debug(`[${PREFIX}] user: ${JSON.stringify(user, null, 2)}`);

    // Get member data
    const member = await reaction.message.guild.members.fetch(user.id);
    // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);

    const mindsetEmojis = mindsetRoleMap.map(m => m.reaction);
    const mindsetIds = mindsetRoleMap.map(m => m.roleId);

    // if the reaction is a mindset reaction
    if (mindsetEmojis.includes(reaction.emoji.name)) {
      // Remove all existing mindset roles
      // eslint-disable-next-line no-restricted-syntax
      for (const mindsetId of mindsetIds) {
        // eslint-disable-next-line no-await-in-loop
        await member.roles.remove(mindsetId);
      }

      // Add the new mindset role
      // eslint-disable-next-line no-restricted-syntax
      for (const role of mindsetRoleMap) {
        if (reaction.emoji.name === role.reaction) {
          logger.debug(`[${PREFIX}] FOUND: ${role.roleId}`);
          logger.debug(`[${PREFIX}] role: ${role.reaction}`);
          const roleObj = reaction.message.guild.roles.cache.find(r => r.id === role.roleId);
          // eslint-disable-next-line no-await-in-loop
          await member.roles.add(roleObj);
        }
      }
    }
    const colorEmojis = colorRoleMap.map(m => m.reaction);
    const colorIds = colorRoleMap.map(m => m.roleId);

    // if the reaction is a mindset reaction
    if (colorEmojis.includes(reaction.emoji.name)) {
      // Remove all existing mindset roles
      // eslint-disable-next-line no-restricted-syntax
      for (const colorId of colorIds) {
        // eslint-disable-next-line no-await-in-loop
        await member.roles.remove(colorId);
      }

      // Add the new mindset role
      // eslint-disable-next-line no-restricted-syntax
      for (const role of colorRoleMap) {
        if (reaction.emoji.name === role.reaction) {
          logger.debug(`[${PREFIX}] FOUND: ${role.roleId}`);
          logger.debug(`[${PREFIX}] role: ${role.reaction}`);
          const roleObj = reaction.message.guild.roles.cache.find(r => r.id === role.roleId);
          // eslint-disable-next-line no-await-in-loop
          await member.roles.add(roleObj);
        }
      }
    }

    // Remove the reaction
    reaction.users.remove(user.id);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
