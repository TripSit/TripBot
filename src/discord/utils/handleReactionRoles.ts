import {
  MessageReaction,
  User,
} from 'discord.js';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';

const PREFIX = require('path').parse(__filename).name;

const mindsetRoleMap = [
  {
    reaction: 'ts_drunk',
    roleId: env.ROLE_DRUNK,
  },
  {
    reaction: 'ts_high',
    roleId: env.ROLE_HIGH,
  },
  {
    reaction: 'ts_rolling',
    roleId: env.ROLE_ROLLING,
  },
  {
    reaction: 'ts_tripping',
    roleId: env.ROLE_TRIPPING,
  },
  {
    reaction: 'ts_dissociating',
    roleId: env.ROLE_DISSOCIATING,
  },
  {
    reaction: 'ts_stimming',
    roleId: env.ROLE_STIMMING,
  },
  {
    reaction: 'ts_nodding',
    roleId: env.ROLE_NODDING,
  },
  // {
  //   reaction: `ts_sober`,
  //   roleId: ROLE_SOBER,
  // },
  {
    reaction: 'ts_talkative',
    roleId: env.ROLE_TALKATIVE,
  },
  {
    reaction: 'ts_working',
    roleId: env.ROLE_WORKING,
  },
];

const colorRoleMap = [
  {
    reaction: '❤',
    roleId: env.ROLE_RED,
  },
  {
    reaction: '🧡',
    roleId: env.ROLE_ORANGE,
  },
  {
    reaction: '💛',
    roleId: env.ROLE_YELLOW,
  },
  {
    reaction: '💚',
    roleId: env.ROLE_GREEN,
  },
  {
    reaction: '💙',
    roleId: env.ROLE_BLUE,
  },
  {
    reaction: '💜',
    roleId: env.ROLE_PURPLE,
  },
  {
    reaction: 'pink_heart',
    roleId: env.ROLE_PINK,
  },
  {
    reaction: '🖤',
    roleId: env.ROLE_BLACK,
  },
  {
    reaction: '🤍',
    roleId: env.ROLE_WHITE,
  },
];

/**
 * This runs on every message to determine if a badword is used
 * @param {MessageReaction} reaction Reaction used
 * @param {User} user User that reacted
 * @return {Promise<void>}
 */
export async function handleReactionRoles(reaction:MessageReaction, user:User): Promise<void> {
  logger.debug(`[${PREFIX}] started!`);
  // logger.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction, null, 2)}`);
  // logger.debug(`[${PREFIX}] user: ${JSON.stringify(user, null, 2)}`);

  // Get member data
  const member = await reaction.message?.guild?.members.fetch(user.id);
  // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);

  const mindsetEmojis = mindsetRoleMap.map((m) => m.reaction);
  const mindsetIds = mindsetRoleMap.map((m) => m.roleId);

  // if the reaction is a mindset reaction
  if (member) {
    if (reaction.emoji.name) {
      if (mindsetEmojis.includes(reaction.emoji.name)) {
        // Remove all existing mindset roles
        // eslint-disable-next-line no-restricted-syntax
        for (const mindsetId of mindsetIds) {
          // eslint-disable-next-line no-await-in-loop
          await member.roles.remove(mindsetId.toString());
        }

        // Add the new mindset role
        // eslint-disable-next-line no-restricted-syntax
        for (const role of mindsetRoleMap) {
          if (reaction.emoji.name === role.reaction) {
            logger.debug(`[${PREFIX}] FOUND: ${role.roleId}`);
            logger.debug(`[${PREFIX}] role: ${role.reaction}`);
            const roleObj = reaction.message?.guild?.roles.cache.find((r) => r.id === role.roleId);
            // eslint-disable-next-line no-await-in-loop
            if (roleObj) {
              await member.roles.add(roleObj);
            }
          }
        }
      }
    }

    const colorEmojis = colorRoleMap.map((m) => m.reaction);
    const colorIds = colorRoleMap.map((m) => m.roleId);

    // if the reaction is a mindset reaction
    if (reaction.emoji.name) {
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
            const roleObj = reaction.message?.guild?.roles.cache.find((r) => r.id === role.roleId);
            // eslint-disable-next-line no-await-in-loop
            if (roleObj) {
              await member.roles.add(roleObj);
            }
          }
        }
      }
    }
  }
  // Remove the reaction
  reaction.users.remove(user.id);
  logger.debug(`[${PREFIX}] finished!`);
};
