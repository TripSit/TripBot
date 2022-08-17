'use strict';

// TODO: Syncronous fs operations

const PREFIX = require('path').parse(__filename).name;
const { InteractionType } = require('discord.js');
const logger = require('../../global/utils/logger');
const modalSubmit = require('../utils/modal-submit');
const autocomplete = require('../../global/utils/autocomplete');
const button = require('../utils/button');
const command = require('../utils/command');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction, null, 2)}`);
    // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction)}`);
    // logger.debug(`[${PREFIX}] interaction: ${interaction}`);
    // check if the user is a bot and if so, ignore it
    // we do a check for banned users in the "command" function
    // logger.debug(`[${PREFIX}] interaction.type: ${interaction.type}`);

    if (interaction.user.bot) { return logger.debug(`[${PREFIX}] Ignoring bot interaction`); }

    // logger.debug(`[${PREFIX}] InteractionType.ApplicationCommand:
    // ${InteractionType.ApplicationCommand}`);
    if (interaction.type === InteractionType.ApplicationCommand) {
      command.execute(interaction, client);
      return;
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      autocomplete.execute(interaction, client);
      return;
    }

    if (interaction.type === InteractionType.MessageComponent) {
      if (interaction.isButton()) {
        button.execute(interaction, client);
        return;
      }
      if (interaction.isContextMenu()) {
        command.execute(interaction, client);
        return;
      }
      logger.debug(`[${PREFIX}] Unknown interaction: ${JSON.stringify(interaction, null, 2)}`);
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      modalSubmit.execute(interaction, client);
    }
  },
};
