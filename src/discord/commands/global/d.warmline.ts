import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { warmline } from '../../../global/commands/g.warmline';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dWarmline;

export const dWarmline: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('warmline')
    .setDescription('(USA only) Need someone to talk to, but don\'t need a "hotline"?'),

  async execute(interaction) {
    startLog(F, interaction);
    const emsInfo = await warmline();
    const embed = embedTemplate()
      .setTitle('Need someone to talk to, but don\'t need a "hotline"?');

    embed.setTitle('Warmline Information');
    // for (const entry of emsInfo) {
    emsInfo.forEach(entry => {
      const country = `(${entry.country})`;
      const website = `\n[Website](${entry.website})`;
      const webchat = `\n[Webchat](${entry.website})`;
      const phone = `\nCall: ${entry.phone}`;
      const text = `\nText: ${entry.text}`;
      embed.addFields(
        {
          name: `${entry.name} ${entry.country ? country : ''}`,
          value: stripIndents`${entry.website ? website : ''}\
            ${entry.webchat ? webchat : ''}\
            ${entry.phone ? phone : ''}\
            ${entry.text ? text : ''}`,
          inline: true,
        },
      );
    });
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
