import {
  Client,
  Interaction,
} from 'discord.js';
import {
  InteractionType,
} from 'discord-api-types/v10';
import {
  interactionEvent,
} from '../@types/eventDef';
import {commandRun} from '../utils/commandRun';
import logger from '../../global/utils/logger';
import {buttonClick} from '../utils/buttonClick';
import {selectMenu} from '../utils/selectMenu';
import {autocomplete} from '../utils/autocomplete';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const interactionCreate: interactionEvent = {
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
      if (interaction.isContextMenuCommand()) {
        commandRun(interaction, client);
        return;
      };
      if (interaction.isSelectMenu()) {
        selectMenu(interaction, client);
        return;
      };
      if (interaction.isButton()) {
        buttonClick(interaction, client);
        return;
      };
      logger.debug(`[${PREFIX}] Unknown interaction!`);
    }
  },
};
