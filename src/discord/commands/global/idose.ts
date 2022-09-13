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

// type doseEntry = {
//   [key: string]: {
//     volume: number;
//     units: string;
//     substance: string;
//   }
// }

export const didose: SlashCommand = {
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
                  {name: 'mg (milligrams)', value: 'mg (milligrams)'},
                  {name: 'mL (milliliters)', value: 'mL (milliliters)'},
                  {name: 'µg (micrograms/ug/mcg)', value: 'µg (micrograms/ug/mcg)'},
                  {name: 'g (grams)', value: 'g (grams)'},
                  {name: 'oz (ounces)', value: 'oz (ounces)'},
                  {name: 'fl oz (fluid ounces)', value: 'fl oz (fluid ounces)'},
                  {name: 'tabs', value: 'tabs'},
                  {name: 'caps', value: 'caps'},
                  {name: 'pills', value: 'pills'},
                  {name: 'drops', value: 'drops'},
                  {name: 'sprays', value: 'sprays'},
                  {name: 'inhales', value: 'inhales'},
              ))
          .addStringOption((option) => option.setName('substance')
              .setDescription('What Substance?')
              .setRequired(true)
              .setAutocomplete(true))
          .addStringOption((option) => option.setName('offset')
              .setDescription('How long ago? EG: 4 hours 32 mins ago')))
      .addSubcommand((subcommand) => subcommand
          .setName('get')
          .setDescription('Get your dosage records!')),
  // .addSubcommand(subcommand => subcommand
  //   .setName('delete')
  //   .setDescription('Delete your dosage records!')),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] Starting!`);
    const command = interaction.options.getSubcommand();
    const embed = embedTemplate();
    const book = [] as EmbedBuilder[];
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
    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${interaction.user.id}/dose_log`);
      if (command === 'get') {
        // let doseData = {} as doseEntry[];

        await ref.once('value', (data) => {
          if (data.val() !== null) {
            // doseData = data.val();
            embed.setTitle('Your dosage history');

            const doseDates = Object.keys(data.val());
            doseDates.sort((a, b) => {
              if (a > b) return -1;
              if (a < b) return 1;
              return 0;
            });
            // logger.debug(`[${PREFIX}] Dose dates: ${JSON.stringify(doseDates)}`);

            if (doseDates.length > 24) {
              let pageEmbed = embedTemplate();
              pageEmbed.setTitle('Your dosage history');
              // Add fields to the pageEmbed until there are 24 fields
              let pageFields = [];
              let pageFieldsCount = 0;
              for (let i = 0; i < doseDates.length; i += 1) {
                const dose = data.val()[i];
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
            } else {
              doseDates.forEach((date:string) => {
                // logger.debug(`[${PREFIX}] Date: ${date}`);
                // logger.debug(`[${PREFIX}] Date: ${new Date(parseInt(date))}`);
                // logger.debug(`[${PREFIX}] Date: ${time(new Date(parseInt(date)))}`);
                // logger.debug(`[${PREFIX}] Date: ${time(new Date(parseInt(date)), 'R')}`);
                const dose = data.val()[date];
                const substance = dose.substance;
                const volume = dose.volume;
                const units = dose.units;
                embed.addFields({
                  name: `${time(new Date(parseInt(date)), 'R')}`,
                  value: `${volume} ${units} of ${substance}`,
                  inline: true,
                });
              });
            }
          } else {
            embed.setTitle('No dose records!');
            embed.setDescription('You have no dose records, use /idose to add some!');
          }
        });
      }
      if (command === 'set') {
        // logger.debug(`[${PREFIX}] Command: ${command}`);
        const substance = interaction.options.getString('substance')!;
        const volume = interaction.options.getNumber('volume')!;
        const units = interaction.options.getString('units')!;
        let offset = '';
        // logger.debug(`[${PREFIX}] option: ${interaction.options.getString('offset')}`);
        // logger.debug(`[${PREFIX}] parameters: ${parameters}`);
        if (interaction.options.getString('offset')) {
          offset = interaction.options.getString('offset')!;
        }
        // logger.debug(`[${PREFIX}] offset: ${offset}`);
        logger.debug(`[${PREFIX}] ${volume} ${units} ${substance} ${offset}`);

        // Make a new variable that is the current time minus the out variable
        const date = new Date();
        if (offset) {
          const out = await parseDuration(offset);
          // logger.debug(`[${PREFIX}] out: ${out}`);
          date.setTime(date.getTime() - out);
        }
        // logger.debug(`[${PREFIX}] date: ${date}`);

        const timeString = time(date).valueOf().toString();
        logger.debug(`[${PREFIX}] timeString: ${timeString}`);
        const relative = time(date, 'R');
        // logger.debug(`[${PREFIX}] relative: ${relative}`);

        const doseObj = {
          [date.valueOf()]: {
            volume,
            units,
            substance,
          },
        };

        const embedField = {
          name: `You dosed ${volume} ${units} of ${substance}`,
          value: `${relative} on ${timeString}`,
        };
        embed.setColor(Colors.DarkBlue);
        embed.setTitle('New iDose entry:');
        embed.addFields(embedField);

        ref.update(doseObj);
      }
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
        interaction.user.send({embeds: [embed]});
      }
    }
    logger.debug(`[${PREFIX}] Finsihed!`);
  },
};
