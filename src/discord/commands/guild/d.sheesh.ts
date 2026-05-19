/* eslint-disable max-len */
/* eslint-disable eqeqeq */
import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

const TRIPBOT_ID = '977945272359452713';

export const dSheesh: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('sheesh')
    .setNameLocalizations(getCommandLocalizations('sheesh', 'commandName'))
    .setDescription(t('en-US', 'sheesh', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('lightjoint')
      .setDescription(t('en-US', 'sheesh', 'lightjointSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'lightjointSubcommand'))
      .addUserOption(option => option
        .setName('user')
        .setDescription(t('en-US', 'sheesh', 'lightjointUserOption'))
        .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'lightjointUserOption'))
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('passjoint')
      .setDescription(t('en-US', 'sheesh', 'passjointSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'passjointSubcommand'))
      .addUserOption(option => option
        .setName('user')
        .setDescription(t('en-US', 'sheesh', 'passjointUserOption'))
        .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'passjointUserOption'))
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'sheesh');
    await interaction.deferReply({});

    const command = interaction.options.getSubcommand() as 'lightjoint' | 'passjoint';
    const user = interaction.member as GuildMember;
    const member = interaction.options.getMember('user') as GuildMember;

    if (command === 'lightjoint') {
      if (user == member) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'lightAlone', { name: user.displayName }) });
      } else if (member?.id === TRIPBOT_ID) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'lightWithBot', { name: user.displayName, member: member.displayName }) });
      } else if (member != null) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'lightWithUser', { name: user.displayName, member: member.displayName }) });
      } else {
        await interaction.editReply({ content: t(locale, 'sheesh', 'lightedUp', { name: user.displayName }) });
      }
    } else if (command === 'passjoint') {
      if (user === member) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'keptJoint', { name: user.displayName }) });
      } else if (member.id === TRIPBOT_ID) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'passedToBot', { name: user.displayName }) });
      } else {
        await interaction.editReply({ content: t(locale, 'sheesh', 'passedTo', { name: user.displayName, member: member?.displayName }) });
      }
    }
    return true;
  },
};

export default dSheesh;
