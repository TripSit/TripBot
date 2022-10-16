import {
  Message,
  ThreadChannel,
  TextChannel,
  GuildMember,
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
          }
        });
      }
      // logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

      if (ticketData.issueStatus === 'blocked') {
        message.author.send('You are blocked!');
        return;
      }

      if (Object.keys(ticketData).length !== 0) {
        const guild = await message.client.guilds.fetch(env.DISCORD_GUILD_ID);
        let member = {} as GuildMember;
        try {
          member = await guild.members.fetch(message.author.id);
        } catch (error) {
          // This just means the user is not on the TripSit guild
        }

        // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

        // If the user is on the guild, direct them to the existing ticket
        if (member.user) {
          const channel = await message.client.channels.fetch(env.CHANNEL_HELPDESK) as TextChannel;
          const issueThread = await channel.threads.fetch(ticketData.issueThread) as ThreadChannel;
          const embed = embedTemplate();
          embed.setDescription(stripIndents`You already have an open issue here ${issueThread.toString()}!`);
          message.reply({embeds: [embed]});
          return;
        }

        // Otherwise send a message to the thread
        const channel = message.client.channels.cache.get(env.CHANNEL_HELPDESK) as TextChannel;
        const thread = await channel.threads.fetch(ticketData.issueThread) as ThreadChannel;
        // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
        if (thread) {
          thread.send(message.cleanContent);
          return;
        }
      }
      logger.debug(`[${PREFIX}] User not member of guild`);
      modmailInitialResponse(message);
      return;
    }

    // Run this now, so that when you're helping in the tech/tripsit rooms you'll always get exp
    experience(message);

    // Check if the message came in a thread in the helpdesk channel
    const threadMessage = message.channel.type === ChannelType.PublicThread ||
      message.channel.type === ChannelType.PrivateThread;
    logger.debug(`[${PREFIX}] threadMessage: ${threadMessage}!`);
    if (threadMessage) {
      logger.debug(`[${PREFIX}] message.channel.parentId: ${message.channel.parentId}!`);
      if (
        message.channel.parentId === env.CHANNEL_HELPDESK ||
        message.channel.parentId === env.CHANNEL_TALKTOTS ||
        message.channel.parentId === env.CHANNEL_TRIPSIT) {
        logger.debug(`[${PREFIX}] message sent in a thread in a helpdesk channel!`);
        // Get the ticket info
        let ticketData = {} as ticketDbEntry;
        if (global.db) {
          const ref = db.ref(`${env.FIREBASE_DB_TICKETS}`);
          await ref.once('value', (data) => {
            if (data.val() !== null) {
              const allTickets = data.val();
              Object.keys(allTickets).forEach((key) => {
                if (allTickets[key].issueThread === message.channel.id) {
                  ticketData = allTickets[key];
                }
              });
            }
          });
        }

        logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

        if (Object.keys(ticketData).length !== 0) {
          // Get the user from the ticketData
          const user = await message.client.users.fetch(ticketData.issueUser);
          logger.debug(`[${PREFIX}] user: ${JSON.stringify(user, null, 2)}!`);
          user.send(message.cleanContent);
          return;
        }
      }
    }

    announcements(message);
  },
};
