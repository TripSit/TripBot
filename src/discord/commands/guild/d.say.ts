import {
  ChannelType,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { replyGuildOnly, GUILD_ONLY_TEXT } from '../../utils/guildOnly';

const F = f(__filename);

export const dSay: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say something like a real person!')
    .setIntegrationTypes([0])
    .addStringOption(option => option.setName('say')
      .setDescription('What do you want to say?')
      .setRequired(true))
    .addChannelOption(option => option
      .setDescription('Where should I say it? (Default: \'here\')')
      .setName('channel')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      await replyGuildOnly(interaction);
      return false;
    }

    if (!interaction.member) return false;

    const member: GuildMember = interaction.member as GuildMember;

    const say = interaction.options.getString('say', true);

    const channel = interaction.options.getChannel('channel')
      ? interaction.options.getChannel('channel')
      : interaction.channel;

    if (!channel) {
      await interaction.editReply({ content: 'Channel not found!' });
      return false;
    }

    // Ensure only moderators can use /say in announcements
    if (
      channel.type === ChannelType.GuildAnnouncement
      && !member.roles.cache.has(env.ROLE_MODERATOR)
    ) {
      await interaction.editReply({ content: 'Only moderators can use this command in announcement channels!' });
      return false;
    }

    // Ensure that the channel used is a text channel
    if (
      channel.type !== ChannelType.GuildText
      && channel.type !== ChannelType.GuildVoice
      && channel.type !== ChannelType.PublicThread
      && channel.type !== ChannelType.PrivateThread
      && channel.type !== ChannelType.GuildAnnouncement
      && channel.type !== ChannelType.GuildForum
    ) {
      await interaction.editReply({ content: GUILD_ONLY_TEXT });
      return false;
    }

    // The bot may be allowed to send where the caller is not, so check the caller's own permissions in the destination.
    // A channel picked through the option can be a partial API object, so resolve the full channel first.
    const destination = 'permissionsFor' in channel
      ? channel as TextChannel
      : await interaction.guild.channels.fetch(channel.id).catch(() => null);
    const isThread = channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread;
    const callerPermissions = destination?.permissionsFor(member);
    if (
      !callerPermissions?.has(PermissionFlagsBits.ViewChannel)
      || !callerPermissions.has(isThread ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages)
    ) {
      await interaction.editReply({ content: 'You do not have permission to send messages there!' });
      return false;
    }

    // Send through the resolved channel, which (unlike a partial API channel) can actually send
    const target = destination as TextChannel;

    await target.sendTyping(); // This method automatically stops typing after 10 seconds, or when a message is sent.
    setTimeout(async () => target.send({
      content: say,
      allowedMentions: { parse: ['users'] },
    }), 3000);

    await interaction.editReply({ content: `I said '${say}' in ${target.name}` }); // eslint-disable-line max-len

    const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(`${member.displayName} made me say '${say}' \
        in ${target.name}`);
    }

    return true;
  },
};

export default dSay;
