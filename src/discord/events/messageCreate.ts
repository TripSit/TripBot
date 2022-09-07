import {
  Message,
  ThreadChannel,
  TextChannel,
} from 'discord.js';
import {
  ChannelType,
} from 'discord-api-types/v10';
import env from '../../global/utils/env.config';
import {thoughtPolice} from '../utils/d.thoughtPolice';
import {stripIndents} from 'common-tags';
import {embedTemplate} from '../utils/embedTemplate';
import {experience} from '../../global/utils/experience';
import {announcements} from '../utils/announcements';
import {modmailInitialResponse} from '../commands/guild/modmail';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

// const { WebhookClient } = require('discord.js');
// const { karma } = require('../../global/utils/karma');

module.exports = {
  name: 'messageCreate',
  async execute(message: Message) {
    // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);
    // Only run on Tripsit
    if (message.guild) {
      if (message.guild.id !== env.DISCORD_GUILD_ID.toString()) {
        return;
      }
    }
    // {
    //   "channelId": "960606558549594162",
    //   "guildId": "960606557622657026",
    //   "id": "983832049687363655",
    //   "createdTimestamp": 1654634239361,
    //   "type": "DEFAULT",
    //   "system": false,
    //   "content": "test",
    //   "authorId": "177537158419054592",
    //   "pinned": false,
    //   "tts": false,
    //   "nonce": "983832049582342144",
    //   "embeds": [],
    //   "components": [],
    //   "attachments": [],
    //   "stickers": [],
    //   "editedTimestamp": null,
    //   "webhookId": null,
    //   "groupActivityApplicationId": null,
    //   "applicationId": null,
    //   "activity": null,
    //   "flags": 0,
    //   "reference": null,
    //   "interaction": null,
    //   "cleanContent": "test"
    // }

    // Don't run on bots
    if (message.author.bot) {
      return;
    }

    // If this is a DM, run the modmail function.
    if (message.channel.type === ChannelType.DM) {
      // Dont run if the user mentions @everyone or @here.
      if (message.content.includes('@everyone') || message.content.includes('@here')) {
        return message.author.send('You\'re not allowed to use those mentions.');
      }

      // Get the ticket info
      let ticketData:any = {};

      if (global.db) {
        const ref = db.ref(`${env.FIREBASE_DB_TICKETS}/${message.author.id}/`);
        await ref.once('value', (data:any) => {
          if (data.val() !== null) {
            ticketData = data.val();
          } else {
            return;
          }
        });
      }
      logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

      if (ticketData === 'blocked') {
        return message.author.send('You are blocked!');
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
          return thread.send(message.cleanContent);
        }
      }

      return modmailInitialResponse(message);
    }

    announcements(message);
    // karma(message);
    thoughtPolice(message);
    experience(message);
  },
};
