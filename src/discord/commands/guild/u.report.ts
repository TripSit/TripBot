import type { GuildMember } from 'discord.js';

import { ApplicationCommandType, MessageFlags } from 'discord-api-types/v10';
import { ContextMenuCommandBuilder } from 'discord.js';

import type { UserCommand } from '../../@types/commandDef';

import commandContext from '../../utils/context';
import { modResponse as moduleResponse } from '../../utils/modUtils';

const F = f(__filename);

export const uReport: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('TripBot Report User')
    .setType(ApplicationCommandType.User)
    .setIntegrationTypes([0]),
  async execute(interaction) {
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

    // Get the actor
    const actor = interaction.member as GuildMember;

    if (guildData.role_moderator === null) {
      log.error(F, 'No moderator role found');
      return false;
    }

    // Determine if the actor is a mod
    const actorIsModule =
      Boolean(guildData.role_moderator) && actor.roles.cache.has(guildData.role_moderator);
    await interaction.editReply(await moduleResponse(interaction, 'REPORT', actorIsModule));
    return true;
  },
};

export default uReport;
