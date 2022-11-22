import {
  SlashCommandBuilder,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { ems } from '../../../global/commands/g.ems';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const PREFIX = parse(__filename).name;

export default dEms;

export const dEms: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ems')
    .setDescription('Information that may be helpful in a serious situation.'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    const emsInfo = await ems();
    const embed = embedTemplate();

    embed.setTitle('EMS Information');
    // for (const entry of emsInfo) {
    emsInfo.forEach(entry => {
      embed.addFields(
        {
          name: `${entry.name} ${entry.country ? `(${entry.country})` : ''}`,
          value: stripIndents`${entry.website ? `
            [Website](${entry.website})` : ''}\
            ${entry.webchat ? `
            [Webchat](${entry.website})` : ''}\
            ${entry.phone ? `
            Call: ${entry.phone}` : ''}\
            ${entry.text ? `
            Text: ${entry.text}` : ''}`,
          inline: true,
        },
      );
    });
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
