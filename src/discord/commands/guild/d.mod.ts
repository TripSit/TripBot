import { stripIndents } from 'common-tags';
import {
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  Role,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import {
  getAllLevelFreezes, NICE_LEVEL, removeLevelFreeze, setLevelFreeze,
} from '../../../global/commands/g.levelFreeze';
import { deleteWatchRequest, executeWatch } from '../../../global/commands/g.watchuser';
import { getUserTotalLevel, MAX_EXPERIENCE_LEVEL, MIN_EXPERIENCE_LEVEL } from '../../../global/utils/experience';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { linkThread } from '../../utils/modUtils';

const F = f(__filename);

const SERVER_ONLY_TEXT = 'This command can only be used in a server!';
const EPHEMERAL_TEXT = 'Set to "True" to show the response only to you';

export async function slowMode(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const { channel, guild } = interaction;
  const rateLimit = interaction.options.getString('limit', true);
  const rateLimitNum = parseInt(rateLimit, 10);
  const verb = rateLimitNum ? 'enabled' : 'disabled';

  if (!(channel instanceof TextChannel)) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  try {
    await channel.setRateLimitPerUser(rateLimitNum);
    await interaction.editReply({ content: `Slowmode ${verb} on ${channel}` });

    const channelModerators = await guild?.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    const slowModeText = `${(interaction.member as GuildMember).displayName} ${verb} slowmode on ${channel}`;
    await channelModerators?.send({
      content: rateLimitNum ? `${slowModeText} (${rateLimit}s)` : slowModeText,
    });

    return true;
  } catch (error) {
    await interaction.editReply({ content: 'Failed to set slowmode.' });
    return false;
  }
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
    alertChannel = interaction.guild.channels.cache.get(env.CHANNEL_MODERATORS) as TextChannel;
  }

  // Ensure that the channel used is a text channel
  if (alertChannel.type !== ChannelType.GuildText) {
    await interaction.editReply({ content: 'This command can only be used in a text channel!' });
    return false;
  }

  const notificationMethod = interaction.options.getString('notification_method', true);

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
  const targetUser = interaction.options.getUser('target', true);
  const override = interaction.options.getBoolean('override');

  let result: string | null;
  if (!targetUser) {
    const userData = await db.users.upsert({
      where: {
        discord_id: targetUser,
      },
      create: {
        discord_id: targetUser,
      },
      update: {
      },
    });

    if (!userData) {
      await interaction.editReply({
        content: stripIndents`Failed to link thread, I could not find this user in the guild, \
and they do not exist in the database!`,
      });
      return false;
    }
    result = await linkThread(targetUser, interaction.channelId, override);
  } else {
    result = await linkThread(targetUser.id, interaction.channelId, override);
  }

  if (result === null) {
    await interaction.editReply({ content: 'Successfully linked thread!' });
    return true;
  }
  const existingThread = await interaction.client.channels.fetch(result);
  await interaction.editReply({
    content: stripIndents`Failed to link thread, this user has an existing thread: ${existingThread}
      Use the override parameter if you're sure!`,
  });
  return false;
}

export async function lockdown(interaction: ChatInputCommandInteraction): Promise<boolean> {
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

    // Remove exempt roles from overrides
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

  // Exempt team roles from lockdown
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
// Requested by Ruubert and yes, we actually developed it
async function freezeLevel(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guild) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  const targetUser = interaction.options.getUser('target', true);
  const level = interaction.options.getInteger('level', true);

  try {
    await setLevelFreeze(targetUser.id, level);
  } catch (error) {
    if (error instanceof RangeError) {
      // eslint-disable-next-line max-len
      await interaction.editReply({ content: `The level must be a whole number between ${MIN_EXPERIENCE_LEVEL} and ${MAX_EXPERIENCE_LEVEL}.` });
      return false;
    }
    log.error(F, `Failed to freeze level for ${targetUser.id}: ${error}`);
    await interaction.editReply({ content: 'Something went wrong setting that level freeze. Please try again.' });
    return false;
  }

  const nice = level === NICE_LEVEL;
  const niceBit = level === NICE_LEVEL ? ' Nice. 😏' : '';
  // eslint-disable-next-line max-len
  await interaction.editReply({ content: `Done! **${targetUser.username}**'s displayed level is now frozen at ${level}.${niceBit}` });

  const modName = (interaction.member as GuildMember).displayName;
  const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
  if (channelBotlog) {
    // eslint-disable-next-line max-len
    const botlogMsg = `${modName} froze ${targetUser.username} (${targetUser.id}) at displayed level ${level}`;
    await channelBotlog.send(nice ? `${botlogMsg}. Nice. 😎` : botlogMsg);
  }
  return true;
}

