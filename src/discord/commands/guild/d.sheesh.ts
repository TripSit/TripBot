/* eslint-disable max-len */
/* eslint-disable eqeqeq */

import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dSheesh: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('sheesh')
    .setDescription('Let\'s sheesh!')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('lightjoint')
      .setDescription('Let\'s sheesh!')
      .addUserOption(option => option
        .setName('user')
        .setDescription('User to sheesh with')
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('passjoint')
      .setDescription('Already puffed? Pass to someone else!')
      .addUserOption(option => option
        .setName('user')
        .setDescription('User to pass joint to')
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ });

    const command = interaction.options.getSubcommand() as 'lightjoint' | 'passjoint';
    const user = interaction.member as GuildMember;
    const member = interaction.options.getMember('user') as GuildMember;
    if (command === 'lightjoint') {
      if (user == member) {
        await interaction.editReply({ content: `<:ts_meditate:1350089899113578529> ${user.displayName} decided to light up joint alone today... <:ts_meditate:1350089899113578529>` });
      } else if (member?.id === '977945272359452713') {
        await interaction.editReply({ content: `<:ts_cannabinoids:1350076845021986816> ${user.displayName} is blazing with ${member.displayName}! <:ts_bot:1350076410714128384> 110100100 blaze it! <:ts_cannabinoids:1350076845021986816>` }); // eslint-disable-line max-len
      } else if (member != null) {
        await interaction.editReply({ content: `<:ts_cannabinoids:1350076845021986816> ${user.displayName} started sheeshin with ${member.displayName} <:ts_cannabinoids:1350076845021986816>` });
      } else {
        await interaction.editReply({ content: `<:ts_cannabinoids:1350076845021986816> ${user.displayName} lighted up a joint! <:ts_cannabinoids:1350076845021986816>` });
      }
    } else if (command === 'passjoint') {
      if (user === member) {
        await interaction.editReply({ content: `<:ts_smile:1350089891798712403> ${user.displayName} decided to keep joint for themselves! Shame on you! <:ts_smile:1350089891798712403>` });
      } else if (member.id === '977945272359452713') {
        await interaction.editReply({ content: `<:ts_cannabinoids:1350076845021986816> ${user.displayName} passed joint to TripBot! <:ts_bot:1350076410714128384> Hopefully, TripBot gives it back <:ts_smile:1350089891798712403>` }); // eslint-disable-line max-len
      } else {
        await interaction.editReply({ content: `<:ts_cannabinoids:1350076845021986816> ${user.displayName} passed joint to ${member?.displayName} <:ts_cannabinoids:1350076845021986816>` }); // eslint-disable-line max-len
      }
    }

    return true;
  },
};

export default dSheesh;
