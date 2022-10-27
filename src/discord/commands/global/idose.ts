/* eslint-disable no-unused-vars */
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
import {db} from '../../../global/utils/knex';
import {DateTime} from 'luxon';
import {
  Users,
  UserDoseHistory,
  DrugNames,
} from '../../../global/@types/pgdb.d';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {parseDuration} from '../../../global/utils/parseDuration';
import {paginationEmbed} from '../../utils/pagination';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

const buttonList = [
  new ButtonBuilder().setCustomId('previousbtn').setLabel('Previous').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('nextbtn').setLabel('Next').setStyle(ButtonStyle.Success),
];

type doseEntry = {
  [key: string]: {
    volume: number;
    units: string;
    substance: string;
  }
}

export const idose: SlashCommand = {
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
    const command = interaction.options.getSubcommand();
    const embed = embedTemplate();
    const book = [] as EmbedBuilder[];
    if (command === 'delete') {
      const recordNumber = interaction.options.getNumber('record')!;

      logger.debug(`[${PREFIX}] Deleting record ${recordNumber}`);

      const userId = (await db
        .select(db.ref('id'))
        .from<Users>('users')
        .where('discord_id', interaction.user.id))[0].id;

      const unsorteddata = await db
        .select(
          db.ref('id').as('id'),
          db.ref('user_id').as('user_id'),
          db.ref('route').as('route'),
          db.ref('dose').as('dose'),
          db.ref('units').as('units'),
          db.ref('drug_id').as('drug_id'),
          db.ref('dose_date').as('dose_date'),
        )
        .from<UserDoseHistory>('user_dose_history')
        .where('user_id', userId);

      // Sort data based on the dose_date property
      const data = unsorteddata.sort((a, b) => {
        if (a.dose_date < b.dose_date) {
          return -1;
        }
        if (a.dose_date > b.dose_date) {
          return 1;
        }
        return 0;
      });

      const record = data[recordNumber];
      const recordId = record.id;
      const doseDate = data[recordNumber].dose_date.toISOString();
      // logger.debug(`[${PREFIX}] doseDate: ${doseDate}`);
      const timeVal = DateTime.fromISO(doseDate);
      const drugId = record.drug_id;
      const drugName = (await db
        .select(db.ref('name').as('name'))
        .from<DrugNames>('drug_names')
        .where('drug_id', drugId)
        .andWhere('is_default', true))[0].name;
      const route = record.route.charAt(0).toUpperCase() + record.route.slice(1).toLowerCase();

      logger.debug(`[${PREFIX}] I deleted:
      (${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}
      ${record.dose} ${record.units} of ${drugName} ${route}
      `);

      await db
        .from<UserDoseHistory>('user_dose_history')
        .where('id', recordId)
        .del();

      await interaction.reply({content: `I deleted:
      > **(${recordNumber}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}**
      > ${record.dose} ${record.units} of ${drugName} ${route}
      `, ephemeral: true});
      return;
    }
    if (command === 'get') {
      const userId = (await db
        .select(db.ref('id'))
        .from<Users>('users')
        .where('discord_id', interaction.user.id))[0].id;

      const unsorteddata = await db
        .select(
          db.ref('id').as('id'),
          db.ref('user_id').as('user_id'),
          db.ref('route').as('route'),
          db.ref('dose').as('dose'),
          db.ref('units').as('units'),
          db.ref('drug_id').as('drug_id'),
          db.ref('dose_date').as('dose_date'),
        )
        .from<UserDoseHistory>('user_dose_history')
        .where('user_id', userId);

      // logger.debug(`[${PREFIX}] Data: ${JSON.stringify(unsorteddata, null, 2)}`);

      if (unsorteddata !== null) {
        // Sort data based on the dose_date property
        const data = unsorteddata.sort((a, b) => {
          if (a.dose_date < b.dose_date) {
            return -1;
          }
          if (a.dose_date > b.dose_date) {
            return 1;
          }
          return 0;
        });
        embed.setTitle('Your dosage history');

        if (data.length > 24) {
          let pageEmbed = embedTemplate();
          pageEmbed.setTitle('Your dosage history');
          // Add fields to the pageEmbed until there are 24 fields
          let pageFields = [];
          let pageFieldsCount = 0;
          for (let i = 0; i < data.length; i += 1) {
            const dose = data[i];
            const doseDate = data[i].dose_date.toISOString();
            // logger.debug(`[${PREFIX}] doseDate: ${doseDate}`);
            const timeVal = DateTime.fromISO(doseDate);
            const drugId = dose.drug_id;
            const drugName = (await db
              .select(db.ref('name').as('name'))
              .from<DrugNames>('drug_names')
              .where('drug_id', drugId)
              .andWhere('is_default', true))[0].name;

            // Lowercase everything but the first letter
            const route = dose.route.charAt(0).toUpperCase() + dose.route.slice(1).toLowerCase();
            const field = {
              name: `(${i}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}`,
              value: `${dose.dose} ${dose.units} of ${drugName} ${route}`,
              inline: true,
            };
            pageFields.push(field);
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
        if (data.length <= 24) {
          // Add fields to the embed
          const fields = [];
          for (let i = 0; i < data.length; i += 1) {
            const dose = data[i];
            const doseDate = data[i].dose_date.toISOString();
            // logger.debug(`[${PREFIX}] doseDate: ${doseDate}`);
            const timeVal = DateTime.fromISO(doseDate);
            const drugId = dose.drug_id;
            const drugName = (await db
              .select(db.ref('name').as('name'))
              .from<DrugNames>('drug_names')
              .where('drug_id', drugId)
              .andWhere('is_default', true))[0].name;

            // Lowercase everything but the first letter
            const route = dose.route.charAt(0).toUpperCase() + dose.route.slice(1).toLowerCase();
            const field = {
              name: `(${i}) ${timeVal.monthShort} ${timeVal.day} ${timeVal.year} ${timeVal.hour}:${timeVal.minute}`,
              value: `${dose.dose} ${dose.units} of ${drugName} ${route}`,
              inline: true,
            };
            fields.push(field);
          }
          embed.setFields(fields);
        }
        //   data.forEach((date:string) => {
        //     // logger.debug(`[${PREFIX}] Date: ${date}`);
        //     // logger.debug(`[${PREFIX}] Date: ${new Date(parseInt(date))}`);
        //     // logger.debug(`[${PREFIX}] Date: ${time(new Date(parseInt(date)))}`);
        //     // logger.debug(`[${PREFIX}] Date: ${time(new Date(parseInt(date)), 'R')}`);
        //     const dose = data[date];
        //     const substance = dose.substance;
        //     const volume = dose.volume;
        //     const units = dose.units;
        //     embed.addFields({
        //       name: `${time(new Date(parseInt(date)), 'R')}`,
        //       value: `${volume} ${units} of ${substance}`,
        //       inline: true,
        //     });
        //   });
        // }
      } else {
        embed.setTitle('No dose records!');
        embed.setDescription('You have no dose records, use /idose to add some!');
      }
    }
    if (command === 'set') {
      logger.debug(`[${PREFIX}] Command: ${command}`);
      const substance = interaction.options.getString('substance')!;
      const volume = interaction.options.getNumber('volume')!;
      const units = interaction.options.get('units')!.value;
      const roa = interaction.options.get('roa')!.value;

      let offset = '';
      if (interaction.options.getString('offset')) {
        offset = interaction.options.getString('offset')!;
      }
      logger.debug(`[${PREFIX}] offset: ${offset}`);
      logger.debug(`[${PREFIX}] ${volume} ${units} ${substance} ${roa} ${offset}`);

      // Make a new variable that is the current time minus the out variable
      const date = new Date();
      if (offset) {
        const out = await parseDuration(offset);
        logger.debug(`[${PREFIX}] out: ${out}`);
        date.setTime(date.getTime() - out);
      }
      logger.debug(`[${PREFIX}] date: ${date}`);

      const timeString = time(date).valueOf().toString();
      logger.debug(`[${PREFIX}] timeString: ${timeString}`);
      const relative = time(date, 'R');
      logger.debug(`[${PREFIX}] relative: ${relative}`);

      const embedField = {
        name: `You dosed ${volume} ${units} of ${substance}`,
        value: `${relative} on ${timeString}`,
      };
      embed.setColor(Colors.DarkBlue);
      embed.setTitle('New iDose entry:');
      embed.addFields(embedField);

      let userId = (await db
        .select(db.ref('id'))
        .from<Users>('users')
        .where('discord_id', interaction.user.id))[0].id;

      if (userId.length === 0) {
        logger.debug(`[${PREFIX}] discord_id = ${interaction.user.id} not found in 'users', creating new`);
        await db('users')
          .insert({
            discord_id: interaction.user.id,
          });
        userId = (await db
          .select(db.ref('id'))
          .from<Users>('users')
          .where('discord_id', interaction.user.id))[0].id;
      }

      logger.debug(`[${PREFIX}] userId: ${userId}`);

      const drugId = (await db
        .select(db.ref('drug_id'))
        .from<DrugNames>('drug_names')
        .where('name', substance)
        .orWhere('name', substance.toLowerCase())
        .orWhere('name', substance.toUpperCase()))[0].drug_id;

      if (drugId.length === 0) {
        logger.debug(`name = ${substance} not found in 'drugNames'`);
      }

      logger.debug(`[${PREFIX}] drugId: ${drugId}`);

      await db('user_dose_history')
        .insert({
          user_id: userId,
          dose: volume,
          route: roa,
          units: units,
          drug_id: drugId,
          dose_date: date,
        });
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
    logger.debug(`[${PREFIX}] Finsihed!`);
  },
};
