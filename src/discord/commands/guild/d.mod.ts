import {
  ChannelType,
  ChatInputCommandInteraction,
  Colors,
  GuildMember,
  MessageFlags,
  Role,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { deleteWatchRequest, executeWatch } from '../../../global/commands/g.watchuser';
import { getDiscordMember } from '../../utils/guildMemberLookup';
import { embedTemplate } from '../../utils/embedTemplate';
import { linkThread } from '../../utils/modUtils';

// import log from '../../../global/utils/logger';

const F = f(__filename);

const SERVER_ONLY_TEXT = 'This command can only be used in a server!';

async function slowMode(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const { channel } = interaction;
  const rateLimit = interaction.options.getString('limit', true);
  const verb = rateLimit !== '0' ? 'enabled' : 'disabled';

  if (!(channel instanceof TextChannel)) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  if (rateLimit !== '0') {
    await channel.setRateLimitPerUser(parseInt(rateLimit, 10));
  } else {
    await channel.setRateLimitPerUser(0);
  }

  await interaction.editReply({ content: `Slowmode ${verb} on ${channel}` });

  const channelModerators = await interaction.guild?.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
  channelModerators.send({
    content: `${(interaction.member as GuildMember).displayName} ${verb} slowmode on ${channel}`,
  });
  return true;
}

async function unWatchUser(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guild) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  const targetUser = interaction.options.getUser('target', true);

  if (await deleteWatchRequest(targetUser.id, interaction.user.id)) {
    await interaction.editReply({ content: 'Done! You won\'t be notified the next time this user is active.' });
    return true;
  }
  // eslint-disable-next-line max-len
  await interaction.editReply({ content: 'Whoops, it seems like you don\'t have any watch requests on this user to cancel!' });
  return false;
}

async function watchUser(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guild) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  const targetUser = interaction.options.getUser('target', true);

  let alertChannel = interaction.options.getChannel('alert_channel') as TextChannel | null;

  if (!alertChannel) {
    alertChannel = interaction.channel as TextChannel;
  }

  // Ensure that the channel used is a text channel
  if (alertChannel.type !== ChannelType.GuildText) {
    await interaction.editReply({ content: 'This command can only be used in a text channel!' });
    return false;
  }

  const notificationMethod = interaction.options.getString('notification_method', true);
  // const target = await interaction.client.users.fetch(targetUser.id);

  if (await executeWatch(targetUser, notificationMethod, interaction.user.id, alertChannel)) {
    await interaction.editReply({ content: 'Done! You\'ll be notified when this user is next seen active.' });

    const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(`${(interaction.member as GuildMember).displayName} used /watch on ${targetUser}`);
    }
  } else {
    // eslint-disable-next-line max-len
    await interaction.editReply({ content: 'Whoops, it seems like you\'re already watching this user! If you\'d like, you can cancel this or cancel and switch modes, by using /watch cancel.' });
  }

  return true;
}

