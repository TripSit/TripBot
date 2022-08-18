'use strict';

const path = require('path');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('New Drug Question')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    const embed = template.embedTemplate().setTitle('I would ask a question in #drug-questions on behalf of this user!');
    interaction.reply({ embeds: [embed], ephemeral: false });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
