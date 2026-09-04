import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { urbanDefine } from '../../../global/commands/g.urbanDefine';
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dUrbanDefine: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('urban_define')
    .setDescription('Define a word on Urban Dictionary')
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setName('define')
      .setDescription('What do you want to define?')
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const term = interaction.options.getString('define');
    if (!term) {
      await interaction.editReply({ content: 'You must enter a search query.' });
      return false;
    }

    const result = await urbanDefine(term);

    const embed = embedTemplate()
      .setDescription(stripIndents`${result}`);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dUrbanDefine;
