import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { modResponse } from './d.moderate';

const F = f(__filename);

export const dReport: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setDescription('User to report!')
      .setRequired(true)
      .setName('target')) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

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
      await interaction.editReply(stripIndents`
      This server has not been set up for moderation.
      
      Please contact an administrator to set up moderation.
      
      If you are the admin, please use /cooperative to set up moderation.
      `);
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
