import type { GuildMember } from 'discord.js';

import { MessageFlags, Role, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { last } from '../../../global/commands/g.last';
import commandContext from '../../utils/context';

// import log from '../../../global/utils/logger';

const F = f(__filename);

export const dLast: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('last')
    .setDescription('Get the users last location/messages')
    .setIntegrationTypes([0])
    .addUserOption((option) =>
      option.setName('user').setDescription('User to look up').setRequired(true),
    )
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (interaction.guild) {
      if (interaction.guild.id !== env.DISCORD_GUILD_ID.toString()) {
        return false;
      }
    } else {
      return false;
    }

    const target = interaction.options.getMember('user') as GuildMember;
    const actor = interaction.member as GuildMember;
    const roleModerator = (await interaction.guild.roles.fetch(env.ROLE_MODERATOR))!;
    const actorIsModule = actor.roles.cache.has(roleModerator.id);

    const response = await last(target.user, interaction.guild);

    await interaction.editReply({ content: response.lastMessage });

    if (actorIsModule) {
      await interaction.followUp({
        content: `Last ${response.messageCount} messages:\n${response.messageList}`,
      });
    }
    return true;
  },
};

export default dLast;
