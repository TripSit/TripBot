import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {ems} from '../../../global/commands/g.ems';
// import log from '../../../global/utils/log';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dEms: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ems')
    .setDescription('Information that may be helpful in a serious situation.'),
  async execute(interaction) {
    const emsInfo = await ems();
    const embed = embedTemplate();

    embed.setTitle('EMS Information');
    for (const entry of emsInfo) {
      embed.addFields(
        {
          name: `${entry.name} ${entry.country ? `(${entry.country})` : ``}`,
          value: `${entry.website ? `
            [Website](${entry.website})` : ``}\
            ${entry.webchat ? `
            [Webchat](${entry.website})` : ``}\
            ${entry.phone ? `
            Call: ${entry.phone}` : ``}\
            ${entry.text ? `
            Text: ${entry.text}` : ``}\
          `, inline: true,
        },
      );
    }
    interaction.reply({embeds: [embed]});
    return true;
  },
};
