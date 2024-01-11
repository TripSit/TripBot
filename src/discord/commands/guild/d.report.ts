import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { modResponse } from './d.moderate';

const F = f(__filename);

export const dReport: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .addStringOption(option => option
      .setDescription('User to report!')
      .setRequired(true)
      .setName('target')),

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

    // Get the actor
    const actor = interaction.member as GuildMember;
    // Determine if the actor is a mod
    const actorIsMod = (!!guildData.role_moderator && actor.roles.cache.has(guildData.role_moderator));
    await interaction.editReply(await modResponse(interaction, 'REPORT', actorIsMod));
    return true;
  },
};

export default dReport;
