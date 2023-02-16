import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  Colors,
} from 'discord.js';
import { env } from 'process';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
// import {embedTemplate} from '../../utils/embedTemplate';
import { moderate } from '../../../global/commands/g.moderate';
// import log from '../../../global/utils/log';
import { UserActionType } from '../../../global/@types/database';
import { getDiscordMember } from '../../utils/userLookup';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export default dReport;

export const dReport: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .addStringOption(option => option
      .setDescription('User to report!')
      .setRequired(true)
      .setName('target'))
    .addStringOption(option => option
      .setDescription('Reason for reporting!')
      .setRequired(true)
      .setName('reason')),

  async execute(interaction: ChatInputCommandInteraction) {
    startLog(F, interaction);
    // Only run on tripsit
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return false;
    }

    if (interaction.guild.id !== env.DISCORD_GUILD_ID) {
      await interaction.reply({ content: 'This command can only be used in the Tripsit server!', ephemeral: true });
      return false;
    }

    const targetString = interaction.options.getString('target', true);
    const reason = interaction.options.getString('reason', true);

    const targets = await getDiscordMember(interaction, targetString);

    if (targets.length > 1) {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle('Found more than one user with with that value!')
        .setDescription(stripIndents`
          "${targetString}" returned ${targets.length} results!

          Be more specific:
          > **Mention:** @Moonbear
          > **Tag:** moonbear#1234
          > **ID:** 9876581237
          > **Nickname:** MoonBear`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return false;
    }

    if (targets.length === 0) {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle('Could not find that user!')
        .setDescription(stripIndents`
          "${targetString}" returned no results!

          Try again with:
          > **Mention:** @Moonbear
          > **Tag:** moonbear#1234
          > **ID:** 9876581237
          > **Nickname:** MoonBear`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return false;
    }

    const result = await moderate(
      interaction.member as GuildMember,
      'REPORT' as UserActionType,
      targets[0],
      reason,
      null,
      null,
    );
      // log.debug(F, `Result: ${result}`);
    interaction.reply(result);
    return true;
  },
};
