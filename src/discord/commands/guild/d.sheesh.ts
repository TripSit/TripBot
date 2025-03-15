/* eslint-disable max-len */
/* eslint-disable eqeqeq */

import {
  SlashCommandBuilder,
  GuildMember,
  MessageFlags,
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
        await interaction.editReply({ content: `<:ts_wellness:1121432396647112725> ${user.displayName} decided to light up joint alone today... <:ts_wellness:1121432396647112725>` });
      } else if (member?.id === '977945272359452713') {
        await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} is blazing with ${member.displayName}! <:ts_bots:979362238253113404> 110100100 blaze it! <:ts_high:979362238349578250>` }); // eslint-disable-line max-len
      } else if (member != null) {
        await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} started sheeshin with ${member.displayName} <:ts_high:979362238349578250>` });
      } else {
        await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} lighted up a joint! <:ts_high:979362238349578250>` });
      }
    } else if (command === 'passjoint') {
      if (user === member) {
        await interaction.editReply({ content: `<:ts_memes:1121436581232902155> ${user.displayName} decided to keep joint for themselves! Shame on you! <:ts_memes:1121436581232902155>` });
      } else if (member.id === '977945272359452713') {
        await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} passed joint to TripBot! <:ts_bots:979362238253113404> Hopefully, TripBot gives it back <:ts_memes:1121436581232902155>` }); // eslint-disable-line max-len
      } else {
        await interaction.editReply({ content: `<:ts_high:979362238349578250> ${user.displayName} passed joint to ${member?.displayName} <:ts_high:979362238349578250>` }); // eslint-disable-line max-len
      }
    }

    return true;
  },
};

export default dSheesh;
