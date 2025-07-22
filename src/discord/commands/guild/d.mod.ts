import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';

import { stripIndents } from 'common-tags';
import { ChannelType, MessageFlags, Role, SlashCommandBuilder, TextChannel } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { deleteWatchRequest, executeWatch } from '../../../global/commands/g.watchuser';
import commandContext from '../../utils/context';
import { linkThread } from '../../utils/modUtils';

const F = f(__filename);

const SERVER_ONLY_TEXT = 'This command can only be used in a server!';
const EPHEMERAL_TEXT = 'Set to "True" to show the response only to you';

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

  const currentPermissions = channel.permissionOverwrites.cache.get(
    interaction.guild.roles.everyone.id,
  );

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
      AddReactions: null,
      CreatePrivateThreads: null,
      CreatePublicThreads: null,
      SendMessages: null,
      SendMessagesInThreads: null,
      SendTTSMessages: null,
      Speak: null,
    });

    // Remove exempt roles from overrides
    await Promise.all(
      exemptRoles.map(async (roleId) => {
        const role = interaction.guild ? await interaction.guild.roles.fetch(roleId) : null;
        if (role) {
          await channel.permissionOverwrites.edit(role, {
            AddReactions: null,
            CreatePrivateThreads: null,
            CreatePublicThreads: null,
            SendMessages: null,
            SendMessagesInThreads: null,
            SendTTSMessages: null,
            Speak: null,
          });
        }
      }),
    );

    await interaction.editReply({ content: `Channel ${channel} has been unlocked.` });
    return true;
  }
  // Lock the channel
  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
    AddReactions: false,
    CreatePrivateThreads: false,
    CreatePublicThreads: false,
    SendMessages: false,
    SendMessagesInThreads: false,
    SendTTSMessages: false,
    Speak: false,
  });

  // Exempt team roles from lockdown
  await Promise.all(
    exemptRoles.map(async (roleId) => {
      const role = interaction.guild ? await interaction.guild.roles.fetch(roleId) : null;
      if (role) {
        await channel.permissionOverwrites.edit(role, {
          AddReactions: true,
          CreatePrivateThreads: true,
          CreatePublicThreads: true,
          SendMessages: true,
          SendMessagesInThreads: true,
          SendTTSMessages: true,
          Speak: true,
        });
      }
    }),
  );

  await interaction.editReply({ content: `Channel ${channel} has been locked down.` });
  return true;
}

export async function slowMode(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const { channel, guild } = interaction;
  const rateLimit = interaction.options.getString('limit', true);
  const rateLimitNumber = Number.parseInt(rateLimit, 10);
  const verb = rateLimitNumber ? 'enabled' : 'disabled';

  if (!(channel instanceof TextChannel)) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  try {
    await channel.setRateLimitPerUser(rateLimitNumber);
    await interaction.editReply({ content: `Slowmode ${verb} on ${channel}` });

    const channelModerators = (await guild?.channels.fetch(env.CHANNEL_MODERATORS)) as TextChannel;
    const slowModeText = `${(interaction.member as GuildMember).displayName} ${verb} slowmode on ${channel}`;
    await channelModerators?.send({
      content: rateLimitNumber ? `${slowModeText} (${rateLimit}s)` : slowModeText,
    });

    return true;
  } catch {
    await interaction.editReply({ content: 'Failed to set slowmode.' });
    return false;
  }
}

