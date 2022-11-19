import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { about } from '../../../global/commands/g.about';
import { startLog } from '../../utils/startLog';

const PREFIX = parse(__filename).name;

export default dAbout;

export const dAbout: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows information about this bot!'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
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
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
