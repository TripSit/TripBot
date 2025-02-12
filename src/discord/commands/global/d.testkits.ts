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

    const fieldsPerRow = 3; // Set fields per row to 3
    const totalFields = emsInfo.length;

    // Group fields into rows
    const rows = Math.ceil(totalFields / fieldsPerRow); // Total number of rows

    // Iterate over the number of rows and add fields to each row
    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const startIndex = rowIndex * fieldsPerRow;
      const endIndex = Math.min(startIndex + fieldsPerRow, totalFields); // Prevent going out of bounds
      const rowFields = emsInfo.slice(startIndex, endIndex); // Get fields for this row

      rowFields.forEach((entry, index) => {
        const website = entry.website ? `\n[Website](${entry.website})` : ''; // Move ternary outside template literal
        const description = entry.description ? `\n${entry.description}` : '';
        embed.addFields(
          {
            name: `${startIndex + index + 1}. ${entry.name} (${entry.country})`,
            value: stripIndents`${website}${description}`,
            inline: true, // Ensure all fields are inline
          },
        );
      });

      // Add invisible fields only if the row is not completely filled
      if (rowFields.length < fieldsPerRow) {
        const remainingSpaces = fieldsPerRow - rowFields.length;
        for (let i = 0; i < remainingSpaces; i += 1) {
          embed.addFields({
            name: '\u200b', // Invisible field
            value: '\u200b',
            inline: true,
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
