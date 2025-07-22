import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';

import { stripIndents } from 'common-tags';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import commandContext from '../../utils/context';
import { modResponse as moduleResponse } from '../../utils/modUtils';

const F = f(__filename);

export const dReport: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .setIntegrationTypes([0])
    .addStringOption((option) =>
      option.setDescription('User to report!').setRequired(true).setName('target'),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return false;
    }
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Get the guild
    const { guild } = interaction;
    const guildData = await db.discord_guilds.upsert({
      create: {
        id: guild.id,
      },
      update: {},
      where: {
        id: guild.id,
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
    const actorIsModule =
      Boolean(guildData.role_moderator) && actor.roles.cache.has(guildData.role_moderator);
    await interaction.editReply(await moduleResponse(interaction, 'REPORT', actorIsModule));
    return true;
  },
};

export default dReport;
