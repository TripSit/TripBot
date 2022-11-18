import {
  SlashCommandBuilder,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { warmline } from '../../../global/commands/g.warmline';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const PREFIX = parse(__filename).name;

export default dWarmline;

export const dWarmline: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('warmline')
    .setDescription('(USA only) Need someone to talk to, but don\'t need a "hotline"?'),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const emsInfo = await warmline();
    const embed = embedTemplate()
      .setTitle('Need someone to talk to, but don\'t need a "hotline"?');

    embed.setTitle('EMS Information');
    // for (const entry of emsInfo) {
    emsInfo.forEach((entry) => {
      embed.addFields(
        {
          name: `${entry.name} ${entry.country ? `(${entry.country})` : ''}`,
          value: `${entry.website ? `
            [Website](${entry.website})` : ''}\
            ${entry.webchat ? `
            [Webchat](${entry.website})` : ''}\
            ${entry.phone ? `
            Call: ${entry.phone}` : ''}\
            ${entry.text ? `
            Text: ${entry.text}` : ''}\
          `,
          inline: true,
        },
      );
    });
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
