import { SlashCommandBuilder, APIEmbedField } from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { ems } from '../../../global/commands/g.ems';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

export const emsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ems')
    .setNameLocalizations(getCommandLocalizations('ems', 'commandName'))
    .setDescription('Gets list of EMS Lines for the provided countries matching the query')
    .setDescriptionLocalizations(getCommandLocalizations('ems', 'commandDescription'))
    .addStringOption(option => option.setName('country_search')
      .setDescription(t('en', 'ems', 'countrySearchOption'))
      .setDescriptionLocalizations(getCommandLocalizations('ems', 'countrySearchOption'))
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en', 'ems', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('ems', 'ephemeralOption'))) as SlashCommandBuilder,

  async execute(interaction) {
    const locale = await getLocale(interaction, 'ems');
    const ephemeral = interaction.options.getBoolean('ephemeral') === true;
    await interaction.deferReply({ ephemeral });

    const countrySearch = interaction.options.getString('country_search') || '';
    const data = await ems(countrySearch);

    if (!data || data.length === 0) {
      await interaction.editReply(t(locale, 'ems', 'noCountriesFound'));
      return true;
    }

    // Process up to 24 entries to stay within Discord's field limits
    const fields: APIEmbedField[] = data.slice(0, 24).map(dataEntry => {
      const parts: string[] = [];

      if (dataEntry.LocalOnly) {
        parts.push(t(locale, 'ems', 'localNumbersOnly'));
      } else {
        // 1. Suicide Hotline
        if (dataEntry.Suicide) {
          parts.push(`${t(locale, 'ems', 'suicideHotline')}: \`${dataEntry.Suicide}\``);
        }

        // 2. Category Processor (Ambulance, Police, Fire, Dispatch)
        const categories = [
          {
            label: t(locale, 'ems', 'ambulance'), labelGsm: t(locale, 'ems', 'ambulanceGsm'), labelLandline: t(locale, 'ems', 'ambulanceLandline'), data: dataEntry.Ambulance,
          },
          {
            label: t(locale, 'ems', 'police'), labelGsm: t(locale, 'ems', 'policeGsm'), labelLandline: t(locale, 'ems', 'policeLandline'), data: dataEntry.Police,
          },
          {
            label: t(locale, 'ems', 'fire'), labelGsm: t(locale, 'ems', 'fireGsm'), labelLandline: t(locale, 'ems', 'fireLandline'), data: dataEntry.Fire,
          },
          {
            label: t(locale, 'ems', 'generalDispatch'), labelGsm: t(locale, 'ems', 'generalDispatchGsm'), labelLandline: t(locale, 'ems', 'generalDispatchLandline'), data: dataEntry.Dispatch,
          },
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
            parts.push(`${cat.labelGsm}: ${gsmNumbers}`);
          }

          // Add Landline specific lines
          if (cat.data?.Fixed?.[0]) {
            const landlineNumbers = cat.data.Fixed.map((num: string) => `\`${num}\``).join(', ');
            parts.push(`${cat.labelLandline}: ${landlineNumbers}`);
          }
        });

        // 3. Dispatch Alias
        if (dataEntry.Member_112) {
          parts.push(`${t(locale, 'ems', 'dispatchAlias')}: \`112\``);
        }
      }

      // Combine and sanitize
      const valueStr = parts.join('\n').substring(0, 1024) || t(locale, 'ems', 'noDataAvailable');

      return {
        name: `**${dataEntry.Country.Name.substring(0, 256)}**`,
        value: valueStr,
        inline: true,
      };
    });

    const embed = embedTemplate()
      .setFields(fields)
      .setTitle(t(locale, 'ems', 'emsNumbersTitle', { query: countrySearch }));

    if (data.length > 24) {
      embed.setFooter({ text: t(locale, 'ems', 'resultsClipped') });
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default emsCommand;
