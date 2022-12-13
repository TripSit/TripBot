import {
  GuildMember,
  Role,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { last } from '../../../global/commands/g.last';

// import log from '../../../global/utils/logger';

// const F= f(__filename);

export default dLast;

export const dLast: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('last')
    .setDescription('Get the users last location/messages')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to look up')
      .setRequired(true)),
  async execute(interaction) {
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (interaction.guild) {
      if (interaction.guild.id !== env.DISCORD_GUILD_ID.toString()) {
        return false;
      }
    } else {
      return false;
    }

    interaction.deferReply();

    const target = interaction.options.getMember('user') as GuildMember;
    const actor = interaction.member as GuildMember;
    const roleModerator = interaction.guild?.roles.cache.find(role => role.id === env.ROLE_MODERATOR) as Role;
    const actorIsMod = actor.roles.cache.has(roleModerator.id);

    const response = await last(target);

    await interaction.editReply({ content: `${response.lastMessage}` });

    if (actorIsMod) {
      await interaction.followUp({
        content: `Last ${response.messageCount} messages:\n${response.messageList}`,
        ephemeral: true,
      });
    }
    return true;
  },
};
