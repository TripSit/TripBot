'use strict';

// TODO: Syncronous fs operations

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');
const modalSubmit = require('../utils/modal-submit');
const autocomplete = require('../utils/autocomplete');
const button = require('../utils/button');
const command = require('../utils/button');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // check if the user is a bot and if so, ignore it
    if (interaction.user.bot) { return logger.debug(`[${PREFIX}] Ignoring bot interaction`); }

    // we do a check for banned users in the "command" function

    if (interaction.isModalSubmit()) {
      modalSubmit.execute(interaction, client);
    }

    if (interaction.isAutocomplete()) {
      autocomplete.execute(interaction);
    }

    if (interaction.isButton()) {
      button.execute(interaction, client);
    }

    if (interaction.isCommand()) {
      command.execute(interaction);
    }
  },
};
