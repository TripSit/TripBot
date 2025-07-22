import { stripIndents } from 'common-tags';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import testkits from '../../../global/commands/g.testkits';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';

const F = f(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName('drug_testkits')
    .setDescription('Information on how to get a test kit')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const emsInfo = await testkits();
    const embed = embedTemplate();

    embed.setTitle('Test Kit Resources and information!');

    const fieldsPerRow = 3; // Set fields per row to 3
    const totalFields = emsInfo.length;

    // Group fields into rows
    const rows = Math.ceil(totalFields / fieldsPerRow); // Total number of rows

    // Iterate over the number of rows and add fields to each row
    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const startIndex = rowIndex * fieldsPerRow;
      const endIndex = Math.min(startIndex + fieldsPerRow, totalFields); // Prevent going out of bounds
      const rowFields = emsInfo.slice(startIndex, endIndex); // Get fields for this row

      for (const [index, entry] of rowFields.entries()) {
        const website = entry.website ? `\n[Website](${entry.website})` : ''; // Move ternary outside template literal
        const description = entry.description ? `\n${entry.description}` : '';
        embed.addFields({
          inline: true, // Ensure all fields are inline
          name: `${startIndex + index + 1}. ${entry.name} (${entry.country})`,
          value: stripIndents`${website}${description}`,
        });
      }

      // Add invisible fields only if the row is not completely filled
      if (rowFields.length < fieldsPerRow) {
        const remainingSpaces = fieldsPerRow - rowFields.length;
        for (let index = 0; index < remainingSpaces; index += 1) {
          embed.addFields({
            inline: true,
            name: '\u200B', // Invisible field
            value: '\u200B',
          });
        }
      }
    }
    embed.setDescription(stripIndents`
        [How to use a reagent test kit](https://dancesafe.org/testing-kit-instructions/)
        [How to use fentanyl strips](https://dancesafe.org/fentanyl/)
        [More testkit resources on the TripSit wiki!](https://wiki.tripsit.me/wiki/Test_Kits)
        `);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
} as SlashCommand;
