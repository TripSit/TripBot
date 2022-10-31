import {
  SlashCommandBuilder,
  time,
  Colors,
  ButtonBuilder,
  EmbedBuilder,
} from 'discord.js';
import {
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import {idose} from '../../../global/commands/g.idose';
import {SlashCommand1} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {parseDuration} from '../../../global/utils/parseDuration';
import {paginationEmbed} from '../../utils/pagination';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

const buttonList = [
  new ButtonBuilder().setCustomId('previousbtn').setLabel('Previous').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('nextbtn').setLabel('Next').setStyle(ButtonStyle.Success),
];

export const didose: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('idose')
    .setDescription('Your personal dosage information!')
    .addSubcommand((subcommand) => subcommand
      .setName('set')
      .setDescription('Record when you dosed something')
      .addNumberOption((option) => option.setName('volume')
        .setDescription('How much?')
        .setRequired(true))
      .addStringOption((option) => option.setName('units')
        .setDescription('What units?')
        .setRequired(true)
        .addChoices(
          {name: 'mg (milligrams)', value: 'MG'},
          {name: 'mL (milliliters)', value: 'ML'},
          {name: 'µg (micrograms/ug/mcg)', value: 'µG'},
          {name: 'g (grams)', value: 'G'},
          {name: 'oz (ounces)', value: 'OZ'},
          {name: 'fl oz (fluid ounces)', value: 'FLOZ'},
          {name: 'tabs', value: 'TABS'},
          {name: 'caps', value: 'CAPS'},
          {name: 'pills', value: 'PILLS'},
          {name: 'drops', value: 'DROPS'},
          {name: 'sprays', value: 'SPRAYS'},
          {name: 'inhales', value: 'INHALES'},
        ))
      .addStringOption((option) => option.setName('substance')
        .setDescription('What Substance?')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption((option) => option.setName('roa')
        .setDescription('How did you take it?')
        .setRequired(true)
        .addChoices(
          {name: 'Oral', value: 'ORAL'},
          {name: 'Insufflated (Snorted)', value: 'INSUFFLATED'},
          {name: 'Inhaled', value: 'INHALED'},
          {name: 'Sublingual (Tongue)', value: 'SUBLINGUAL'},
          {name: 'Buccal (Gums)', value: 'BUCCAL'},
          {name: 'Recatal (Butt)', value: 'RECTAL'},
          {name: 'Intramuscular (IM)', value: 'INTRAMUSCULAR'},
          {name: 'Intravenous (IV)', value: 'INTRAVENOUS'},
          {name: 'Subcutanious (IM)', value: 'SUBCUTANIOUS'},
          {name: 'Topical (On Skin)', value: 'TOPICAL'},
          {name: 'Transdermal (Past Skin)', value: 'TRANSDERMAL'},
        ))
      .addStringOption((option) => option.setName('offset')
        .setDescription('How long ago? EG: 4 hours 32 mins ago')))
    .addSubcommand((subcommand) => subcommand
      .setName('get')
      .setDescription('Get your dosage records!'))
    .addSubcommand((subcommand) => subcommand
      .setName('delete')
      .setDescription('Delete a dosage record!')
      .addNumberOption((option) => option.setName('record')
        .setDescription('Which record? (0, 1, 2, etc)')
        .setRequired(true))),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] Starting!`);
    const command = interaction.options.getSubcommand() as 'get' | 'set' | 'delete';
    const embed = embedTemplate();
    const book = [] as EmbedBuilder[];

    const recordNumber = interaction.options.getNumber('record');
    const userId = interaction.user.id;

    const substance = interaction.options.getString('substance');
    const volume = interaction.options.getNumber('volume');
    const unitsOption = interaction.options.get('units');
    const units = unitsOption ? unitsOption.value as string : null;
    const roaOption = interaction.options.get('roa');
    const roa = roaOption ? roaOption.value as string : null;
    const offsetOption = interaction.options.get('offset');
    const offset = offsetOption ? offsetOption.value as string : null;
    // Make a new variable that is the current time minus the out variable
    const date = offset ? new Date() : null;
    if (date && offset) {
      const out = await parseDuration(offset);
      logger.debug(`[${PREFIX}] out: ${out}`);
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

    logger.debug(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);

    if (command === 'delete') {
      await interaction.reply({content: response, ephemeral: true});
    }
    if (command === 'get') {
      if (response !== null) {
        if (response === false) {
          embed.setTitle('Your dosage history');
          embed.setDescription('You have no dose records, you can use /idose to add some!');
          interaction.reply({embeds: [embed], ephemeral: true});
          return true;
        }
        // Sort data based on the dose_date property
        embed.setTitle('Your dosage history');

        if (response.length > 24) {
          let pageEmbed = embedTemplate();
          pageEmbed.setTitle('Your dosage history');
          // Add fields to the pageEmbed until there are 24 fields
          let pageFields = [];
          let pageFieldsCount = 0;
          for (let i = 0; i < response.length; i += 1) {
            pageFields.push(response[i]);
            // logger.debug(`[${PREFIX}] Adding field ${field.name}`);
            pageFieldsCount += 1;
            // logger.debug(`[${PREFIX}] pageFieldsCount: ${pageFieldsCount}`);
            if (pageFieldsCount === 24) {
              pageEmbed.setFields(pageFields);
              // logger.debug(`[${PREFIX}] pageEmbed: ${JSON.stringify(pageEmbed)}`);
              book.push(pageEmbed);
              // logger.debug(`[${PREFIX}] book.length: ${book.length}`);
              pageFields = [];
              pageFieldsCount = 0;
              pageEmbed = embedTemplate();
            }
          }
          // Add the last pageEmbed
          if (pageFieldsCount > 0) {
            pageEmbed.setFields(pageFields);
            // logger.debug(`[${PREFIX}] pageEmbed: ${JSON.stringify(pageEmbed)}`);
            book.push(pageEmbed);
            // logger.debug(`[${PREFIX}] book.length: ${book.length}`);
          }
        }
        if (response.length <= 24) {
          // Add fields to the embed
          const fields = [];
          for (let i = 0; i < response.length; i += 1) {
            fields.push(response[i]);
          }
          embed.setFields(fields);
        }
      } else {
        embed.setTitle('No dose records!');
        embed.setDescription('You have no dose records, use /idose to add some!');
      }
      // logger.debug(`[${PREFIX}] book.length: ${book.length}`);
      if (book.length > 1) {
        paginationEmbed(interaction, book, buttonList);
      } else {
        if (interaction.channel!.type === ChannelType.DM) {
          interaction.reply({embeds: [embed], ephemeral: false});
        // interaction.user.send({embeds: [embed]});
        } else {
          interaction.reply({embeds: [embed], ephemeral: true});
        // interaction.user.send({embeds: [embed]});
        }
      }
    }
    if (command === 'set') {
      if (date === null) {
        interaction.reply({content: 'Invalid date!', ephemeral: true});
        return false;
      }

      const timeString = time(date).valueOf().toString();
      logger.debug(`[${PREFIX}] timeString: ${timeString}`);
      const relative = time(date, 'R');
      logger.debug(`[${PREFIX}] relative: ${relative}`);

      const embedField = {
        name: `You dosed ${volume} ${units} of ${substance} ${roa}`,
        value: `${relative} on ${timeString}`,
      };
      embed.setColor(Colors.DarkBlue);
      embed.setTitle('New iDose entry:');
      embed.addFields(embedField);
      interaction.reply({embeds: [embed], ephemeral: true});
    }
    logger.debug(`[${PREFIX}] Finsihed!`);
    return true;
  },
};
