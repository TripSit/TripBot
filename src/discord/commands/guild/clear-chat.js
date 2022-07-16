'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-chat')
    .setDescription('This will delete the last 100 messages!'),

  async execute(interaction, channel) {
    logger.debug(`[${PREFIX}] started!`);
    logger.debug(`[${PREFIX}] channel: ${channel}`);
    await interaction.reply({ content: 'Clearing chat...', fetchReply: true })
      .then(async msg => {
        await msg.delete();
      });
    if (channel !== undefined && channel !== null) {
      const fetchedMessages = await channel.messages.fetch({ limit: 99 });
      await channel.bulkDelete(fetchedMessages);
    } else {
      const fetchedMessages = await interaction.channel.messages.fetch({ limit: 99 });
      try {
        await interaction.channel.bulkDelete(fetchedMessages);
      } catch (err) {
        logger.error(`[${PREFIX}] ${err}`);
      }
      // Delete every thread in the channel
      const fetchedThreads = await interaction.channel.threads.fetch();
      logger.debug(`[${PREFIX}] fetchedThreads: ${JSON.stringify(fetchedThreads, null, 2)}`);
      fetchedThreads.threads.forEach(async thread => {
        try {
          thread.delete();
        } catch (err) {
          logger.error(`[${PREFIX}] ${err}`);
        }
      });

      // Delete every thread in the channel
      const archivedThreads = await interaction.channel.threads.fetchArchived();
      logger.debug(`[${PREFIX}] fetchedThreads: ${JSON.stringify(archivedThreads, null, 2)}`);
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
