import {
  ChatInputCommandInteraction,
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

const F = f(__filename);

const REMINDERS_PER_PAGE = 24;

type ReminderResponse = Awaited<ReturnType<typeof remindMe>>;

async function showReminders(
  interaction: ChatInputCommandInteraction,
  response: ReminderResponse,
): Promise<boolean> {
  const embed = embedTemplate();
  if (response === null) {
    embed.setTitle('No reminders!');
    embed.setDescription('You have no reminders! Use /remind_me to add some!');
    await interaction.editReply({ embeds: [embed] });
    return true;
  }

  embed.setTitle('Your reminders');
  if (typeof response === 'string') {
    embed.setDescription('You have no reminders! You can use /remind_me to add some!');
    await interaction.editReply({ embeds: [embed] });
    return false;
  }

  const fields: EmbedField[] = response.map(record => ({
    name: `(${record.index}) ${time(record.date, 'R')}`,
    value: record.value,
    inline: true,
  }));

  if (fields.length > REMINDERS_PER_PAGE) {
    // Add fields to a page until there are 24 fields; only the first page carries the title
    const book: EmbedBuilder[] = [];
    for (let start = 0; start < fields.length; start += REMINDERS_PER_PAGE) {
      const pageEmbed = embedTemplate();
      if (start === 0) pageEmbed.setTitle('Your reminders');
      pageEmbed.setFields(fields.slice(start, start + REMINDERS_PER_PAGE));
      book.push(pageEmbed);
    }
    paginationEmbed(interaction, book);
    return true;
  }

  // Add fields to the embed
  embed.setFields(fields);
  await interaction.editReply({ embeds: [embed] });
  return true;
}

export const dRemindme: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('remind_me')
    .setDescription('Handle reminders!')
    .setIntegrationTypes([0])
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
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const command = interaction.options.getSubcommand() as 'get' | 'set' | 'delete';
    const offset = interaction.options.getString('offset');
    const reminder = interaction.options.getString('reminder');
    const record = interaction.options.getNumber('record');

    const reminderDatetime = new Date();
    if (offset) {
      const out = await parseDuration(offset);
      reminderDatetime.setTime(reminderDatetime.getTime() + out);
    }

    const response = await remindMe(
      command,
      interaction.user.id,
      record,
      reminder,
      reminderDatetime,
    );

    if (command === 'delete') {
      await interaction.editReply({ content: response as string });
    }
    if (command === 'get') {
      return showReminders(interaction, response);
    }
    if (command === 'set') {
      const relative = time(reminderDatetime, 'R');

      await interaction.editReply({ embeds: [embedTemplate().setDescription(`${relative} I will remind you: ${reminder}`)] });
    }
    return true;
  },
};

export default dRemindme;
