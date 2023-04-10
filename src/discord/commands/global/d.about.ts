import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { about } from '../../../global/commands/g.about';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dAbout: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows information about this bot!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const tripsitInfo = await about();
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle('About TripBot')
      .setURL('https://tripsit.me/about/')
      .setDescription(tripsitInfo.description)
      .addFields(
        {
          name: 'Invite',
          value: tripsitInfo.invite,
        },
        {
          name: 'Disclaimer',
          value: tripsitInfo.disclaimer,
        },
        {
          name: 'Support TripSit',
          value: tripsitInfo.support,
        },
        {
          name: 'Feedback',
          value: tripsitInfo.feedback,
        },
        {
          name: 'Credits',
          value: tripsitInfo.credits,
        },
      );
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dAbout;
