import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { testkits } from '../../../global/commands/g.testkits';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';

const PREFIX = parse(__filename).name;

export default dTestkits;

export const dTestkits: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('testkits')
    .setDescription('Information on how to get a test kit'),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const emsInfo = await testkits();
    const embed = embedTemplate();

    embed.setTitle('Test Kit Resources and information!');
    // for (const entry of emsInfo) {
    emsInfo.forEach((entry) => {
      embed.addFields(
        {
          name: `${entry.name} (${entry.country})`,
          value: `${entry.website ? `
            [Website](${entry.website})` : ''}\
            ${entry.description ? `
            ${entry.description}` : ''}
          `,
          inline: true,
        },
      );
    });
    embed.setDescription(stripIndents`
        [How to use a reagent test kit](https://dancesafe.org/testing-kit-instructions/)
        [How to use fent strips](https://dancesafe.org/you-may-be-using-fentanyl-testing-strips-incorrectly/)
        [More testkit resources on the TripSit wiki!](https://wiki.tripsit.me/wiki/Test_Kits)
        `);
    interaction.reply({ embeds: [embed], ephemeral: false });
    return true;
  },
};
