/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  Colors,
  TextChannel,
  GuildMember,
  ChannelType,
  ThreadChannel,
  time,
  User,
  ButtonBuilder,
  SelectMenuBuilder,
  SelectMenuInteraction,
  Role,
  PermissionsBitField,
  CategoryChannel,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import {
  TextInputStyle,
  // ChannelType,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { experience } from '../../../global/commands/g.experience';
import { startLog } from '../../utils/startLog';

/* eslint-disable @typescript-eslint/no-unused-vars */

import { paginationEmbed } from '../../utils/pagination';

const F = f(__filename);

export default dExperience;

export const dExperience: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('experience')
    .setDescription('Get someone\'s current experience levels!')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to lookup')),
  async execute(interaction) {
    let member = interaction.options.getMember('user') as GuildMember;
    if (!member) {
      member = interaction.member as GuildMember;
    }
    const response = await experience(member.id);
    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
    const embed = embedTemplate()
      .setTitle(`${member.user.username}'s Experience`)
      .setDescription(stripIndents`${response}`);
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
