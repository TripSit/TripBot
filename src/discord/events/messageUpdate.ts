import {
  TextChannel,
} from 'discord.js';
import {
  messageUpdateEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const messageUpdate: messageUpdateEvent = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild) return;
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (newMessage.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const response = `Message ${newMessage.id} was edited by ${newMessage.author.tag} in ${(newMessage.channel as TextChannel).name} from ${oldMessage.content} to ${newMessage.content}.`; // eslint-disable-line max-len
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    botlog.send(response);
  },
};