async function link(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const targetUser = interaction.options.getUser('target', true);
  const override = interaction.options.getBoolean('override');

  let result: null | string;
  if (targetUser) {
    result = await linkThread(targetUser.id, interaction.channelId, override);
  } else {
    const userData = await db.users.upsert({
      create: {
        discord_id: targetUser,
      },
      update: {},
      where: {
        discord_id: targetUser,
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

async function unWatchUser(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guild) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  const targetUser = interaction.options.getUser('target', true);

  if (await deleteWatchRequest(targetUser.id, interaction.user.id)) {
    await interaction.editReply({
      content: "Done! You won't be notified the next time this user is active.",
    });
    return true;
  }

  await interaction.editReply({
    content: "Whoops, it seems like you don't have any watch requests on this user to cancel!",
  });
  return false;
}

async function watchUser(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guild) {
    await interaction.editReply({ content: SERVER_ONLY_TEXT });
    return false;
  }

  const targetUser = interaction.options.getUser('target', true);

  const alertChannel: TextChannel =
    interaction.options.getChannel('alert_channel') ??
    (interaction.guild.channels.cache.get(env.CHANNEL_MODERATORS) as TextChannel);

  const notificationMethod = interaction.options.getString('notification_method', true);

  if (await executeWatch(targetUser, notificationMethod, interaction.user.id, alertChannel)) {
    await interaction.editReply({
      content: "Done! You'll be notified when this user is next seen active.",
    });

    const channelBotlog = (await interaction.guild.channels.fetch(
      env.CHANNEL_BOTLOG,
    )) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(
        `${(interaction.member as GuildMember).displayName} used /watch on ${targetUser}`,
      );
    }
  } else {
    await interaction.editReply({
      content:
        "Whoops, it seems like you're already watching this user! If you'd like, you can cancel this or cancel and switch modes, by using /watch cancel.",
    });
  }

  return true;
}

export const dMod: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation commands')
    .setIntegrationTypes([0])
    .addSubcommand((subcommand) =>
      subcommand
        .setName('slowmode')
        .setDescription('Toggle slowmode on a channel')
        .addStringOption((option) =>
          option
            .setName('limit')
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
            )
            .setRequired(true),
        )
        .addBooleanOption((option) => option.setName('ephemeral').setDescription(EPHEMERAL_TEXT)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('lockdown')
        .setDescription('Toggle channel lockdown')
        .addBooleanOption((option) => option.setName('ephemeral').setDescription(EPHEMERAL_TEXT)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('watchuser')
        .setDescription('Set a Watch on a user.')
        .addUserOption((option) =>
          option
            .setName('target')
            .setDescription('The target user to watch for or their Discord ID')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('notification_method')
            .setDescription('How do you want to be notified?')
            .addChoices({ name: 'DM', value: 'dm' }, { name: 'Channel', value: 'channel' })
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName('alert_channel')
            .setDescription("Where should I notify you? (Default: 'here')"),
        )
        .addBooleanOption((option) => option.setName('ephemeral').setDescription(EPHEMERAL_TEXT)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('unwatchuser')
        .setDescription('Stop watching a user')
        .addUserOption((option) =>
          option
            .setName('target')
            .setDescription('The target user to watch for or their Discord ID')
            .setRequired(true),
        )
        .addBooleanOption((option) => option.setName('ephemeral').setDescription(EPHEMERAL_TEXT)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('link')
        .setDescription('Link one user to another.')
        .addUserOption((option) =>
          option.setName('target').setDescription('User to link!').setRequired(true),
        )
        .addBooleanOption((option) =>
          option.setName('override').setDescription('Override existing threads in the DB.'),
        )
        .addBooleanOption((option) => option.setName('ephemeral').setDescription(EPHEMERAL_TEXT)),
    ),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });

    if (!interaction.guild || interaction.guild.id !== env.DISCORD_GUILD_ID.toString()) {
      return false;
    }

    const actor = interaction.member as GuildMember;
    const roleModerator = (await interaction.guild.roles.fetch(env.ROLE_MODERATOR))!;
    const actorIsModule = actor.roles.cache.has(roleModerator.id);

    if (actorIsModule) {
      switch (interaction.options.getSubcommand()) {
        case 'link': {
          await link(interaction);
          break;
        }
        case 'lockdown': {
          await lockdown(interaction);
          break;
        }
        case 'slowmode': {
          await slowMode(interaction);
          break;
        }
        case 'unwatchuser': {
          await unWatchUser(interaction);
          break;
        }
        case 'watchuser': {
          await watchUser(interaction);
          break;
        }
        default: {
          break;
        }
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
