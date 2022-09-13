import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {breathe} from '../../../global/commands/g.breathe';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const discordTemplate: SlashCommand = {
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
    logger.debug(`[${PREFIX}] choice: ${choice}`);

    const data = await breathe(choice);

    logger.debug(`[${PREFIX}] data: ${data}`);

    if (interaction.replied) interaction.followUp(data);
    else interaction.reply(data);
  },
};
