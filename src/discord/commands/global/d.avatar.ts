import {
  SlashCommandBuilder,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export default dAvatar;

export const dAvatar: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Shows a member\'s profile picture in large format.')
    .addUserOption(option => option.setName('user')
      .setDescription('user')
      .setRequired(true)),
  async execute(interaction) {
    startLog(F, interaction);
    // log.debug(F, `${JSON.stringify(interaction.options, null, 2)}`);
    // If this doesnt happen in a guild then ignore it
    if (!interaction.guild) {
      interaction.reply({ content: 'This command can only be used in a discord guild!', ephemeral: true });
      return false;
    }

    const user = interaction.options.getUser('user', true);

    // log.debug(F, `user: ${JSON.stringify(user, null, 2)}`);
    // log.debug(F, `user.id: ${user.id}`);

    const member = await interaction.guild.members.fetch(user.id);

    // log.debug(F, `member: ${JSON.stringify(member, null, 2)}`);

    const embed = embedTemplate()
      .setTitle(`${member.displayName}'s Profile Picture`)
      .setImage(`${member.displayAvatarURL()}?size=4096`);
    await interaction.reply({ embeds: [embed] });
    return true;
  },
};
