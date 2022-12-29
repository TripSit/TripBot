/* eslint-disable max-len */

import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { invite } from '../../../global/commands/g.invite';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dInvite;

export const dInvite: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Shows an invite link for this bot!'),
  async execute(interaction) {
    startLog(F, interaction);
    const inviteInfo = await invite();
    const devNotice = process.env.NODE_ENV === 'production'
      ? ''
      : '\nThis is a development version of the bot. Please use the production version for the best experience.\n\n';
    const botname = process.env.NODE_ENV === 'production'
      ? 'TripBot'
      : 'TripBot Dev';
    const guildname = process.env.NODE_ENV === 'production'
      ? 'TripSit'
      : 'TripSit Dev';
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle(`Invite ${botname}`)
      .setURL(inviteInfo.bot)
      .setDescription(stripIndents`${devNotice}
        [Click here to invite TripBot to your own server](${inviteInfo.bot}).
        Note: For advanced features you will need to give the bot more permissions.

        The official support server is [${guildname} discord](${inviteInfo.discord}). 
        If you have issues/questions, join and talk with Moonbear!
      `);
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
