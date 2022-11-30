import {
  ChannelType,
} from 'discord-api-types/v10';
import {
  MessageCreateEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import {thoughtPolice} from '../utils/d.thoughtPolice';
import { experience } from '../../global/utils/experience';
import { announcements } from '../utils/announcements';
import { messageCommand } from '../utils/messageCommand';
import { modmailDMInteraction, modmailThreadInteraction } from '../commands/guild/modmail';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const PREFIX = parse(__filename).name;

export default messageCreate;

export const messageCreate: MessageCreateEvent = {
  name: 'messageCreate',
  async execute(message) {
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (message.guild && message.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    // log.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);

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
