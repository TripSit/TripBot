'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-chat')
    .setDescription('This will delete the last 100 messages!'),
  // .addIntegerOption(option => option
  //   .setName('count')
  //   .setDescription('How many messages to delete? (Max: 99)')
  //   .setRequired(true))
  async execute(interaction, channel) {
    logger.debug(`[${PREFIX}] started!`);
    logger.debug(`[${PREFIX}] channel: ${channel}`);
    // const count = interaction.options.getInteger('count');
    await interaction.reply({ content: 'Clearing chat...', fetchReply: true })
      .then(async msg => {
        await msg.delete();
      });
    if (channel !== undefined && channel !== null) {
      // If a channel object was given, remove from that channel
      await channel.bulkDelete(99, true);
    } else {
      // Otherwise remove from the current channel
      try {
        // Try to remove the last 99 messages from the current channel
        // The "true" parameter says "ignore messages older than 14 days" or else you'll error
        await interaction.channel.bulkDelete(99, true);
      } catch (err) {
        logger.error(`[${PREFIX}] ${err}`);
      }

      // Manually delete the rest of the messages
      const fetchedMessages = await interaction.channel.messages.fetch({ limit: 99 });
      // eslint-disable-next-line no-restricted-syntax
      for (const message of fetchedMessages.values()) {
        try {
          message.delete();
        } catch (err) {
          // logger.error(`[${PREFIX}] ${err}`);
        }
      }

      // Delete every thread in the channel
      const fetchedThreads = await interaction.channel.threads.fetch();
      // logger.debug(`[${PREFIX}] fetchedThreads: ${JSON.stringify(fetchedThreads, null, 2)}`);
      fetchedThreads.threads.forEach(async thread => {
        try {
          thread.delete();
        } catch (err) {
          logger.error(`[${PREFIX}] ${err}`);
        }
      });

      // Delete every thread in the channel
      const archivedThreads = await interaction.channel.threads.fetchArchived();
      // logger.debug(`[${PREFIX}] fetchedThreads: ${JSON.stringify(archivedThreads, null, 2)}`);
      archivedThreads.threads.forEach(async thread => {
        try {
          thread.delete();
        } catch (err) {
          logger.error(`[${PREFIX}] ${err}`);
        }
      });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
