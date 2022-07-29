'use strict';

const path = require('path');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const profile = require('./profile');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Profile')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    const target = interaction.options.data[0].member;
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    profile.execute(interaction, target);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
