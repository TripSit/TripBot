'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');

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
      const fetched = await channel.messages.fetch({ limit: 99 });
      await channel.bulkDelete(fetched);
    } else {
      const fetched = await interaction.channel.messages.fetch({ limit: 99 });
      await interaction.channel.bulkDelete(fetched);
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
