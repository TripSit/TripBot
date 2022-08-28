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
  logger.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction, null, 2)}`);
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
  await ref.once('value', async (data) => {
    if (data.val() !== null) {
      const reactionRoles = data.val() as ReactionRole[];
      // Get member data
      const member = await reaction.message?.guild?.members.fetch(user.id);
      // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);

      const otherRoles:string[] = [];
      if (member) {
        logger.debug(`[${PREFIX}] add: ${add}`);
        if (!add) {
          // Remove the role
          logger.debug(`[${PREFIX}] Removing role ${data.val().roleId}`);
          const roleObj = reaction.message?.guild?.roles.cache.find(
              (r:Role) => r.id === reactionRoles[0].roleId) as Role;
          member.roles.remove(roleObj);
          return;
        }

        let selectedRole = '';
        // logger.debug(`[${PREFIX}] data.val(): ${JSON.stringify(data.val(), null, 2)}`);
        data.val().forEach((value:any) => {
          logger.debug(`[${PREFIX}] value: ${JSON.stringify(value, null, 2)}`);
          if (value.reaction === reaction.emoji.name) {
            logger.debug(`[${PREFIX}] Found a match!`);
            selectedRole = value.roleId;
          } else {
            otherRoles.push(value.roleId);
          }
        });

        otherRoles.forEach((roleId) => {
          member.roles.remove(roleId);
        });
        const roleObj = reaction.message?.guild?.roles.cache.find((r:Role) => r.id === selectedRole) as Role;
        await member.roles.add(roleObj);
      }
      if (otherRoles.length > 0) {
        reaction.users.remove(user.id);
      }
    }
  });
  logger.debug(`[${PREFIX}] finished!`);
};
