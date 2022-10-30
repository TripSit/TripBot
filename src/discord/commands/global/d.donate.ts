import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {donate} from '../../../global/commands/g.donate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

export const dDonate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Shows different ways to support TripSit!'),
  async execute(interaction:ChatInputCommandInteraction) {
    const donateInfo = await donate();
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle('Donate to keep TripSit running and fund our future projects!')
      .setURL(donateInfo.url)
      .setDescription(
        stripIndents`The best way to support us is to join the discord and help out people!
        We run on volunteers and need your help to keep the org going
        If you can donate, our preferred method is Patreon, and we're happy for all donation sizes!
        You can get supporter benefits for as little as $1 a month!`)
      .addFields(
        {name: 'Patreon', value: `${donateInfo.patreon}`, inline: true},
        {name: 'Discord Boosts', value: `[Join our discord](${donateInfo.discord})`, inline: true},
        {name: 'Paypal', value: `${donateInfo.paypal}`, inline: true},
        {name: 'Spreadshop', value: `${donateInfo.spreadshop}`, inline: true},
        {name: 'Spreadshirt', value: `${donateInfo.spreadshirt}`, inline: true},
        {name: '\u200B', value: '\u200B'},
        {name: 'Bitcoin', value: `${donateInfo.bitcoin}`, inline: true},
        {name: 'Monero', value: `${donateInfo.monero}`, inline: true},
        {name: 'Dogecoin', value: `${donateInfo.dogecoin}`, inline: true},
        {name: 'Litecoin', value: `${donateInfo.litecoin}`, inline: true},
        {name: 'Ethereum', value: `${donateInfo.etherium}`, inline: true},
        {name: 'Ethereum Classic', value: `${donateInfo.ethereumClassic}`, inline: true},
      );
    interaction.reply({embeds: [embed]});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
