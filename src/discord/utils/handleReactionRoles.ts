import {
  MessageReaction,
  User,
  Role,
} from 'discord.js';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';

const PREFIX = require('path').parse(__filename).name;

/**
 * This runs on every reaction to see if it's a reaction
 * @param {MessageReaction} reaction Reaction used
 * @param {User} user User that reacted
 * @param {boolean} add Whether to add or remove the role
 * @return {Promise<void>}
 */
export async function handleReactionRoles(
    reaction:MessageReaction,
    user:User,
    add:boolean,
): Promise<void> {
  logger.debug(`[${PREFIX}] started!`);
  // logger.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction, null, 2)}`);
  // logger.debug(`[${PREFIX}] user: ${JSON.stringify(user, null, 2)}`);
  // logger.debug(`[${PREFIX}] reaction.emoji.name: ${JSON.stringify(reaction.emoji.name, null, 2)}`);

  // Get the message that was reacted to

  type ReactionRole = {
    /** The name of the reaction role, just for humans*/
    name: string;
    /** Paste the reaction here, or the string name. NOT the numeric ID*/
    reaction: string;
    /** The ID of the role to give to users with this reaction*/
    roleId: string;
  };

  const ref = db.ref(`${env.FIREBASE_DB_GUILDS}/${reaction.message.guild!.id}/reactionRoles/${reaction.message.id}`);
  await ref.once('value', async (data:any) => {
    if (data.val() !== null) {
      const reactionRoles = data.val() as ReactionRole[];
      // logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoles, null, 2)}`);
      // Get member data
      const member = await reaction.message?.guild?.members.fetch(user.id);
      // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);

      const otherRoles:string[] = [];
      if (member) {
        // logger.debug(`[${PREFIX}] add: ${add}`);
        let selectedRole = '';

        // logger.debug(`[${PREFIX}] data.val(): ${JSON.stringify(data.val(), null, 2)}`);
        reactionRoles.forEach((value:ReactionRole) => {
          logger.debug(`[${PREFIX}] value.reaction: ${JSON.stringify(value.reaction, null, 2)}`);
          if (value.reaction === reaction.emoji.name ||
            value.reaction === reaction.emoji.id) {
            logger.debug(`[${PREFIX}] Found a match!`);
            selectedRole = value.roleId;
          } else {
            // logger.debug(`[${PREFIX}] No match, adding to OtherRoles: ${value.roleId}`);
            otherRoles.push(value.roleId);
          }
        });

        if (selectedRole === '') {
          logger.debug(`[${PREFIX}] No role found!`);
          return;
        }

        if (!add) {
          // Remove the role
          // logger.debug(`[${PREFIX}] Removing role ${selectedRole}`);
          const roleObj = reaction.message?.guild?.roles.cache.find(
              (r:Role) => r.id === selectedRole) as Role;
          member.roles.remove(roleObj);
          return;
        }

        otherRoles.forEach((roleId) => {
          member.roles.remove(roleId);
        });

        const roleObj = reaction.message?.guild?.roles.cache.find((r:Role) => r.id === selectedRole) as Role;
        member.roles.add(roleObj);

        // {
        //   "animated": false,
        //   "name": "ts_drunk",
        //   "id": "980917123322896395",
        //   "guildId": "960606557622657026",
        //   "requiresColons": true,
        //   "managed": false,
        //   "available": true,
        //   "author": null,
        //   "createdTimestamp": 1653939266759,
        //   "url": "https://cdn.discordapp.com/emojis/980917123322896395.png",
        //   "identifier": "ts_drunk:980917123322896395"
        // }

        // Remove duplicate reactions
        // This is slow but it works
        logger.debug(`[${PREFIX}] name: ${reaction.emoji.name}`);
        logger.debug(`[${PREFIX}] id: ${reaction.emoji.id}`);
        logger.debug(`[${PREFIX}] identifier: ${reaction.emoji.identifier}`);
        logger.debug(`[${PREFIX}] toString: ${reaction.emoji.toString()}`);
        for (let i = 0; i < reaction.message.reactions.cache.size; i++) {
          logger.debug(`[${PREFIX}] key: ${reaction.message.reactions.cache.keyAt(i)}`);
          if (reaction.message.reactions.cache.keyAt(i) !== reaction.emoji.name &&
              reaction.message.reactions.cache.keyAt(i) !== reaction.emoji.id) {
            const mreaction = reaction.message.reactions.resolve(
              reaction.message.reactions.cache.keyAt(i)!);
            mreaction?.users.remove(user);
            logger.debug(`[${PREFIX}] Removed duplicate reaction ${reaction.message.reactions.cache.keyAt(i)}`);
            continue;
          } else {
            logger.debug(`[${PREFIX}] skipping ${reaction.message.reactions.cache.keyAt(i)}`);
          }
        }
      }
    }
  });
  logger.debug(`[${PREFIX}] finished!`);
};
