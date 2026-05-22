import {
  time,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { DateTime } from 'luxon';
import { stripIndents } from 'common-tags';
import { dramacounter } from '../../../global/commands/g.dramacounter';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { SlashCommand } from '../../@types/commandDef';
import { parseDuration } from '../../../global/utils/parseDuration';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dDramacounter: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dramacounter')
    .setNameLocalizations(getCommandLocalizations('dramacounter', 'commandName'))
    .setDescription(t('en-US', 'dramacounter', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription(t('en-US', 'dramacounter', 'getSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'getSubcommand'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'dramacounter', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription(t('en-US', 'dramacounter', 'setSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'setSubcommand'))
      .addStringOption(option => option
        .setName('dramatime')
        .setDescription(t('en-US', 'dramacounter', 'dramatimeOption'))
        .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'dramatimeOption'))
        .setRequired(true))
      .addStringOption(option => option
        .setName('dramaissue')
        .setDescription(t('en-US', 'dramacounter', 'dramaissueOption'))
        .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'dramaissueOption'))
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'dramacounter');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const command = interaction.options.getSubcommand() as 'get' | 'set';

    if (!interaction.guild) {
      await interaction.editReply({ content: t(locale, 'dramacounter', 'guildOnlyError') });
      return false;
    }

    let lastDramaAt = {} as Date;
    let dramaReason = '';
    if (command === 'set') {
      const dramaVal = interaction.options.getString('dramatime');
      if (!dramaVal) {
        await interaction.editReply({ content: t(locale, 'dramacounter', 'noTimeError') });
        return false;
      }
      const dramatimeValue = await parseDuration(dramaVal);
      const dramaIssue = interaction.options.getString('dramaissue');
      if (!dramaIssue) {
        await interaction.editReply({ content: t(locale, 'dramacounter', 'noReasonError') });
        return false;
      }
      dramaReason = dramaIssue;
      lastDramaAt = DateTime.now().minus(dramatimeValue).toJSDate();
    }

    const response = await dramacounter(command, interaction.guild.id, lastDramaAt, dramaReason);

    const embed = embedTemplate()
      .setTitle(t(locale, 'dramacounter', 'embedTitle'));

    if (command === 'get') {
      if (!response.lastDramaAt) {
        embed.setDescription(t(locale, 'dramacounter', 'noDramaYet'));
      } else {
        embed.setDescription(t(locale, 'dramacounter', 'lastDrama', {
          timestamp: time(new Date(response.lastDramaAt), 'R'),
          reason: response.dramaReason,
        }));
      }
    } else {
      if (!response.lastDramaAt) return false;
      embed.setDescription(stripIndents`${t(locale, 'dramacounter', 'counterReset', {
        timestamp: time(new Date(response.lastDramaAt), 'R'),
        reason: response.dramaReason,
      })}`);
    }
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dDramacounter;
