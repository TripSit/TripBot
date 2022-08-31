import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('reagents')
      .setDescription('Display reagent color chart!'),

  async execute(interaction) {
    interaction.reply('https://i.imgur.com/wETJsZr.png');
    logger.debug(`[${PREFIX}] finished!`);
  },
};
