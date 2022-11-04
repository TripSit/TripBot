import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {breathe} from '../../../global/commands/g.breathe';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dbreathe: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('breathe')
    .setDescription('Remember to breathe')
    .addStringOption((option) => option.setName('exercise')
      .setDescription('Which exercise?')
      .addChoices(
        {name: '1', value: '1'},
        {name: '2', value: '2'},
        {name: '3', value: '3'},
        {name: '4', value: '4'},
      )),
  async execute(interaction) {
    const choice = interaction.options.getString('exercise');
    const data = await breathe(choice);
    logger.debug(`[${PREFIX}] choice: ${choice} = ${data}`);
    interaction.reply(data);
    return true;
  },
};
