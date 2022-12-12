import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { donate } from '../../../global/commands/g.donate';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';

const F = f(__filename);

export default dDonate;

export const dDonate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Shows different ways to support TripSit!'),
  async execute(interaction:ChatInputCommandInteraction) {
    startLog(F, interaction);
    const donateInfo = await donate();
    const embed = embedTemplate()
      .setColor(Colors.Purple)
      .setTitle('Donate to keep TripSit running and fund our future projects!')
      .setURL('https://tripsit.me/donate/')
      .setDescription(
        stripIndents`The best way to support us is to join the discord and help out people!
        We run on volunteers and need your help to keep the org going
        If you can donate, our preferred method is Patreon, and we're happy for all donation sizes!
        You can get supporter benefits for as little as $1 a month!`,
      );
    // for (const entry of donateInfo) {
    donateInfo.forEach(entry => {
      if (entry.value.length > 0) {
        const hyperlink = `[Website](${entry.value})`;
        embed.addFields(
          {
            name: entry.name,
            value: `${entry.value !== '\u200B' ? hyperlink : entry.value}`,
            inline: true,
          },
        );
      }
    });
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
