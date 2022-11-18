/* eslint-disable max-len */

import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { invite } from '../../../global/commands/g.invite';
import { startLog } from '../../utils/startLog';

const PREFIX = parse(__filename).name;

export default dInvite;

export const dInvite: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Shows an invite link for this bot!'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    const inviteInfo = await invite();
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setTitle('Invite TripBot')
      .setURL(inviteInfo.bot)
      .setDescription(`
        [Click here to invite TripBot to your own server](${inviteInfo.bot}).
        Note: For advanced features you will need to give the bot more permissions.

        The official support server is [TripSit discord](${inviteInfo.discord}). 
        If you have issues/questions, join and talk with Moonbear!
      `);
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
