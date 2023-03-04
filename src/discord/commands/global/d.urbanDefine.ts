import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { urbandefine } from '../../../global/commands/g.urbandefine';
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
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const term = interaction.options.getString('define');
    if (!term) {
      interaction.editReply({ content: 'You must enter a search query.' });
      return false;
    }

    const result = await urbandefine(term);

    const embed = embedTemplate()
      .setDescription(stripIndents`${result}`);
    interaction.editReply({ embeds: [embed] });
    return true;
  },
};
