import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {donate} from '../../../global/commands/g.donate';
import {stripIndents} from 'common-tags';
// import log from '../../../global/utils/log';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dDonate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Shows different ways to support TripSit!'),
  async execute(interaction:ChatInputCommandInteraction) {
    const donateInfo = await donate();
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle('Donate to keep TripSit running and fund our future projects!')
      .setURL('https://tripsit.me/donate/')
      .setDescription(
        stripIndents`The best way to support us is to join the discord and help out people!
        We run on volunteers and need your help to keep the org going
        If you can donate, our preferred method is Patreon, and we're happy for all donation sizes!
        You can get supporter benefits for as little as $1 a month!`);
    for (const entry of donateInfo) {
      embed.addFields(
        {
          name: entry.name,
          value: `${entry.value.length > 0 ? `[Website](${entry.value})` : entry.value}`, inline: true,
        },
      );
    }
    interaction.reply({embeds: [embed]});
    return true;
  },
};
