'use strict';

const path = require('path');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Info')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const embed = template.embedTemplate().setTitle('I would show the mod info of this user!');
    interaction.reply({ embeds: [embed], ephemeral: false });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
