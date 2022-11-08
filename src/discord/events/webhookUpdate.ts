import {
  TextChannel,
} from 'discord.js';
import {webhookUpdateEvent} from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const webhookUpdate: webhookUpdateEvent = {
  name: 'webhookUpdate',
  async execute(channel) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (channel.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const response = `Webhook updated in channel: ${channel.name} (${channel.id})`;
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    botlog.send(response);
    log.error(`[${PREFIX}] ${response}`);
  },
};
