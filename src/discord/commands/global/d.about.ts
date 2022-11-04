import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {about} from '../../../global/commands/g.about';
import log from '../../../global/utils/log';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dAbout: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows information about this bot!'),
  async execute(interaction:ChatInputCommandInteraction) {
    const tripsitInfo = await about();
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle('About TripSit')
      .setURL('https://tripsit.me/about/')
      .setDescription(tripsitInfo.description)
      .addFields(
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
    interaction.reply({embeds: [embed]});
    log.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