async function unfreezeLevel(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guild) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  const targetUser = interaction.options.getUser('target', true);

  if (!await removeLevelFreeze(targetUser.id)) {
    // eslint-disable-next-line max-len
    await interaction.editReply({ content: `**${targetUser.username}** doesn't have their displayed level frozen.` });
    return false;
  }

  await interaction.editReply({ content: `Done! **${targetUser.username}**'s displayed level is no longer frozen.` });

  const modName = (interaction.member as GuildMember).displayName;
  const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
  if (channelBotlog) {
    await channelBotlog.send(`${modName} unfroze ${targetUser.username} (${targetUser.id})`);
  }
  return true;
}

async function listFrozenLevels(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const frozen = await getAllLevelFreezes();

  if (frozen.length === 0) {
    await interaction.editReply({ content: 'No users currently have their displayed level frozen. ❄️' });
    return true;
  }

  const lines = await Promise.all(frozen.map(async ({ discordId, frozenLevel }) => {
    const trueLevel = await getUserTotalLevel(discordId);
    const user = await interaction.client.users.fetch(discordId).catch(() => null);
    const name = user ? user.username : 'unknown user';
    return `• ${name} (${discordId}): frozen at ${frozenLevel} (true level ${trueLevel})`;
  }));

  const header = `🧊 Frozen displayed levels (${frozen.length}):`;
  const pages: string[] = [];
  let current = header;
  lines.forEach(line => {
    if (`${current}\n${line}`.length > 1900) {
      pages.push(current);
      current = line;
    } else {
      current = `${current}\n${line}`;
    }
  });
  pages.push(current);

  await interaction.editReply({ content: pages[0] });
  for (let i = 1; i < pages.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await interaction.followUp({ content: pages[i], flags: MessageFlags.Ephemeral });
  }
  return true;
}

export const dMod: SlashCommand = {
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
          { name: '15s', value: '15' },
          { name: '30s', value: '30' },
          { name: '1m', value: '60' },
          { name: '2m', value: '120' },
          { name: '5m', value: '300' },
          { name: '10m', value: '600' },
        ).setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(EPHEMERAL_TEXT)))
    .addSubcommand(subcommand => subcommand
      .setName('lockdown')
      .setDescription('Toggle channel lockdown')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(EPHEMERAL_TEXT)))
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
        .setDescription('Where should I notify you? (Default: \'here\')'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(EPHEMERAL_TEXT)))
    .addSubcommand(subcommand => subcommand
      .setName('unwatchuser')
      .setDescription('Stop watching a user')
      .addUserOption(option => option.setName('target')
        .setDescription('The target user to watch for or their Discord ID')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(EPHEMERAL_TEXT)))
    .addSubcommand(subcommand => subcommand
      .setName('freezelevel')
      .setDescription('Freeze a user\'s displayed level (display only; does not affect roles etc)')
      .addUserOption(option => option.setName('target')
        .setDescription('The user whose level to freeze')
        .setRequired(true))
      .addIntegerOption(option => option.setName('level')
        .setDescription('The level to pin them at')
        .setMinValue(MIN_EXPERIENCE_LEVEL)
        .setMaxValue(MAX_EXPERIENCE_LEVEL)
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('unfreezelevel')
      .setDescription('Remove a user\'s level freeze, restoring their true displayed level')
      .addUserOption(option => option.setName('target')
        .setDescription('The user whose level freeze to remove')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('frozenlevels')
      .setDescription('List all users whose displayed level is frozen'))
    .addSubcommand(subcommand => subcommand
      .setName('link')
      .setDescription('Link one user to another.')
      .addUserOption(option => option.setName('target')
        .setDescription('User to link!')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('override')
        .setDescription('Override existing threads in the DB.'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(EPHEMERAL_TEXT))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const subcommand = interaction.options.getSubcommand();
    // Level-freeze actions are always hidden so the target is never notified.
    const alwaysEphemeral = subcommand === 'freezelevel'
      || subcommand === 'unfreezelevel'
      || subcommand === 'frozenlevels';
    const ephemeral = (alwaysEphemeral || interaction.options.getBoolean('ephemeral'))
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });

    if (!interaction.guild || interaction.guild.id !== env.DISCORD_GUILD_ID.toString()) {
      return false;
    }

    const actor = interaction.member as GuildMember;
    const roleModerator = await interaction.guild.roles.fetch(env.ROLE_MODERATOR) as Role;
    const actorIsMod = actor.roles.cache.has(roleModerator.id);

    if (actorIsMod) {
      switch (subcommand) {
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
        case 'freezelevel':
          await freezeLevel(interaction);
          break;
        case 'unfreezelevel':
          await unfreezeLevel(interaction);
          break;
        case 'frozenlevels':
          await listFrozenLevels(interaction);
          break;
        default:
          break;
      }
      return true;
    }
    await interaction.editReply({
      content: 'You do not have permission to use this command.',
    });
    return false;
  },
};

export default dMod;
