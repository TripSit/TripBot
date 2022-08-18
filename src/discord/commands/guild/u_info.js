'use strict';

const path = require('path');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const { moderate } = require('../../../global/utils/moderate');

const PREFIX = path.parse(__filename).name;

let actor = {};
let target = {};
const command = 'info';

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Info')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member;
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    target = interaction.options.data[0].member;
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    await moderate(interaction, {
      actor, command, toggle: 'on', target, reason: null, duration: null,
    });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
