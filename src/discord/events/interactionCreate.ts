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
import log from '../../global/utils/log';
import {buttonClick} from '../utils/buttonClick';
import {selectMenu} from '../utils/selectMenu';
import {autocomplete} from '../utils/autocomplete';

import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const interactionCreate: interactionEvent = {
  name: 'interactionCreate',
  async execute(interaction: Interaction, client: Client) {
    // log.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction, null, 2)}`);
    // log.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction)}`);
    // log.debug(`[${PREFIX}] interaction: ${interaction}`);
    // log.debug(`[${PREFIX}] typeof interaction: ${typeof interaction}`);
    // log.debug(`[${PREFIX}] interaction.type: ${interaction.type}`);

    if (interaction.user.bot) {
      // log.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }

    if (interaction.isChatInputCommand()) {
      // log.debug(`[${PREFIX}] Interaction isChatInputCommand!`);
      commandRun(interaction, client);
      return;
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      // log.debug(`[${PREFIX}] interaction.isContextMenuCommand(): ${interaction.isContextMenuCommand()}`);
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
      log.debug(`[${PREFIX}] Unknown interaction!`);
    }
  },
};
