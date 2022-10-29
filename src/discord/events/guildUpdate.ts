import {Guild} from 'discord.js';
import {
  guildEvent,
} from '../@types/eventDef';
import {db} from '../../global/utils/knex';
import {DiscordGuilds} from '../../global/@types/pgdb';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const guildUpdate: guildEvent = {
  name: 'guildUpdate',

  async execute(guild: Guild) {
    // logger.debug(`[${PREFIX}] starting!`);

    const data = await db
      .select(db.ref('is_banned').as('is_banned'))
      .from<DiscordGuilds>('users')
      .where('discord_id', guild.id);

    if (data[0]) {
      if (data[0].is_banned) {
        logger.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
        guild.leave();
        return;
      }
      // else {
      //   await db('discord_guilds')
      //     .insert({
      //       id: guild.id,
      //     })
      //     .onConflict('discord_id')
      //     .merge();
      // }
    } else {
      await db('discord_guilds')
        .insert({
          id: guild.id,
        })
        .onConflict('discord_id')
        .merge();
    }

    // logger.debug(`[${PREFIX}] finished!`);
  },
};