async function link(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const targetString = interaction.options.getString('target', true);
  const targets = await getDiscordMember(interaction, targetString);
  const override = interaction.options.getBoolean('override');
  if (targets.length > 1) {
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setTitle('Found more than one user with with that value!')
      .setDescription(stripIndents`
      "${targetString}" returned ${targets.length} results!

      Be more specific:
      > **Mention:** @Moonbear
      > **Tag:** moonbear#1234
      > **ID:** 9876581237
      > **Nickname:** MoonBear`);
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  if (targets.length === 0) {
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setTitle(`${targetString}" returned no results!`)
      .setDescription(stripIndents`
  Be more specific:
  > **Mention:** @Moonbear
  > **Tag:** moonbear#1234
  > **ID:** 9876581237
  > **Nickname:** MoonBear`);
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }

  const target = targets[0];

  let result: string | null;
  if (!target) {
    const userData = await db.users.upsert({
      where: {
        discord_id: targetString,
      },
      create: {
        discord_id: targetString,
      },
      update: {
      },
    });

    if (!userData) {
      await interaction.reply({
        content: stripIndents`Failed to link thread, I could not find this user in the guild, \
and they do not exist in the database!`,
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }
    result = await linkThread(targetString, interaction.channelId, override);
  } else {
    result = await linkThread(target.id, interaction.channelId, override);
  }

  if (result === null) {
    await interaction.editReply({ content: 'Successfully linked thread!' });
    return true;
  }
  const existingThread = await interaction.client.channels.fetch(result);
  await interaction.reply({
    content: stripIndents`Failed to link thread, this user has an existing thread: ${existingThread}
      Use the override parameter if you're sure!`,
    flags: MessageFlags.Ephemeral,
  });
  return false;
}

async function lockdown(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const { channel } = interaction;
  if (!(channel instanceof TextChannel)) {
    await interaction.editReply({ content: 'This command can only be used in a text channel' });
    return false;
  }

  if (!interaction.guild) {
    await interaction.editReply({ content: 'This command can only be used in a server!' });
    return false;
  }

  const currentPermissions = channel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id);

  const isLocked = currentPermissions?.deny.has('SendMessages');

  const exemptRoles = [
    env.ROLE_MODERATOR,
    env.ROLE_TRIPSITTER,
    env.ROLE_DEVELOPER,
    env.ROLE_TEAMTRIPSIT,
  ];

  if (isLocked) {
    // Unlock the channel
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
      AddReactions: null,
      Speak: null,
      SendTTSMessages: null,
      SendMessagesInThreads: null,
      CreatePublicThreads: null,
      CreatePrivateThreads: null,
    });

    await Promise.all(exemptRoles.map(async roleId => {
      const role = interaction.guild ? await interaction.guild.roles.fetch(roleId) : null;
      if (role) {
        await channel.permissionOverwrites.edit(role, {
          SendMessages: null,
          AddReactions: null,
          Speak: null,
          SendTTSMessages: null,
          SendMessagesInThreads: null,
          CreatePublicThreads: null,
          CreatePrivateThreads: null,
        });
      }
    }));

    await interaction.editReply({ content: `Channel ${channel} has been unlocked.` });
    return true;
  }
  // Lock the channel
  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
    SendMessages: false,
    AddReactions: false,
    Speak: false,
    SendTTSMessages: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
  });

  await Promise.all(exemptRoles.map(async roleId => {
    const role = interaction.guild ? await interaction.guild.roles.fetch(roleId) : null;
    if (role) {
      await channel.permissionOverwrites.edit(role, {
        SendMessages: true,
        AddReactions: true,
        Speak: true,
        SendTTSMessages: true,
        SendMessagesInThreads: true,
        CreatePublicThreads: true,
        CreatePrivateThreads: true,
      });
    }
  }));

  await interaction.editReply({ content: `Channel ${channel} has been locked down.` });
  return true;
}

export const dLast: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation commands')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('slowmode')
      .setDescription('Toggle slowmode on a channel')
      .addStringOption(option => option.setName('limit')
        .setDescription('How long between messages?')
        .addChoices(
          { name: 'Disabled', value: '0' },
          { name: '5s', value: '5' },
          { name: '10s', value: '10' },
          { name: '15s', value: '10' },
          { name: '30s', value: '30' },
          { name: '1m', value: '60' },
          { name: '2m', value: '120' },
          { name: '5m', value: '300' },
          { name: '10m', value: '600' },
        )
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('lockdown')
      .setDescription('Toggle channel lockdown'))
    .addSubcommand(subcommand => subcommand
      .setName('watchuser')
      .setDescription('Set a Watch on a user.')
      .addUserOption(option => option.setName('target')
        .setDescription('The target user to watch for or their Discord ID')
        .setRequired(true))
      .addStringOption(option => option.setName('notification_method')
        .setDescription('How do you want to be notified?')
        .addChoices(
          { name: 'DM', value: 'dm' },
          { name: 'Channel', value: 'channel' },
        )
        .setRequired(true))
      .addChannelOption(option => option.setName('alert_channel')
        .setDescription('Where should I notify you? (Default: \'here\')')))
    .addSubcommand(subcommand => subcommand
      .setName('unwatchuser')
      .setDescription('Stop watching a user')
      .addUserOption(option => option.setName('target')
        .setDescription('The target user to watch for or their Discord ID')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('link')
      .setDescription('Link one user to another.')
      .addUserOption(option => option.setName('target')
        .setDescription('User to link!')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('override')
        .setDescription('Override existing threads in the DB.'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (interaction.guild) {
      if (interaction.guild.id !== env.DISCORD_GUILD_ID.toString()) {
        return false;
      }
    } else {
      return false;
    }

    // const target = interaction.options.getMember('user') as GuildMember;
    const actor = interaction.member as GuildMember;
    const roleModerator = await interaction.guild.roles.fetch(env.ROLE_MODERATOR) as Role;
    const actorIsMod = actor.roles.cache.has(roleModerator.id);

    // const response = await last(target.user, interaction.guild);

    // await interaction.editReply({ content: `${response.lastMessage}` });

    if (actorIsMod) {
      switch (interaction.options.getSubcommand()) {
        case 'slowmode':
          await slowMode(interaction);
          break;
        case 'lockdown':
          await lockdown(interaction);
          break;
        case 'watchuser':
          await watchUser(interaction);
          break;
        case 'unwatchuser':
          await unWatchUser(interaction);
          break;
        case 'link':
          await link(interaction);
          break;
        default:
          break;
      }
      return true;
    }
    return false; // Ensure a boolean is always returned
  },
};

export default dLast;
