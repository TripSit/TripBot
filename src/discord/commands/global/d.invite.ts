/* eslint-disable max-len */

import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { invite } from '../../../global/commands/g.invite';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dInvite: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Shows an invite link for this bot!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const inviteInfo = await invite();
    const isProd = process.env.NODE_ENV === 'production';
    const devNotice = process.env.NODE_ENV === 'production'
      ? ''
      : 'This is a development version of the bot. Please use the production version for the best experience.';
    const botName = isProd
      ? 'TripBot'
      : 'TripBot Dev';
    const guildName = isProd
      ? 'TripSit'
      : 'TripSit Dev';
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle(`Invite ${botName}`)
      .setURL(inviteInfo.bot)
      .setDescription(stripIndents`
        ${devNotice}

        [Click here to invite TripBot to your own server](${inviteInfo.bot}).

        Note: For advanced features you will need to give the bot more permissions.

        The ${isProd ? 'official support' : 'testing'} server is [${guildName} Discord](${inviteInfo.discord}).
        If you have issues/questions, join and talk with Moonbear!
      `);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dInvite;
