import {Message} from 'discord.js';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
import {thoughtPolice} from '../utils/d.thoughtPolice';
const PREFIX = require('path').parse(__filename).name;

// const { WebhookClient } = require('discord.js');
// const {stripIndents} = require('common-tags');
// const {announcements} = require('../../global/utils/announcements');
// const { karma } = require('../../global/utils/karma');
// const {experience} = require('../../global/utils/experience');
// const {modmailInitialResponse} = require('../commands/guild/modmail');
// const template = require('../utils/embed-template');

// const {getTicketInfo} = require('../../global/services/firebaseAPI');

module.exports = {
  name: 'messageCreate',
  async execute(message: Message) {
    logger.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);
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
    // if (message.channel.type === 'DM') {
    //   // Dont run if the user mentions @everyone or @here.
    //   if (message.content.includes('@everyone') || message.content.includes('@here')) {
    //     return message.author.send("You're not allowed to use those mentions.");
    //   }

    //   const [ticketData] = await getTicketInfo(message.author.id, 'user');
    //   logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

    //   if (ticketData === 'blocked') {
    //     return message.author.send('You are blocked!');
    //   }

    //   const guild = await message.client.guilds.fetch(DISCORD_GUILD_ID);
    //   const member = await guild.members.fetch(message.author.id);
    //   // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

    //   if (Object.keys(ticketData).length !== 0) {
    //     // const webhookClient = new WebhookClient({
    //     //   id: ticketInfo.issueWebhook.webhookId,
    //     //   token: ticketInfo.issueWebhook.webhookToken,
    //     // });

    //     // webhookClient.send({
    //     //   content: message,
    //     //   username: message.author.username,
    //     //   avatarURL: message.author.avatarURL(),
    //     // });

    //     if (member) {
    //       const channel = await message.client.channels.fetch(channelIrcId);
    //       const issueThread = await channel.threads.fetch(ticketData.issueThread);
    //       const embed = template.embedTemplate();
    //       embed.setDescription(stripIndents`You already have an open issue here ${issueThread.toString()}!`);
    //       message.reply({ embeds: [embed], ephemeral: true });
    //       return;
    //     }

    //     const channel = message.client.channels.cache.get(channelIrcId);
    //     const thread = await channel.threads.fetch(ticketData.issueThread);
    //     // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
    //     if (thread) {
    //       return thread.send(message);
    //     }
    //   }

    //   return modmailInitialResponse(message);
    // }

    // if (message.channel.parentId === channelIrcId) {
    //   // If this is a moderator channel, run the modmail function.
    //   logger.debug(`[${PREFIX}] IRC channel!`);

    //   const [ticketData] = await getTicketInfo(message.channel.id);
    //   logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

    //   const member = await message.client.users.fetch(ticketData.issueUser);
    //   logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

    //   member.send(`TeamTripsit: ${message}`);
    // }

    // announcements(message);
    // karma(message);
    thoughtPolice(message);
    // experience(message);
  },
};
