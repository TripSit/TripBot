import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dDonate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Get information on supporting TripSit')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

    const embed = embedTemplate()
      .setTitle('Learn more about supporting TripSit')
      .setFooter({ text: 'This command is deprecated. Please use /help and scroll down to the Support TripSit page. Thank you! <3 ' }); // eslint-disable-line max-len
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dDonate;
