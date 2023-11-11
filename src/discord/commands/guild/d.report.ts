import { env } from 'process';
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
// import {embedTemplate} from '../../utils/embedTemplate';
import { moderate } from '../../../global/commands/g.moderate';
// import log from '../../../global/utils/log';
import { UserActionType } from '../../../global/@types/database';
import { getDiscordMember } from '../../utils/guildMemberLookup';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

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
      .setMaxLength(1000)
      .setRequired(true)
      .setName('reason')),

  async execute(interaction: ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setColor(Colors.Red)
          .setTitle('This command can only be used in a server!')],
      });
      return false;
    }

    // Only run on tripsit
    if (interaction.guild.id !== env.DISCORD_GUILD_ID) {
      await interaction.editReply({ content: 'This command can only be used in the Tripsit server!' });
      return false;
    }

    const targetString = interaction.options.getString('target', true);
    const reason = interaction.options.getString('reason', true);

    const targets = await getDiscordMember(interaction, targetString);

    if (!targets) {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle('Could not find that member/user!')
        .setDescription(stripIndents`
      "${targetString}" returned no results!

      Try again with:
      > **Mention:** @Moonbear
      > **Tag:** moonbear#1234
      > **ID:** 9876581237
      > **Nickname:** MoonBear`);
      await interaction.editReply({
        embeds: [embed],
      });
      return false;
    }

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
      await interaction.editReply({
        embeds: [embed],
      });
      return false;
    }

    const [target] = targets;

    const result = await moderate(
      interaction.member as GuildMember,
      'REPORT' as UserActionType,
      target.id,
      reason,
      null,
      null,
    );
      // log.debug(F, `Result: ${result}`);
    await interaction.editReply(result);
    return true;
  },
};

export default dReport;
