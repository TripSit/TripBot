import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import testkits from '../../../global/commands/g.testkits';
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';

const F = f(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName('drug_testkits')
    .setDescription('Information on how to get a test kit')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const emsInfo = await testkits();
    const embed = embedTemplate();

    embed.setTitle('Test Kit Resources and information!');
    // for (const entry of emsInfo) {
    emsInfo.forEach(entry => {
      const website = `\n[Website](${entry.website})`;
      embed.addFields(
        {
          name: `${entry.name} (${entry.country})`,
          value: stripIndents`${entry.website ? website : ''}\
            ${entry.description ? `
            ${entry.description}` : ''}
          `,
          inline: true,
        },
      );
    });
    embed.setDescription(stripIndents`
        [How to use a reagent test kit](https://dancesafe.org/testing-kit-instructions/)
        [How to use fentanyl strips](https://dancesafe.org/fentanyl/)
        [More testkit resources on the TripSit wiki!](https://wiki.tripsit.me/wiki/Test_Kits)
        `);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
} as SlashCommand;
