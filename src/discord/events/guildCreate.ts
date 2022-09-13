import {Guild} from 'discord.js';
import {
  guildEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const guildCreate: guildEvent = {
  name: 'guildCreate',

  async execute(guild: Guild) {
    logger.debug(`[${PREFIX}] starting!`);
    logger.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);

    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_GUILDS}/${guild.id}`);
      await ref.once('value', (data:any) => {
        if (data.val() !== null) {
          if (data.val().guild_banned) {
            logger.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
            guild.leave();
            return;
          }
          const guildData = {
            guild_name: guild.name,
            guild_createdAt: guild.createdAt || '',
            guild_joinedAt: guild.joinedAt || '',
            guild_description: `${guild.description ? guild.description : 'No description'}`,
            guild_member_count: guild.memberCount || 0,
            guild_owner_id: guild.ownerId || 'No Owner',
            guild_banned: false,
          };
          ref.update(guildData);
        }
      });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
