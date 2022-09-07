import {
  Client,
  Interaction,
} from 'discord.js';
import {
  InteractionType,
} from 'discord-api-types/v10';
import {commandRun} from '../utils/commandRun';
import logger from '../../global/utils/logger';
import {buttonClick} from '../utils/buttonClick';
import {modalSubmit} from '../utils/modalSubmit';
import {autocomplete} from '../utils/autocomplete';

const PREFIX = require('path').parse(__filename).name;

module.exports = {
  name: 'interactionCreate',
  async execute(interaction: Interaction, client: Client) {
    // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction, null, 2)}`);
    // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction)}`);
    // logger.debug(`[${PREFIX}] interaction: ${interaction}`);
    // logger.debug(`[${PREFIX}] typeof interaction: ${typeof interaction}`);
    // logger.debug(`[${PREFIX}] interaction.type: ${interaction.type}`);

    if (interaction.user.bot) {
      // logger.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }

    if (interaction.isChatInputCommand()) {
      // logger.debug(`[${PREFIX}] Interaction isChatInputCommand!`);
      commandRun(interaction, client);
      return;
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      // logger.debug(`[${PREFIX}] interaction.isContextMenuCommand(): ${interaction.isContextMenuCommand()}`);
      if (interaction.isContextMenuCommand()) {
        commandRun(interaction, client);
        return;
      }
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      autocomplete(interaction, client);
      return;
    }

    if (interaction.type === InteractionType.MessageComponent) {
      if (interaction.isButton()) {
        buttonClick(interaction, client);
        return;
      }
      if (interaction.isContextMenuCommand()) {
        commandRun(interaction, client);
        return;
      }
      logger.debug(`[${PREFIX}] Unknown interaction: ${JSON.stringify(interaction, null, 2)}`);
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      modalSubmit(interaction);
    }
  },
};
