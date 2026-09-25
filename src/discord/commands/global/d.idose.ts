import { drug_mass_unit, drug_roa } from '@db/tripbot';
import { ChannelType, MessageFlags } from 'discord-api-types/v10';
import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
  time,
} from 'discord.js';
import { idose } from '../../../global/commands/g.idose';
import { parseDuration } from '../../../global/utils/parseDuration';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { runPager } from '../../utils/pager';

// const F = f(__filename);

/**
 * Shows iDose history one entry at a time, most recent first.
 * The Back button is disabled on the first (most recent) entry, and the
 * Next button is disabled on the last (oldest) entry.
 * @param {ChatInputCommandInteraction} interaction The deferred interaction to edit
 * @param {EmbedBuilder[]} pages One embed per dose entry, ordered most recent first
 * @return {Promise<void>}
 */
async function idoseHistoryPagination(
  interaction: ChatInputCommandInteraction,
  pages: EmbedBuilder[],
): Promise<void> {
  await runPager(interaction, {
    pageCount: pages.length,
    idPrefix: 'idose',
    renderPage: async index => ({ embeds: [pages[index]] }),
  });
}

export const dIdose: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('idose')
    .setDescription('Your personal dosage information!')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Record when you dosed something')
      .addNumberOption(option => option.setName('volume').setDescription('How much?').setRequired(true))
      .addStringOption(option => option
        .setName('units')
        .setDescription('What units?')
        .setRequired(true)
        .addChoices(
          { name: 'mg (milligrams)', value: 'MG' },
          { name: 'mL (milliliters)', value: 'ML' },
          { name: 'µg (micrograms/ug/mcg)', value: 'µG' },
          { name: 'g (grams)', value: 'G' },
          { name: 'oz (ounces)', value: 'OZ' },
          { name: 'fl oz (fluid ounces)', value: 'FLOZ' },
        ))
      .addStringOption(option => option
        .setName('substance')
        .setDescription('What Substance?')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(option => option
        .setName('roa')
        .setDescription('How did you take it?')
        .setRequired(true)
        .addChoices(
          { name: 'Oral', value: 'ORAL' },
          { name: 'Insufflated (Snorted)', value: 'INSUFFLATED' },
          { name: 'Inhaled', value: 'INHALED' },
          { name: 'Sublingual (Tongue)', value: 'SUBLINGUAL' },
          { name: 'Buccal (Gums)', value: 'BUCCAL' },
          { name: 'Rectal (Butt)', value: 'RECTAL' },
          { name: 'Intramuscular (IM)', value: 'INTRAMUSCULAR' },
          { name: 'Intravenous (IV)', value: 'INTRAVENOUS' },
          { name: 'Subcutanious (IM)', value: 'SUBCUTANIOUS' },
          { name: 'Topical (On Skin)', value: 'TOPICAL' },
          { name: 'Transdermal (Past Skin)', value: 'TRANSDERMAL' },
        ))
      .addStringOption(option => option.setName('offset').setDescription('How long ago? EG: 4 hours 32 mins ago')))
    .addSubcommand(subcommand => subcommand.setName('get').setDescription('Get your dosage records!'))
    .addSubcommand(subcommand => subcommand
      .setName('delete')
      .setDescription('Delete a dosage record!')
      .addNumberOption(option => option
        .setName('record')
        .setDescription('Which record? (0, 1, 2, etc)')
        .setRequired(true))),
  async execute(interaction) {
    const ephemeral = interaction.channel?.type !== ChannelType.DM ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const command = interaction.options.getSubcommand() as 'get' | 'set' | 'delete';
    const embed = embedTemplate();

    const recordNumber = interaction.options.getNumber('record');
    const userId = interaction.user.id;

    const substance = interaction.options.getString('substance');
    const volume = interaction.options.getNumber('volume');
    const units = interaction.options.getString('units') as drug_mass_unit | null;
    const roa = interaction.options.getString('roa') as drug_roa | null;
    const offset = interaction.options.getString('offset');

    // log.debug(`[${PREFIX}]
    // command: ${command}
    // recordNumber: ${recordNumber}
    // userId: ${userId}
    // substance: ${substance}
    // volume: ${volume}
    // units: ${JSON.stringify(units)}
    // roa: ${JSON.stringify(roa)}
    // offset: ${JSON.stringify(offset)}
    // `);
    // Make a new variable that is the current time minus the out variable
    const date = new Date();
    if (offset) {
      const out = await parseDuration(offset);
      date.setTime(date.getTime() - out);
    }

    const response = await idose(command, recordNumber, userId, substance, volume, units, roa, date);

    if (response[0] && response[0].name === 'Error') {
      await interaction.editReply({ content: response[0].value });
      return false;
    }

    if (command === 'delete') {
      await interaction.editReply({ content: response[0].value });
    }
    if (command === 'get') {
      // response comes back oldest-first; reverse it so the most recent entry is shown first
      const pages = [...response].reverse().map((record, index, entries) => embedTemplate()
        .setTitle('Your dosage history')
        .addFields({ name: record.name, value: record.value })
        .setFooter({ text: `Entry ${index + 1} of ${entries.length}` }));

      await idoseHistoryPagination(interaction, pages);
    }
    if (command === 'set') {
      if (roa === null) {
        return false;
      }

      const timeString = time(date).valueOf().toString();
      const relative = time(date, 'R');

      const routeStr = roa.charAt(0).toUpperCase() + roa.slice(1).toLowerCase();

      const embedField = {
        name: `You dosed ${volume} ${units} of ${substance} ${routeStr}`,
        value: `${relative} on ${timeString}`,
      };
      embed.setColor(Colors.DarkBlue);
      embed.setTitle('New iDose entry:');
      embed.addFields(embedField);

      if (interaction.channel?.type === ChannelType.DM) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({ embeds: [embed] });
        await interaction.user.send({ embeds: [embed] });
      }
    }
    return true;
  },
};

export default dIdose;
