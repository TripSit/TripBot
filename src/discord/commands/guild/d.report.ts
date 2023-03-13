import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import { env } from 'process';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
// import {embedTemplate} from '../../utils/embedTemplate';
import { moderate } from '../../../global/commands/g.moderate';
// import log from '../../../global/utils/log';
import { UserActionType } from '../../../global/@types/database';
import { getDiscordMember } from '../../utils/guildMemberLookup';

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
    await interaction.deferReply({ ephemeral: true });
    // Only run on tripsit
    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
    }

    if (interaction.guild.id !== env.DISCORD_GUILD_ID) {
      await interaction.editReply({ content: 'This command can only be used in the Tripsit server!' });
      return false;
    }

    const targetString = interaction.options.getString('target', true);
    const reason = interaction.options.getString('reason', true);

    const target = await getDiscordMember(interaction, targetString);

    if (!target) {
      return false;
    }

    const result = await moderate(
      interaction.member as GuildMember,
      'REPORT' as UserActionType,
      target,
      reason,
      null,
      null,
    );
      // log.debug(F, `Result: ${result}`);
    interaction.editReply(result);
    return true;
  },
};
