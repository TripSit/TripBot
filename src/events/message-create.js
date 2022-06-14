'use strict';

const PREFIX = require('path').parse(__filename).name;
const { announcements } = require('../utils/announcements');
const { karma } = require('../utils/karma');
const { experience } = require('../utils/experience');
const { modmailInitialResponse } = require('../commands/guild/modmail');
const logger = require('../utils/logger');
const { getUserInfo, setUserInfo, getTicketInfo } = require('../utils/firebase');

const {
  discordGuildId,
  channelModeratorsId,
} = require('../../env');

// https://github.com/Cyanic76/discord-modmail/blob/master/bot.js

module.exports = {
  name: 'messageCreate',
  async execute(message) {
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

    // Don't run on bot messages
    if (message.author.bot) { return; }

    // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);

    // If this is a DM, run the modmail function.
    if (message.channel.type === 'DM') {
      // Dont run if the user mentions @everyone or @here.
      if (message.content.includes('@everyone') || message.content.includes('@here')) {
        return message.author.send("You're not allowed to use those mentions.");
      }

      const [actorData] = await getUserInfo(message.author);

      // Get ticket information
      let ticketInfo = {};
      if ('discord' in actorData) {
        if ('tickets' in actorData.discord) {
          // Check if the 'status' of each ticket is 'open' and if so make a list
          actorData.discord.tickets.forEach(ticket => {
            if (ticket.issueStatus === 'open') {
              ticketInfo = ticket;
            }
          });
        }
      }

      // Get the ticket ID
      logger.debug(`[${PREFIX}] ticketInfo: ${JSON.stringify(ticketInfo, null, 2)}!`);
      if (Object.keys(ticketInfo).length !== 0) {
        // Get the moderation channel
        const modChan = message.client.channels.cache.get(channelModeratorsId);
        const issueThread = await modChan.threads.fetch(ticketInfo.issueThread);
        // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
        if (issueThread) {
          issueThread.send(message);
          return;
        }
      }

      return modmailInitialResponse(message);
    }

    // Only run on Tripsit
    if (message.guild.id !== discordGuildId) { return; }

    if (message.channel.parentId === channelModeratorsId) {
      // If this is a moderator channel, run the modmail function.
      logger.debug(`[${PREFIX}] Moderator channel!`);

      const [ticketData] = await getTicketInfo(message.channel.id);
      logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

      const member = await message.client.users.fetch(ticketData.issueUser);
      logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

      member.send(`TeamTripsit: ${message}`);
      logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);
    }

    announcements(message);
    karma(message);
    experience(message);
  },
};
