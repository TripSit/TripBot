import {
  Message,
} from 'discord.js';
import {
  ChannelType,
} from 'discord-api-types/v10';
import {
  messageEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import {thoughtPolice} from '../utils/d.thoughtPolice';
import {experience} from '../../global/utils/experience';
import {announcements} from '../utils/announcements';
import {messageCommand} from '../utils/messageCommand';
import {modmailDMInteraction, modmailThreadInteraction} from '../commands/guild/modmail';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const messageCreate: messageEvent = {
  name: 'messageCreate',
  async execute(message: Message):Promise<void> {
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (message.guild) {
      if (message.guild.id !== env.DISCORD_GUILD_ID.toString()) {
        return;
      }
    }

    // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);

    // Disabled for testing
    // thoughtPolice(message);

    // This needs to run here beacuse the widgetbot peeps will use this and they are "bot users"
    // This handles ~ commands
    messageCommand(message);

    // Don't run on bots
    if (message.author.bot) {
      return;
    }

    // If this is a DM, run the modmail function.
    if (message.channel.type === ChannelType.DM) {
      await modmailDMInteraction(message);
    }

    // Run this now, so that when you're helping in the tech/tripsit rooms you'll always get exp
    experience(message);

    // Check if the message came in a thread in the helpdesk channel

    if (message.channel.isThread()) {
      modmailThreadInteraction(message);
    }

    announcements(message);
  },
};
