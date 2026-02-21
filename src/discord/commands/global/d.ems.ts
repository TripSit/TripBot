import { SlashCommandBuilder, APIEmbedField } from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { ems } from '../../../global/commands/g.ems';

export const emsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ems')
    .setDescription('Gets list of EMS Lines for the provided countries matching the query')
    .addStringOption(option => option.setName('country_search')
      .setDescription('The string to search for country name')
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,

  async execute(interaction) {
    const ephemeral = interaction.options.getBoolean('ephemeral') === true;
    await interaction.deferReply({ ephemeral });

    const countrySearch = interaction.options.getString('country_search') || '';
    const data = await ems(countrySearch);

    if (!data || data.length === 0) {
      await interaction.editReply(':x: No Countries Found');
      return true;
    }

    // Process up to 24 entries to stay within Discord's field limits
    const fields: APIEmbedField[] = data.slice(0, 24).map(dataEntry => {
      const parts: string[] = [];

      if (dataEntry.LocalOnly) {
        parts.push('Local numbers only');
      } else {
        // 1. Suicide Hotline
        if (dataEntry.Suicide) {
          parts.push(`Suicide Hotline: \`${dataEntry.Suicide}\``);
        }

        // 2. Category Processor (Ambulance, Police, Fire, Dispatch)
        const categories = [
          { label: 'Ambulance', data: dataEntry.Ambulance },
          { label: 'Police', data: dataEntry.Police },
          { label: 'Fire', data: dataEntry.Fire },
          { label: 'General Dispatch', data: dataEntry.Dispatch },
        ];

        categories.forEach(cat => {
          // Add primary "All" numbers
          if (cat.data?.All?.[0]) {
            const allNumbers = cat.data.All.map((num: string) => `\`${num}\``).join(', ');
            parts.push(`${cat.label}: ${allNumbers}`);
          }

          // Add GSM specific lines
          if (cat.data?.GSM?.[0]) {
            const gsmNumbers = cat.data.GSM.map((num: string) => `\`${num}\``).join(', ');
            parts.push(`${cat.label} GSM: ${gsmNumbers}`);
          }

          // Add Landline specific lines
          if (cat.data?.Fixed?.[0]) {
            const landlineNumbers = cat.data.Fixed.map((num: string) => `\`${num}\``).join(', ');
            parts.push(`${cat.label} Landline: ${landlineNumbers}`);
          }
        });

        // 3. Dispatch Alias
        if (dataEntry.Member_112) {
          parts.push('Dispatch Alias: `112`');
        }
      }

      // Combine and sanitize
      const valueStr = parts.join('\n').substring(0, 1024) || 'No data available';

      return {
        name: `**${dataEntry.Country.Name.substring(0, 256)}**`,
        value: valueStr,
        inline: true,
      };
    });

    const embed = embedTemplate()
      .setFields(fields)
      .setTitle(`EMS Numbers for countries matching: ${countrySearch}`);

    if (data.length > 24) {
      embed.setFooter({ text: 'Results clipped (24 Max). Narrow your search! • Dose Responsibly' });
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default emsCommand;
