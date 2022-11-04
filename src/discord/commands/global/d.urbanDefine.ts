import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {urbandefine} from '../../../global/commands/g.urbandefine';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const durbandefine: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('urban_define')
    .setDescription('Define a word on Urban Dictionary')
    .addStringOption((option) => option
      .setName('define')
      .setDescription('What do you want to define?')
      .setRequired(true)),

  async execute(interaction) {
    const term = interaction.options.getString('define');
    if (!term) {
      interaction.reply({content: 'You must enter a search query.', ephemeral: true});
      return false;
    }

    const result = await urbandefine(term);

    const embed = embedTemplate()
      .setDescription(result);
    interaction.reply({embeds: [embed], ephemeral: false});
    return true;
  },
};
