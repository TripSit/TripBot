'use strict';

const path = require('path');
const {
  SlashCommandBuilder,
  time,
  Colors,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
// const paginationEmbed = require('discordjs-button-pagination');
const paginationEmbed = require('../../utils/pagination');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../../global/services/firebaseAPI');
const parseDuration = require('../../../global/utils/parseDuration');

const PREFIX = path.parse(__filename).name;

const buttonList = [
  new ButtonBuilder().setCustomId('previousbtn').setLabel('Previous').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('nextbtn').setLabel('Next').setStyle(ButtonStyle.Success),
];

module.exports = {
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
          { name: 'mg (milligrams)', value: 'mg (milligrams)' },
          { name: 'mL (milliliters)', value: 'mL (milliliters)' },
          { name: 'µg (micrograms/ug/mcg)', value: 'µg (micrograms/ug/mcg)' },
          { name: 'g (grams)', value: 'g (grams)' },
          { name: 'oz (ounces)', value: 'oz (ounces)' },
          { name: 'fl oz (fluid ounces)', value: 'fl oz (fluid ounces)' },
          { name: 'tabs', value: 'tabs' },
          { name: 'caps', value: 'caps' },
          { name: 'pills', value: 'pills' },
          { name: 'drops', value: 'drops' },
          { name: 'sprays', value: 'sprays' },
          { name: 'inhales', value: 'inhales' },
        ))
      .addStringOption(option => option.setName('substance')
        .setDescription('What Substance?')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(option => option.setName('offset')
        .setDescription('How long ago? EG: 4 hours 32 mins ago')))
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get your dosage records!')),
  // .addSubcommand(subcommand => subcommand
  //   .setName('delete')
  //   .setDescription('Delete your dosage records!')),
  async execute(interaction, parameters) {
    logger.debug(`[${PREFIX}] Starting!`);
    let command = '';
    try {
      command = interaction.options.getSubcommand();
    } catch (err) {
      command = parameters.at(0);
    }
    const embed = template.embedTemplate();
    const book = [];
    // if (command === 'delete') {
    //   const [actorData, actorFbid] = await getUserInfo(interaction.member);
    //   if (userInfo.dosage.length === 0) {
    //     embed.setTitle('No records found!');
    //     embed.setDescription('You have no records to delete!');
    //     interaction.respond(embed);
    //     return;
    //   }
    // }
    logger.debug(`[${PREFIX}] Command: ${command}`);
    if (command === 'get') {
      // Extract actor data
      const [actorData, actorFbid] = await getUserInfo(interaction.member);
      logger.debug(actorFbid);
      // Transform actor data
      const doseData = actorData.dose_log ? actorData.dose_log : [];
      if (doseData) {
        embed.setTitle('Your dosage history');
        // Sort doseData by time
        const sortedDoseData = doseData.sort((a, b) => {
          if (a.time > b.time) return -1;
          if (a.time < b.time) return 1;
          return 0;
        });
        if (sortedDoseData.length > 24) {
          let pageEmbed = template.embedTemplate();
          pageEmbed.setTitle('Your dosage history');
          // Add fields to the pageEmbed until there are 24 fields
          let pageFields = [];
          let pageFieldsCount = 0;
          for (let i = 0; i < sortedDoseData.length; i += 1) {
            const dose = sortedDoseData[i];
            const timeVal = dose.time;
            const substance = dose.substance;
            const volume = dose.volume;
            const units = dose.units;
            const field = {
              name: `${timeVal}`,
              value: `${volume} ${units} of ${substance}`,
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
              pageEmbed = template.embedTemplate();
            }
          }
          // Add the last pageEmbed
          if (pageFieldsCount > 0) {
            pageEmbed.setFields(pageFields);
            // logger.debug(`[${PREFIX}] pageEmbed: ${JSON.stringify(pageEmbed)}`);
            book.push(pageEmbed);
            // logger.debug(`[${PREFIX}] book.length: ${book.length}`);
          }
        } else {
          Object.keys(sortedDoseData).forEach(key => {
            const timeVal = doseData[key].time;
            const substance = doseData[key].substance;
            const volume = doseData[key].volume;
            const units = doseData[key].units;
            embed.addFields({
              name: `${timeVal}`,
              value: `${volume} ${units} of ${substance}`,
              inline: true,
            });
          });
        }
      } else {
        embed.setTitle('No dose records!');
        embed.setDescription('You have no dose records, use /idose to add some!');
      }
    }
    if (command === 'set') {
      // logger.debug(`[${PREFIX}] Command: ${command}`);
      const substance = interaction.options.getString('substance') || parameters.at(1);
      const volume = interaction.options.getNumber('volume') || parameters.at(2);
      const units = interaction.options.getString('units') || parameters.at(3);
      let offset = '';
      // logger.debug(`[${PREFIX}] option: ${interaction.options.getString('offset')}`);
      // logger.debug(`[${PREFIX}] parameters: ${parameters}`);
      if (interaction.options.getString('offset')) {
        offset = interaction.options.getString('offset');
      } else if (parameters) {
        offset = parameters.at(4);
      } else {
        offset = '';
      }
      // logger.debug(`[${PREFIX}] offset: ${offset}`);
      logger.debug(`[${PREFIX}] ${volume} ${units} ${substance} ${offset}`);

      // Make a new variable that is the current time minus the out variable
      const date = new Date();
      if (offset) {
        const out = await parseDuration.execute(offset);
        // logger.debug(`[${PREFIX}] out: ${out}`);
        date.setTime(date.getTime() - out);
      }
      // logger.debug(`[${PREFIX}] date: ${date}`);

      const timeString = time(date);
      // logger.debug(`[${PREFIX}] timeString: ${timeString}`);
      const relative = time(date, 'R');
      // logger.debug(`[${PREFIX}] relative: ${relative}`);

      const doseObj = {
        volume,
        units,
        substance,
        time: timeString,
      };

      const embedField = {
        name: `You dosed ${volume} ${units} of ${substance}`,
        value: `${relative} on ${timeString}`,
      };
      embed.setColor(Colors.DarkBlue);
      embed.setTitle('New iDose entry:');
      embed.addFields(embedField);

      // Extract actor data
      const [actorData, actorFbid] = await getUserInfo(interaction.member);

      // Transform actor data
      if ('dose_log' in actorData) {
        logger.debug(`[${PREFIX}] Updating dose_log info!`);
        logger.debug(`[${PREFIX}] dose_log: ${JSON.stringify(embedField)}`);
        actorData.dose_log.push(doseObj);
      } else {
        logger.debug(`[${PREFIX}] Creating dose_log info!`);
        actorData.dose_log = [doseObj];
      }

      // Load actor data
      await setUserInfo(actorFbid, actorData);
    }

    // logger.debug(`[${PREFIX}] book.length: ${book.length}`);
    if (book.length > 1) {
      paginationEmbed(interaction, book, buttonList);
    } else if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      interaction.member.send({ embeds: [embed], ephemeral: false });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }

    logger.debug(`[${PREFIX}] Finsihed!`);
  },
};
