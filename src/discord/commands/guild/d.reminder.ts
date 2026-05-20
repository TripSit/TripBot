/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  TextChannel,
  GuildMember,
  Colors,
  TextBasedChannel,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

const reminderDict: Record<string, [string, string]> = {
  [`${env.CHANNEL_ANNOUNCEMENTS}`]: [
    'EmbedTitle',
    'EmbedDescription',
  ],
  [`${env.CHANNEL_BOTSPAM}`]: [
    'EmbedTitle',
    'EmbedDescription',
  ],
  [`${env.CHANNEL_MODHAVEN}`]: ['modhaven_title', 'modhaven_desc'],
  [`${env.CHANNEL_TEAMTRIPSIT}`]: ['teamtripsit_title', 'teamtripsit_desc'],
  [`${env.CHANNEL_SANCTUARY}`]: ['sanctuary_title', 'sanctuary_desc'],
  [`${env.CHANNEL_WEBTRIPSIT1}`]: ['webtripsit_title', 'webtripsit_desc'],
  [`${env.CHANNEL_WEBTRIPSIT2}`]: ['webtripsit_title', 'webtripsit_desc'],
};

export const dReminder: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setNameLocalizations(getCommandLocalizations('reminder', 'commandName'))
    .setDescription(t('en-US', 'reminder', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('reminder', 'commandDescription'))
    .setIntegrationTypes([0]),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'reminder');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      await interaction.editReply({ content: t(locale, 'reminder', 'guildOnlyError') });
      return false;
    }
    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
      await interaction.editReply({ content: t(locale, 'reminder', 'channelOnlyError') });
      return false;
    }

    const chanId = (interaction.channel as TextBasedChannel).id;
    const reminderData = reminderDict[chanId];
    if (!reminderData) {
      await interaction.editReply({ content: t(locale, 'reminder', 'noReminderError') });
      return false;
    }
    const reminderTitle = t('en-US', 'reminder', reminderData[0]);
    const reminderText = t('en-US', 'reminder', reminderData[1]);

    const reminder = embedTemplate()
      .setColor(Colors.Red)
      .setTitle(t('en-US', 'reminder', 'embedTitle', { title: reminderTitle }))
      .setDescription(reminderText);

    await interaction.channel.send({ embeds: [reminder] });

    const botlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    if (botlog) {
      await botlog.send(`${(interaction.member as GuildMember).displayName} sent a reminder to ${(interaction.channel as TextChannel).name}`);
    }
    await interaction.editReply({ content: t(locale, 'reminder', 'reminderSent') });
    return true;
  },
};

export default dReminder;
