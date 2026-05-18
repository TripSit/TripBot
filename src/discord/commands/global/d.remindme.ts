import {
  SlashCommandBuilder,
  time,
  EmbedBuilder,
  EmbedField,
  MessageFlags,
} from 'discord.js';
import { remindMe } from '../../../global/commands/g.remindme';
import commandContext from '../../utils/context';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { parseDuration } from '../../../global/utils/parseDuration';
import { paginationEmbed } from '../../utils/pagination';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dRemindme: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('remind_me')
    .setNameLocalizations(getCommandLocalizations('remindme', 'commandName'))
    .setDescription(t('en', 'remindme', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('remindme', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setNameLocalizations(getCommandLocalizations('remindme', 'setSubcommandName'))
      .setDescription(t('en', 'remindme', 'setSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('remindme', 'setSubcommandDescription'))
      .addStringOption(option => option.setName('reminder')
        .setDescription(t('en', 'remindme', 'setReminderOption'))
        .setDescriptionLocalizations(getCommandLocalizations('remindme', 'setReminderOption'))
        .setRequired(true))
      .addStringOption(option => option.setName('offset')
        .setDescription(t('en', 'remindme', 'setOffsetOption'))
        .setDescriptionLocalizations(getCommandLocalizations('remindme', 'setOffsetOption'))
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setNameLocalizations(getCommandLocalizations('remindme', 'getSubcommandName'))
      .setDescription(t('en', 'remindme', 'getSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('remindme', 'getSubcommandDescription')))
    .addSubcommand(subcommand => subcommand
      .setName('delete')
      .setNameLocalizations(getCommandLocalizations('remindme', 'deleteSubcommandName'))
      .setDescription(t('en', 'remindme', 'deleteSubcommandDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('remindme', 'deleteSubcommandDescription'))
      .addNumberOption(option => option.setName('record')
        .setDescription(t('en', 'remindme', 'deleteRecordOption'))
        .setDescriptionLocalizations(getCommandLocalizations('remindme', 'deleteRecordOption'))
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const locale = await getLocale(interaction, 'remindme');
    const command = interaction.options.getSubcommand() as 'get' | 'set' | 'delete';
    const offset = interaction.options.getString('offset');
    const reminder = interaction.options.getString('reminder');
    const record = interaction.options.getNumber('record');

    const reminderDatetime = new Date();
    if (offset) {
      const out = await parseDuration(offset);
      // log.debug(F, `out: ${out}`);
      reminderDatetime.setTime(reminderDatetime.getTime() + out);
    }
    // log.debug(F, `reminderDatetime: ${reminderDatetime}`);

    const response = await remindMe(
      command,
      interaction.user.id,
      record,
      reminder,
      reminderDatetime,
    );

    const embed = embedTemplate();
    const book = [] as EmbedBuilder[];
    if (command === 'delete') {
      await interaction.editReply({ content: response as string });
    }
    if (command === 'get') {
      if (response !== null) {
        embed.setTitle(t(locale, 'remindme', 'yourReminders'));
        if (typeof response === 'string') {
          embed.setDescription(t(locale, 'remindme', 'noReminders'));
          await interaction.editReply({ embeds: [embed] });
          return false;
        }

        if (response.length > 24) {
          let pageEmbed = embedTemplate();
          pageEmbed.setTitle(t(locale, 'remindme', 'yourReminders'));
          // Add fields to the pageEmbed until there are 24 fields
          let pageFields = [] as EmbedField[];
          let pageFieldsCount = 0;
          for (const record of response) { // eslint-disable-line
            pageFields.push({
              name: `(${record.index}) ${time(record.date, 'R')}`,
              value: record.value,
              inline: true,
            });
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
          const fields = [] as {
            name: string;
            value: string;
            inline: boolean;
          }[];
          for (const record of response) { // eslint-disable-line
            fields.push({
              name: `(${record.index}) ${time(record.date, 'R')}`,
              value: record.value,
              inline: true,
            });
          }
          embed.setFields(fields);
        }
      } else {
        embed.setTitle(t(locale, 'remindme', 'noRemindersTitle'));
        embed.setDescription(t(locale, 'remindme', 'noRemindersMessage'));
      }
      // log.debug(F, `book.length: ${book.length}`);
      if (book.length > 1) {
        paginationEmbed(interaction, book);
      } else {
        await interaction.editReply({ embeds: [embed] });
        // interaction.user.send({embeds: [embed]});
      }
    }
    if (command === 'set') {
      // const timeString = time(reminderDatetime).valueOf().toString();
      // log.debug(F, `timeString: ${timeString}`);
      const relative = time(reminderDatetime, 'R');
      // log.debug(F, `relative: ${relative}`);

      embed.setDescription(t(locale, 'remindme', 'reminderSet', { relative, reminder }));
      await interaction.editReply({ embeds: [embed] });
    }
    // log.debug(F, `Finished!`);
    return true;
  },
};

export default dRemindme;
