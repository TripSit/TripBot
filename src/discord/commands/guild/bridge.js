'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { stripIndents } = require('common-tags');
const logger = require('../../../global/utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setDescription('Information on the bridge!'),

  async execute(interaction) {
    interaction.reply(stripIndents`
    Channels with a 🔗 are 'linked' with our IRC, so messages sent in in Discord are also sent to IRC, and vis versa.
    The "bot" tag is used to identify messages from the bridge, not robots! TS is used on IRC to identify bridge messages.
    `);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
