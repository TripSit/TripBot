import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { modResponse } from '../../utils/modUtils';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dReport: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setNameLocalizations(getCommandLocalizations('report', 'commandName'))
    .setDescription(t('en-US', 'report', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('report', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setDescription(t('en-US', 'report', 'targetOption'))
      .setDescriptionLocalizations(getCommandLocalizations('report', 'targetOption'))
      .setRequired(true)
      .setName('target')) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'report');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Get the guild
    const { guild } = interaction;
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: guild.id,
      },
      create: {
        id: guild.id,
      },
      update: {
      },
    });

    if (!guildData.role_moderator || !guildData.channel_mod_log || !guildData.channel_moderators) {
      await interaction.editReply(t(locale, 'report', 'notSetupError'));
      return false;
    }

    // Get the actor
    const actor = interaction.member as GuildMember;
    // Determine if the actor is a mod
    const actorIsMod = (!!guildData.role_moderator && actor.roles.cache.has(guildData.role_moderator));
    await interaction.editReply(await modResponse(interaction, 'REPORT', actorIsMod));
    return true;
  },
};

export default dReport;
