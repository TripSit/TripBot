import {
  TextChannel,
} from 'discord.js';
// import { parse } from 'path';
import {
  MessageUpdateEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import log from '../../global/utils/log';
// eslint-disable-line no-unused-vars
// const PREFIX = parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default messageUpdate;

export const messageUpdate: MessageUpdateEvent = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild) return;
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (newMessage.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    // log.debug(`[${PREFIX}] oldMessage: ${JSON.stringify(oldMessage, null, 2)}`);
    // log.debug(`[${PREFIX}] newMessage: ${JSON.stringify(newMessage, null, 2)}`);

    // Don't run when bots update messages
    if (!newMessage.author) return;
    if (newMessage.author.bot) return;

    const response = `Message ${newMessage.id} was edited by ${newMessage.author.tag} in ${(newMessage.channel as TextChannel).name} from ${oldMessage.content} to ${newMessage.content}.`; // eslint-disable-line max-len
    const botlog = newMessage.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    botlog.send(response);
  },
};
