import {
  ContextMenuCommandBuilder,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { MessageCommand } from '../../@types/commandDef';
import { quoteAdd } from './d.quote';

export const mQuote: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Save Quote')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    await quoteAdd(interaction);
    return true;
  },
};

export default mQuote;
