/* eslint-disable max-len */

import {
  SlashCommandBuilder,
  Colors,
  MessageFlags,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { invite } from '../../../global/commands/g.invite';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dInvite: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setNameLocalizations(getCommandLocalizations('invite', 'commandName'))
    .setDescription('Shows an invite link for this bot!')
    .setDescriptionLocalizations(getCommandLocalizations('invite', 'commandDescription'))
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en', 'invite', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('invite', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'invite');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const inviteInfo = await invite();
    const isProd = process.env.NODE_ENV === 'production';
    const devNotice = isProd
      ? ''
      : t(locale, 'invite', 'devNotice');
    const botName = isProd
      ? 'TripBot'
      : 'TripBot Dev';
    const guildName = isProd
      ? 'TripSit'
      : 'TripSit Dev';
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle(t(locale, 'invite', 'embedTitle', { botName }))
      .setURL(inviteInfo.bot)
      .setDescription(stripIndents`
        ${devNotice}

        [${t(locale, 'invite', 'inviteLink')}](${inviteInfo.bot}).

        ${t(locale, 'invite', 'advancedNote')}

        ${t(locale, 'invite', 'supportServer', { serverType: isProd ? 'official support' : 'testing', guildName, inviteUrl: inviteInfo.discord })}
      `);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dInvite;
