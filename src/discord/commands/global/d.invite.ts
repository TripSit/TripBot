import { stripIndents } from 'common-tags';
import { Colors, MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { invite } from '../../../global/commands/g.invite';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dInvite: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Shows an invite link for this bot!')
    .setIntegrationTypes([0])
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const inviteInfo = await invite();
    const isProduction = process.env.NODE_ENV === 'production';
    const developmentNotice =
      process.env.NODE_ENV === 'production'
        ? ''
        : 'This is a development version of the bot. Please use the production version for the best experience.';
    const botName = isProduction ? 'TripBot' : 'TripBot Dev';
    const guildName = isProduction ? 'TripSit' : 'TripSit Dev';
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle(`Invite ${botName}`)
      .setURL(inviteInfo.bot).setDescription(stripIndents`
        ${developmentNotice}

        [Click here to invite TripBot to your own server](${inviteInfo.bot}).

        Note: For advanced features you will need to give the bot more permissions.

        The ${isProduction ? 'official support' : 'testing'} server is [${guildName} Discord](${inviteInfo.discord}).
        If you have issues/questions, join and talk with Moonbear!
      `);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dInvite;
