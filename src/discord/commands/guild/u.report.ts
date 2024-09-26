import {
  ContextMenuCommandBuilder, GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { UserCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { modResponse } from './d.moderate';

const F = f(__filename);

export const uReport: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('TripBot Report User')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
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

export default uReport;
