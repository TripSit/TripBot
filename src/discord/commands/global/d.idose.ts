import {
  SlashCommandBuilder,
  time,
  Colors,
  ButtonBuilder,
  EmbedBuilder,
  EmbedField,
} from 'discord.js';
import {
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import { idose } from '../../../global/commands/g.idose';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { parseDuration } from '../../../global/utils/parseDuration';
import { paginationEmbed } from '../../utils/pagination';
import { DrugRoa, DrugMassUnit } from '../../../global/@types/pgdb';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

const buttonList = [
  new ButtonBuilder().setCustomId('previousbtn').setLabel('Previous').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('nextbtn').setLabel('Next').setStyle(ButtonStyle.Success),
];

export default dIdose;

export const dIdose: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('idose')
    .setDescription('Your personal dosage information!')
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Record when you dosed something')
      .addNumberOption(option => option.setName('volume')
        .setDescription('How much?')
        .setRequired(true))
      .addStringOption(option => option.setName('units')
        .setDescription('What units?')
        .setRequired(true)
        .addChoices(
          { name: 'mg (milligrams)', value: 'MG' },
          { name: 'mL (milliliters)', value: 'ML' },
          { name: 'µg (micrograms/ug/mcg)', value: 'µG' },
          { name: 'g (grams)', value: 'G' },
          { name: 'oz (ounces)', value: 'OZ' },
          { name: 'fl oz (fluid ounces)', value: 'FLOZ' },
          { name: 'tabs', value: 'TABS' },
          { name: 'caps', value: 'CAPS' },
          { name: 'pills', value: 'PILLS' },
          { name: 'drops', value: 'DROPS' },
          { name: 'sprays', value: 'SPRAYS' },
          { name: 'inhales', value: 'INHALES' },
        ))
      .addStringOption(option => option.setName('substance')
        .setDescription('What Substance?')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(option => option.setName('roa')
        .setDescription('How did you take it?')
        .setRequired(true)
        .addChoices(
          { name: 'Oral', value: 'ORAL' },
          { name: 'Insufflated (Snorted)', value: 'INSUFFLATED' },
          { name: 'Inhaled', value: 'INHALED' },
          { name: 'Sublingual (Tongue)', value: 'SUBLINGUAL' },
          { name: 'Buccal (Gums)', value: 'BUCCAL' },
          { name: 'Recatal (Butt)', value: 'RECTAL' },
          { name: 'Intramuscular (IM)', value: 'INTRAMUSCULAR' },
          { name: 'Intravenous (IV)', value: 'INTRAVENOUS' },
          { name: 'Subcutanious (IM)', value: 'SUBCUTANIOUS' },
          { name: 'Topical (On Skin)', value: 'TOPICAL' },
          { name: 'Transdermal (Past Skin)', value: 'TRANSDERMAL' },
        ))
      .addStringOption(option => option.setName('offset')
        .setDescription('How long ago? EG: 4 hours 32 mins ago')))
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get your dosage records!'))
    .addSubcommand(subcommand => subcommand
      .setName('delete')
      .setDescription('Delete a dosage record!')
      .addNumberOption(option => option.setName('record')
        .setDescription('Which record? (0, 1, 2, etc)')
        .setRequired(true))),
  async execute(interaction) {
    startLog(F, interaction);
    const command = interaction.options.getSubcommand() as 'get' | 'set' | 'delete';
    const embed = embedTemplate();
    const book = [] as EmbedBuilder[];

    const recordNumber = interaction.options.getNumber('record');
    const userId = interaction.user.id;

    const substance = interaction.options.getString('substance');
    const volume = interaction.options.getNumber('volume');
    const units = interaction.options.getString('units') as DrugMassUnit | null;
    const roa = interaction.options.getString('roa') as DrugRoa | null;
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
    let date = new Date();
    if (offset) {
      const out = await parseDuration(offset);
      // log.debug(F, `out: ${out}`);
      date.setTime(date.getTime() - out);
    }

    const response = await idose(
      command,
      recordNumber,
      userId,
      substance,
      volume,
      units,
      roa,
      date,
    );

    // log.debug(F, `response: ${JSON.stringify(response, null, 2)}`);

    if (response[0] && response[0].name === 'Error') {
      await interaction.reply({ content: response[0].value, ephemeral: true });
      return false;
    }

    if (command === 'delete') {
      await interaction.reply({ content: response[0].value, ephemeral: true });
    }
    if (command === 'get') {
      if (response.length > 0) {
        // Sort data based on the dose_date property
        embed.setTitle('Your dosage history');

        if (response.length > 24) {
          let pageEmbed = embedTemplate();
          pageEmbed.setTitle('Your dosage history');
          // Add fields to the pageEmbed until there are 24 fields
          let pageFields = [] as EmbedField[];
          let pageFieldsCount = 0;
          for (let i = 0; i < response.length; i += 1) {
            pageFields.push({ name: response[i].name, value: response[i].value, inline: true });
            // log.debug(F, `Adding field ${field.name}`);
            pageFieldsCount += 1;
            // log.debug(F, `pageFieldsCount: ${pageFieldsCount}`);
            if (pageFieldsCount === 24) {
              pageEmbed.setFields(pageFields);
              // log.debug(F, `pageEmbed: ${JSON.stringify(pageEmbed)}`);
              book.push(pageEmbed);
              // log.debug(F, `book.length: ${book.length}`);
              pageFields = [];
              pageFieldsCount = 0;
              pageEmbed = embedTemplate();
            }
          }
          // Add the last pageEmbed
          if (pageFieldsCount > 0) {
            pageEmbed.setFields(pageFields);
            // log.debug(F, `pageEmbed: ${JSON.stringify(pageEmbed)}`);
            book.push(pageEmbed);
            // log.debug(F, `book.length: ${book.length}`);
          }
        }
        if (response.length <= 24) {
          // Add fields to the embed
          const fields = [] as EmbedField[];
          for (let i = 0; i < response.length; i += 1) {
            fields.push({ name: response[i].name, value: response[i].value, inline: true });
          }
          embed.setFields(fields);
        }
      } else {
        embed.setTitle('No dose records!');
        embed.setDescription('You have no dose records, use /idose to add some!');
      }
      // log.debug(F, `book.length: ${book.length}`);
      if (book.length > 1) {
        paginationEmbed(interaction, book, buttonList);
      } else if (!interaction.channel) {
        interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (interaction.channel.type === ChannelType.DM) {
        interaction.reply({ embeds: [embed] });
        // interaction.user.send({embeds: [embed]});
      } else {
        interaction.reply({ embeds: [embed], ephemeral: true });
        // interaction.user.send({embeds: [embed]});
      }
    }
    if (command === 'set') {
      if (date === null) {
        date = new Date();
      }

      if (roa === null) {
        return false;
      }

      const timeString = time(date).valueOf().toString();
      // log.debug(F, `timeString: ${timeString}`);
      const relative = time(date, 'R');
      // log.debug(F, `relative: ${relative}`);

      const routeStr = roa.charAt(0).toUpperCase() + roa.slice(1).toLowerCase();

      const embedField = {
        name: `You dosed ${volume} ${units} of ${substance} ${routeStr}`,
        value: `${relative} on ${timeString}`,
      };
      embed.setColor(Colors.DarkBlue);
      embed.setTitle('New iDose entry:');
      embed.addFields(embedField);

      if (interaction.channel?.type === ChannelType.DM) {
        interaction.reply({ embeds: [embed], ephemeral: false });
      } else {
        interaction.reply({ embeds: [embed], ephemeral: true });
        await interaction.user.send({ embeds: [embed] });
      }
    }
    return true;
  },
};
