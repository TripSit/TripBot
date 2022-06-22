'use strict';

const PREFIX = require('path').parse(__filename).name;
// const { WebhookClient } = require('discord.js');
const { stripIndents } = require('common-tags');
const { announcements } = require('../utils/announcements');
const { karma } = require('../utils/karma');
const { experience } = require('../utils/experience');
const { modmailInitialResponse } = require('../commands/guild/modmail');
const logger = require('../utils/logger');
const template = require('../utils/embed-template');

const { getTicketInfo } = require('../utils/firebase');

const {
  discordGuildId,
  channelIrcId,
} = require('../../env');

// https://github.com/Cyanic76/discord-modmail/blob/master/bot.js

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Only run on Tripsit
    if (message.guild.id !== discordGuildId) { return; }
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
    logger.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);

    // Messages sent by the relay will have an author.tag value of "username#0000"
    // This is unique because users must have a tag > 0 on discord, so any tag with 0000 is a bot
    // However, even bots have tags, so if a bot has a tag of 0000, it's spoofing a user

    // Get the tag
    const discriminator = message.author.tag.substring(message.author.tag.length - 4);

    // Don't run on bots, unless they're spoofing a user
    if (message.author.bot && discriminator !== '0000') { return; }

    // If this is a DM, run the modmail function.
    if (message.channel.type === 'DM') {
      // Dont run if the user mentions @everyone or @here.
      if (message.content.includes('@everyone') || message.content.includes('@here')) {
        return message.author.send("You're not allowed to use those mentions.");
      }

      const [ticketData] = await getTicketInfo(message.author.id, 'user');
      logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

      if (ticketData === 'blocked') {
        return message.author.send('You are blocked!');
      }

      const guild = await message.client.guilds.fetch(discordGuildId);
      const member = await guild.members.fetch(message.author.id);
      // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

      if (Object.keys(ticketData).length !== 0) {
        // const webhookClient = new WebhookClient({
        //   id: ticketInfo.issueWebhook.webhookId,
        //   token: ticketInfo.issueWebhook.webhookToken,
        // });

        // webhookClient.send({
        //   content: message,
        //   username: message.author.username,
        //   avatarURL: message.author.avatarURL(),
        // });

        if (member) {
          const channel = await message.client.channels.fetch(channelIrcId);
          const issueThread = await channel.threads.fetch(ticketData.issueThread);
          const embed = template.embedTemplate();
          embed.setDescription(stripIndents`You already have an open issue here ${issueThread.toString()}!`);
          message.reply({ embeds: [embed], ephemeral: true });
          return;
        }

        const channel = message.client.channels.cache.get(channelIrcId);
        const thread = await channel.threads.fetch(ticketData.issueThread);
        // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
        if (thread) {
          return thread.send(message);
        }
      }

      return modmailInitialResponse(message);
    }

    // if (message.channel.parentId === channelIrcId) {
    //   // If this is a moderator channel, run the modmail function.
    //   logger.debug(`[${PREFIX}] IRC channel!`);

    //   const [ticketData] = await getTicketInfo(message.channel.id);
    //   logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

    //   const member = await message.client.users.fetch(ticketData.issueUser);
    //   logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

    //   member.send(`TeamTripsit: ${message}`);
    // }

    announcements(message);
    karma(message);
    experience(message);
  },
};
