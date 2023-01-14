/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SlashCommandBuilder,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export default dTemplate;

export const dTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Shows a member\'s profile picture in large format.')
    .addUserOption(option => option.setName('user')
      .setDescription('user')
      .setRequired(true)),
  async execute(interaction) {
    startLog(F, interaction);

    // If this doesnt happen in a guild then ignore it
    if (!interaction.guild) return false;

    const user = interaction.options.getUser('user', true);
    const member = await interaction.guild.members.fetch(user.id);

    const embed = embedTemplate()
      .setTitle(`${member.displayName}'s Profile Picture`)
      .setImage(user.displayAvatarURL());
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
