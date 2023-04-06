import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { urbandefine } from '../../../global/commands/archive/g.urbandefine';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dUrbandefine;

export const dUrbandefine: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('urban_define')
    .setDescription('Define a word on Urban Dictionary')
    .addStringOption(option => option
      .setName('define')
      .setDescription('What do you want to define?')
      .setRequired(true)),

  async execute(interaction) {
    startLog(F, interaction);
    const term = interaction.options.getString('define');
    if (!term) {
      await interaction.reply({ content: 'You must enter a search query.', ephemeral: true });
      return false;
    }

    const result = await urbandefine(term);

    const embed = embedTemplate()
      .setDescription(stripIndents`${result}`);
    await interaction.reply({ embeds: [embed] });
    return true;
  },
};
