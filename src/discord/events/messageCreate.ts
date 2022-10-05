import {
  Message,
  ThreadChannel,
  TextChannel,
} from 'discord.js';
import {
  ChannelType,
} from 'discord-api-types/v10';
import {
  messageEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import {thoughtPolice} from '../utils/d.thoughtPolice';
import {stripIndents} from 'common-tags';
import {embedTemplate} from '../utils/embedTemplate';
import {experience} from '../../global/utils/experience';
import {announcements} from '../utils/announcements';
import {messageCommand} from '../utils/messageCommand';
import {modmailInitialResponse} from '../commands/guild/modmail';
import {ticketDbEntry} from '../../global/@types/database';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const messageCreate: messageEvent = {
  name: 'messageCreate',
  async execute(message: Message):Promise<void> {
    // Only run on Tripsit
    if (message.guild) {
      if (message.guild.id !== env.DISCORD_GUILD_ID.toString()) {
        return;
      }
    }

    // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);

    // This needs to run here beacuse the widgetbot peeps will use this and they are "bot users"
    messageCommand(message);

    // Don't run on bots
    if (message.author.bot) {
      return;
    }

    // If this is a DM, run the modmail function.
    if (message.channel.type === ChannelType.DM) {
      // Dont run if the user mentions @everyone or @here.
      if (message.content.includes('@everyone') || message.content.includes('@here')) {
        message.author.send('You\'re not allowed to use those mentions.');
        return;
      }

      // Get the ticket info
      let ticketData = {} as ticketDbEntry;

      if (global.db) {
        const ref = db.ref(`${env.FIREBASE_DB_TICKETS}/${message.author.id}/`);
        await ref.once('value', (data) => {
          if (data.val() !== null) {
            ticketData = data.val();
          } else {
            return;
          }
        });
      }
      logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

      if (ticketData.issueStatus === 'blocked') {
        message.author.send('You are blocked!');
        return;
      }

      const guild = await message.client.guilds.fetch(env.DISCORD_GUILD_ID);
      const member = await guild.members.fetch(message.author.id);
      // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

      if (Object.keys(ticketData).length !== 0) {
        if (member) {
          const channel = await message.client.channels.fetch(env.CHANNEL_TECHHELP) as TextChannel;
          const issueThread = await channel.threads.fetch(ticketData.issueThread) as ThreadChannel;
          const embed = embedTemplate();
          embed.setDescription(stripIndents`You already have an open issue here ${issueThread.toString()}!`);
          message.reply({embeds: [embed]});
          return;
        }

        const channel = message.client.channels.cache.get(env.CHANNEL_TECHHELP) as TextChannel;
        const thread = await channel.threads.fetch(ticketData.issueThread) as ThreadChannel;
        // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
        if (thread) {
          thread.send(message.cleanContent);
          return;
        }
      }

      return modmailInitialResponse(message);
    }

    announcements(message);
    // thoughtPolice(message);
    experience(message);
  },
};
