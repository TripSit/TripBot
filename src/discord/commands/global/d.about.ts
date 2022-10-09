import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {about} from '../../../global/commands/g.about';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const template: SlashCommand1 = {
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
    logger.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
