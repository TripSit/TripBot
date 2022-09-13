import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dreagents: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('reagents')
      .setDescription('Display reagent color chart!'),

  async execute(interaction) {
    interaction.reply('https://i.imgur.com/wETJsZr.png');
    logger.debug(`[${PREFIX}] finished!`);
  },
};
