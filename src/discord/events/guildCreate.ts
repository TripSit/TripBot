import {Guild} from 'discord.js';
import {
  guildEvent,
} from '../@types/eventDef';
import {db} from '../../global/utils/knex';
import {DiscordGuilds} from '../../global/@types/pgdb';
import log from '../../global/utils/log';
const PREFIX = require('path').parse(__filename).name;

export const guildCreate: guildEvent = {
  name: 'guildCreate',

  async execute(guild: Guild) {
    log.debug(`[${PREFIX}] starting!`);
    log.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);

    const data = await db
      .select(db.ref('is_banned').as('is_banned'))
      .from<DiscordGuilds>('users')
      .where('discord_id', guild.id);

    if (data[0]) {
      if (data[0].is_banned) {
        log.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
        guild.leave();
        return;
      } else {
        await db('discord_guilds')
          .insert({
            id: guild.id,
            joined_at: new Date(),
          })
          .onConflict('discord_id')
          .merge();
      }
    } else {
      await db('discord_guilds')
        .insert({
          id: guild.id,
          is_banned: false,
          joined_at: new Date(),
        })
        .onConflict('discord_id')
        .merge();
    }

    log.debug(`[${PREFIX}] finished!`);
  },
};
