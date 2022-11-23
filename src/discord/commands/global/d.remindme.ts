import {
  SlashCommandBuilder,
  time,
  ButtonBuilder,
  EmbedBuilder,
  EmbedField,
} from 'discord.js';
import {
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import { parse } from 'path';
import { remindme } from '../../../global/commands/g.remindme';
import { startLog } from '../../utils/startLog';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { parseDuration } from '../../../global/utils/parseDuration';
import { paginationEmbed } from '../../utils/pagination';
// import log from '../../../global/utils/log';
const PREFIX = parse(__filename).name;

const buttonList = [
  new ButtonBuilder().setCustomId('previousbtn').setLabel('Previous').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('nextbtn').setLabel('Next').setStyle(ButtonStyle.Success),
];

export default dRemindme;

export const dRemindme: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Handle reminders!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Set a reminder')
      .addStringOption(option => option.setName('reminder')
        .setDescription('What do you want to be reminded?')
        .setRequired(true))
      .addStringOption(option => option.setName('offset')
        .setDescription('When? EG: 4 hours 32 mins')
        .setRequired(true))
      .setName('set'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get your upcoming reminders!')
      .setName('get'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Delete a reminder!')
      .addNumberOption(option => option.setName('record')
        .setDescription('Which record? (0, 1, 2, etc)')
        .setRequired(true))
      .setName('delete')),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    const command = interaction.options.getSubcommand() as 'get' | 'set' | 'delete';
    const offset = interaction.options.getString('offset');
    const reminder = interaction.options.getString('reminder');
    const record = interaction.options.getNumber('record');

    const reminderDatetime = new Date();
    if (offset) {
      const out = await parseDuration(offset);
      // log.debug(`[${PREFIX}] out: ${out}`);
      reminderDatetime.setTime(reminderDatetime.getTime() + out);
    }
    // log.debug(`[${PREFIX}] reminderDatetime: ${reminderDatetime}`);

    const response = await remindme(
      command,
      interaction.user.id,
      record,
      reminder,
      reminderDatetime,
    );

    const embed = embedTemplate();
    const book = [] as EmbedBuilder[];
    if (command === 'delete') {
      await interaction.reply({ content: response as string, ephemeral: true });
    }
    if (command === 'get') {
      if (response !== null) {
        embed.setTitle('Your reminders');
        if (typeof response === 'string') {
          embed.setDescription('You have no reminders! You can use /remindme to add some!');
          interaction.reply({ embeds: [embed], ephemeral: true });
          return true;
        }

        if (response.length > 24) {
          let pageEmbed = embedTemplate();
          pageEmbed.setTitle('Your reminders');
          // Add fields to the pageEmbed until there are 24 fields
          let pageFields = [] as EmbedField[];
          let pageFieldsCount = 0;
          for (let i = 0; i < response.length; i += 1) {
            pageFields.push({
              name: `(${response[i].index}) ${time(response[i].date, 'R')}`,
              value: response[i].value,
              inline: true,
            });
            // log.debug(`[${PREFIX}] Adding field ${field.name}`);
            pageFieldsCount += 1;
            // log.debug(`[${PREFIX}] pageFieldsCount: ${pageFieldsCount}`);
            if (pageFieldsCount === 24) {
              pageEmbed.setFields(pageFields);
              // log.debug(`[${PREFIX}] pageEmbed: ${JSON.stringify(pageEmbed)}`);
              book.push(pageEmbed);
              // log.debug(`[${PREFIX}] book.length: ${book.length}`);
              pageFields = [];
              pageFieldsCount = 0;
              pageEmbed = embedTemplate();
            }
          }
          // Add the last pageEmbed
          if (pageFieldsCount > 0) {
            pageEmbed.setFields(pageFields);
            // log.debug(`[${PREFIX}] pageEmbed: ${JSON.stringify(pageEmbed)}`);
            book.push(pageEmbed);
            // log.debug(`[${PREFIX}] book.length: ${book.length}`);
          }
        }
        if (response.length <= 24) {
          // Add fields to the embed
          const fields = [] as {
            name: string;
            value: string;
            inline: boolean;
          }[];
          for (let i = 0; i < response.length; i += 1) {
            fields.push({
              name: `(${response[i].index}) ${time(response[i].date, 'R')}`,
              value: response[i].value,
              inline: true,
            });
          }
          embed.setFields(fields);
        }
      } else {
        embed.setTitle('No reminders!');
        embed.setDescription('You have no reminders! Use /remindme to add some!');
      }
      // log.debug(`[${PREFIX}] book.length: ${book.length}`);
      if (book.length > 1) {
        paginationEmbed(interaction, book, buttonList);
      } else if (!interaction.channel) {
        interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (interaction.channel.type === ChannelType.DM) {
        interaction.reply({ embeds: [embed], ephemeral: false });
        // interaction.user.send({embeds: [embed]});
      } else {
        interaction.reply({ embeds: [embed], ephemeral: true });
        // interaction.user.send({embeds: [embed]});
      }
    }
    if (command === 'set') {
      if (reminderDatetime === null) {
        interaction.reply({ content: 'Invalid date!', ephemeral: true });
        return false;
      }

      // const timeString = time(reminderDatetime).valueOf().toString();
      // log.debug(`[${PREFIX}] timeString: ${timeString}`);
      const relative = time(reminderDatetime, 'R');
      // log.debug(`[${PREFIX}] relative: ${relative}`);

      embed.setDescription(`${relative} I will remind you: ${reminder}`);
      interaction.reply({ embeds: [embed], ephemeral: true });
    }
    // log.debug(`[${PREFIX}] Finsihed!`);
    return true;
  },
};
