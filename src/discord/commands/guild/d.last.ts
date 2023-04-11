import {
  GuildMember,
  Role,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { last } from '../../../global/commands/g.last';
import commandContext from '../../utils/context';

// import log from '../../../global/utils/logger';

const F = f(__filename);

export const dLast: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('last')
    .setDescription('Get the users last location/messages')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to look up')
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
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
    const roleModerator = await interaction.guild.roles.fetch(env.ROLE_MODERATOR) as Role;
    const actorIsMod = actor.roles.cache.has(roleModerator.id);

    const response = await last(target);

    await interaction.editReply({ content: `${response.lastMessage}` });

    if (actorIsMod) {
      await interaction.followUp({ content: `Last ${response.messageCount} messages:\n${response.messageList}` });
    }
    return true;
  },
};

export default dLast;
