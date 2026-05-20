import {
  ChannelType,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dSay: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setNameLocalizations(getCommandLocalizations('say', 'commandName'))
    .setDescription(t('en-US', 'say', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('say', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option.setName('say')
      .setDescription(t('en-US', 'say', 'sayOption'))
      .setDescriptionLocalizations(getCommandLocalizations('say', 'sayOption'))
      .setRequired(true))
    .addChannelOption(option => option
      .setDescription(t('en-US', 'say', 'channelOption'))
      .setDescriptionLocalizations(getCommandLocalizations('say', 'channelOption'))
      .setName('channel')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'say');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      await interaction.editReply({ content: t(locale, 'say', 'guildOnlyError') });
      return false;
    }
    if (!interaction.member) return false;

    const member: GuildMember = interaction.member as GuildMember;
    const say = interaction.options.getString('say', true);
    let channel = interaction.options.getChannel('channel') ?? interaction.channel;

    if (!channel) {
      await interaction.editReply({ content: t(locale, 'say', 'channelNotFoundError') });
      return false;
    }

    if (
      channel.type === ChannelType.GuildAnnouncement
      && !member.roles.cache.has(env.ROLE_MODERATOR)
    ) {
      await interaction.editReply({ content: t(locale, 'say', 'announcementModOnlyError') });
      return false;
    }

    if (
      channel.type !== ChannelType.GuildText
      && channel.type !== ChannelType.GuildVoice
      && channel.type !== ChannelType.PublicThread
      && channel.type !== ChannelType.PrivateThread
      && channel.type !== ChannelType.GuildAnnouncement
      && channel.type !== ChannelType.GuildForum
    ) {
      await interaction.editReply({ content: t(locale, 'say', 'invalidChannelError') });
      return false;
    }

    channel = channel as TextChannel;
    await channel.sendTyping();
    setTimeout(async () => (channel as TextChannel).send({
      content: say,
      allowedMentions: { parse: ['users'] },
    }), 3000);

    await interaction.editReply({ content: t(locale, 'say', 'confirmedReply', { say, channel: (channel as TextChannel).name }) });

    const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(t('en-US', 'say', 'botlogMsg', { name: member.displayName, say, channel: (channel as TextChannel).name }));
    }
    return true;
  },
};

export default dSay;
