import type { GuildMember, TextChannel } from 'discord.js';

import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import commandContext from '../../utils/context';

const F = f(__filename);

export const dSay: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say something like a real person!')
    .setIntegrationTypes([0])
    .addStringOption((option) =>
      option.setName('say').setDescription('What do you want to say?').setRequired(true),
    )
    .addChannelOption((option) =>
      option.setDescription("Where should I say it? (Default: 'here')").setName('channel'),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
    }

    if (!interaction.member) {
      return false;
    }

    const member: GuildMember = interaction.member as GuildMember;

    const say = interaction.options.getString('say', true);

    let channel = interaction.options.getChannel('channel')
      ? interaction.options.getChannel('channel')
      : interaction.channel;

    if (!channel) {
      await interaction.editReply({ content: 'Channel not found!' });
      return false;
    }

    // Ensure only moderators can use /say in announcements
    if (
      channel.type === ChannelType.GuildAnnouncement &&
      !member.roles.cache.has(env.ROLE_MODERATOR)
    ) {
      await interaction.editReply({
        content: 'Only moderators can use this command in announcement channels!',
      });
      return false;
    }

    // Ensure that the channel used is a text channel
    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildVoice &&
      channel.type !== ChannelType.PublicThread &&
      channel.type !== ChannelType.PrivateThread &&
      channel.type !== ChannelType.GuildAnnouncement &&
      channel.type !== ChannelType.GuildForum
    ) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
    }

    // Set the type so it's not an API channel
    channel = channel as TextChannel;

    await channel.sendTyping(); // This method automatically stops typing after 10 seconds, or when a message is sent.
    setTimeout(
      async () =>
        channel.send({
          allowedMentions: { parse: ['users'] },
          content: say,
        }),
      3000,
    );

    await interaction.editReply({ content: `I said '${say}' in ${channel.name}` });

    const channelBotlog = (await interaction.guild.channels.fetch(
      env.CHANNEL_BOTLOG,
    )) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(`${member.displayName} made me say '${say}' \
        in ${channel.name}`);
    }

    return true;
  },
};

export default dSay;
