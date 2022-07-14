'use strict';

// TODO: Syncronous fs operations

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/logger');
const modalSubmit = require('../../global/modal-submit');
const autocomplete = require('../../global/autocomplete');
const button = require('../../global/button');
const command = require('../../global/command');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction, null, 2)}`);
    // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction)}`);
    // logger.debug(`[${PREFIX}] interaction: ${interaction}`);
    // check if the user is a bot and if so, ignore it
    // we do a check for banned users in the "command" function
    if (interaction.user.bot) { return logger.debug(`[${PREFIX}] Ignoring bot interaction`); }

    logger.debug(`[${PREFIX}] isModalSubmit(): ${interaction.isModalSubmit()}`);
    if (interaction.isModalSubmit()) {
      modalSubmit.execute(interaction, client);
      return;
    }

    logger.debug(`[${PREFIX}] isAutocomplete(): ${interaction.isAutocomplete()}`);
    if (interaction.isAutocomplete()) {
      autocomplete.execute(interaction, client);
      return;
    }

    logger.debug(`[${PREFIX}] isButton(): ${interaction.isButton()}`);
    if (interaction.isButton()) {
      button.execute(interaction, client);
      return;
    }

    logger.debug(`[${PREFIX}] isCommand(): ${interaction.isCommand()}`);
    if (interaction.isCommand() || interaction.isContextMenu()) {
      command.execute(interaction, client);
    }
  },
};
