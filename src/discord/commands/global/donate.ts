import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

export const template: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('donate')
      .setDescription('Shows different ways to support TripSit!'),
  async execute(interaction:ChatInputCommandInteraction) {
    const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setTitle('Donate to keep TripSit running and fund our future projects!')
        .setURL('https://tripsit.me/donate/')
        .setDescription(stripIndents`
Patreon: https://patreon.com/tripsit (Preferred!)
PayPal: teknos@tripsit.me
BTC: 1EDqf32gw73tc1WtgdT2FymfmDN4RyC9RN
Merchandise: https://tripsit.myspreadshop.com/'
        `);
    if (interaction.replied) interaction.followUp({embeds: [embed]});
    else interaction.reply({embeds: [embed]});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
