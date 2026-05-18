import {
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ChatInputCommandInteraction,
  PermissionResolvable,
  GuildMember,
  Channel,
  MessageFlags,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  bridgeConfirm, bridgeCreate, bridgePause, bridgeRemove, bridgeResume,
} from '../../../global/commands/g.bridge';
import commandContext from '../../utils/context';
import { checkChannelPermissions } from '../../utils/checkPermissions';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

async function create(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return t(locale, 'bridge', 'noPermissionCreate');
  }

  if (interaction.guild?.id !== env.DISCORD_GUILD_ID) {
    return t(locale, 'bridge', 'notTripSit');
  }

  const internalChannel = interaction.channel;
  if (!(internalChannel instanceof TextChannel)) {
    return t(locale, 'bridge', 'notTextChannel');
  }

  const internalChannelPerms = await checkChannelPermissions(internalChannel, [
    'ManageWebhooks' as PermissionResolvable,
  ]);
  if (!internalChannelPerms.hasPermission) {
    log.error(F, stripIndents`Missing ${internalChannelPerms.permission} permission \
in ${internalChannel.guild.name}'s ${internalChannel}!`);
    return t(locale, 'bridge', 'missingPermission', {
      permission: internalChannelPerms.permission,
      guild: internalChannel.guild.name,
      channel: internalChannel.toString(),
    });
  }

  const externalChannelId = interaction.options.getString('external_channel', true);

  // Do a check to make sure the external ID is a series of number
  if (!/^\d+$/.test(externalChannelId)) {
    return t(locale, 'bridge', 'invalidChannelId');
  }

  let externalChannel = {} as Channel | null;
  try {
    externalChannel = await interaction.client.channels.fetch(externalChannelId);
  } catch (error) {
    log.error(F, stripIndents`Error fetching external channel: ${error}`);
    return t(locale, 'bridge', 'channelNotFound');
  }

  if (!(externalChannel instanceof TextChannel)) {
    return t(locale, 'bridge', 'externalNotTextChannel');
  }

  const externalChannelPerms = await checkChannelPermissions(externalChannel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'ManageWebhooks' as PermissionResolvable,
  ]);
  if (!externalChannelPerms.hasPermission) {
    return t(locale, 'bridge', 'externalMissingPermission', {
      permission: externalChannelPerms.permission,
      guild: externalChannel.guild.name,
      channel: externalChannel.toString(),
    });
  }

  // Done with all checks, start doing stuff!

  const bridgeInitialized = await bridgeCreate(
    internalChannel.id,
    externalChannel.id,
    interaction.options.getBoolean('override', false) ?? false,
  );
  if (bridgeInitialized.startsWith('Error')) {
    return bridgeInitialized;
  }

  await externalChannel.send({
    embeds: [
      embedTemplate()
        .setTitle(t(locale, 'bridge', 'bridgeTitle'))
        .setDescription(t(locale, 'bridge', 'createRequestDescription', {
          member: (interaction.member as GuildMember).displayName,
          internalGuild: internalChannel.guild.name,
          internalChannel: internalChannel.toString(),
          externalGuild: externalChannel.guild.name,
          externalChannel: externalChannel.toString(),
        })),
    ],
  });

  return t(locale, 'bridge', 'createSuccess', {
    internalGuild: internalChannel.guild.name,
    internalChannel: internalChannel.toString(),
    externalGuild: externalChannel.guild.name,
    externalChannel: externalChannel.toString(),
  });
}

async function confirm(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return t(locale, 'bridge', 'noPermissionCreate');
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    return t(locale, 'bridge', 'notTripSit');
  }

  // const externalChannelId = interaction.options.getString('external_channel', true);
  // const externalChannel = await interaction.client.channels.fetch(externalChannelId);
  // if (!(externalChannel instanceof TextChannel)) {
  //   return t(locale, 'bridge', 'externalNotTextChannel');
  // }

  // const externalChannelPerms = await checkChannelPermissions(externalChannel, [
  //   'ViewChannel' as PermissionResolvable,
  //   'SendMessages' as PermissionResolvable,
  //   'ManageWebhooks' as PermissionResolvable,
  // ])
  // if (!externalChannelPerms.hasPermission) {
  //   return t(locale, 'bridge', 'externalMissingPermission', {
  //     permission: externalChannelPerms.permission,
  //     guild: externalChannel.guild.name,
  //     channel: externalChannel.toString(),
  //   });
  // }

  // Checks were already done in the other script, so we can just assume it's fine

  const externalChannel = interaction.channel as TextChannel;

  const bridgedChannel = await bridgeConfirm(
    externalChannel.id,
  );

  if (bridgedChannel.startsWith('Error')) {
    return bridgedChannel;
  }

  const internalChannel = await interaction.client.channels.fetch(bridgedChannel) as TextChannel;

  await internalChannel.send({
    embeds: [
      embedTemplate()
        .setTitle(t(locale, 'bridge', 'bridgeTitle'))
        .setDescription(t(locale, 'bridge', 'confirmDescription', {
          member: (interaction.member as GuildMember).displayName,
          internalGuild: internalChannel.guild.name,
          internalChannel: internalChannel.toString(),
          externalGuild: externalChannel.guild.name,
          externalChannel: externalChannel.toString(),
        })),
    ],
  });

  return t(locale, 'bridge', 'confirmSuccess', {
    member: (interaction.member as GuildMember).displayName,
    externalGuild: externalChannel.guild.name,
    externalChannel: externalChannel.toString(),
    internalGuild: internalChannel.guild.name,
    internalChannel: internalChannel.toString(),
  });
}

async function pause(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return t(locale, 'bridge', 'noPermissionPause');
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    // Get the bridges from the database that use this internal_channel
    const bridges = await db.bridges.findMany({
      where: {
        internal_channel: (interaction.channel as TextChannel).id,
      },
    });

    if (bridges.length === 0) {
      return t(locale, 'bridge', 'noBridgeError');
    }

    const activeBridges = bridges.filter(bridge => bridge.status === 'ACTIVE');

    if (activeBridges.length === 0) {
      return t(locale, 'bridge', 'noActiveBridges');
    }

    await Promise.allSettled(activeBridges.map(bridge => bridgePause(bridge.external_channel)));

    return t(locale, 'bridge', 'pausedMultiple', { count: bridges.length });
  }
  // Get the bridges from the database that use this external_channel
  const bridge = await db.bridges.findFirst({
    where: {
      internal_channel: (interaction.channel as TextChannel).id,
    },
  });

  if (!bridge) {
    return t(locale, 'bridge', 'noBridgeError');
  }

  if (bridge.status !== 'ACTIVE') {
    return t(locale, 'bridge', 'noActiveBridges');
  }

  await bridgePause((interaction.channel as TextChannel).id);

  return t(locale, 'bridge', 'pausedSingle');
}

async function resume(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return t(locale, 'bridge', 'noPermissionResume');
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    // Get the bridges from the database that use this internal_channel
    const bridges = await db.bridges.findMany({
      where: {
        internal_channel: (interaction.channel as TextChannel).id,
      },
    });

    if (bridges.length === 0) {
      return t(locale, 'bridge', 'noBridgeError');
    }

    const activeBridges = bridges.filter(bridge => bridge.status === 'PAUSED');

    if (activeBridges.length === 0) {
      return t(locale, 'bridge', 'noPausedBridges');
    }

    // Resume all bridges
    await Promise.allSettled(activeBridges.map(bridge => bridgeResume(bridge.external_channel)));

    return t(locale, 'bridge', 'resumedMultiple', { count: bridges.length });
  }
  // Get the bridges from the database that use this external_channel
  const bridge = await db.bridges.findFirst({
    where: {
      internal_channel: (interaction.channel as TextChannel).id,
    },
  });

  if (!bridge) {
    return t(locale, 'bridge', 'noBridgeError');
  }

  if (bridge.status !== 'PAUSED') {
    return t(locale, 'bridge', 'noPausedBridges');
  }

  await bridgeResume((interaction.channel as TextChannel).id);

  return t(locale, 'bridge', 'resumedSingle');
}

async function remove(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return t(locale, 'bridge', 'noPermissionRemove');
  }

  // Check if the 'confirmation' option was used make sure it matches the guild ID
  const confirmation = interaction.options.getString('confirmation');

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    // Get the bridges from the database that use this internal_channel
    const bridges = await db.bridges.findMany({
      where: {
        internal_channel: (interaction.channel as TextChannel).id,
      },
    });

    if (bridges.length === 0) {
      return t(locale, 'bridge', 'noBridgeError');
    }

    if (confirmation !== interaction.guild?.id) {
      return t(locale, 'bridge', 'confirmRemovalMultiple', { count: bridges.length });
    }

    await Promise.allSettled(bridges.map(bridge => bridgeRemove(bridge.external_channel)));

    return t(locale, 'bridge', 'removedMultiple', { count: bridges.length });
  }
  // Get the bridges from the database that use this external_channel
  const bridge = await db.bridges.findFirst({
    where: {
      internal_channel: (interaction.channel as TextChannel).id,
    },
  });

  if (!bridge) {
    return t(locale, 'bridge', 'noBridgeError');
  }

  if (confirmation !== interaction.guild?.id) {
    return t(locale, 'bridge', 'confirmRemovalSingle');
  }

  await bridgeRemove((interaction.channel as TextChannel).id);

  return t(locale, 'bridge', 'removedSingle');
}

async function info(
  interaction:ChatInputCommandInteraction,
  locale: string,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return t(locale, 'bridge', 'noPermissionInfo');
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    // Get the bridges from the database that use this internal_channel
    const bridges = await db.bridges.findMany({
      where: {
        internal_channel: (interaction.channel as TextChannel).id,
      },
    });

    if (bridges.length === 0) {
      return t(locale, 'bridge', 'noBridgeError');
    }

    let message = t(locale, 'bridge', 'infoMultiple', { count: bridges.length });

    bridges.forEach(async bridge => {
      const channel = await discordClient.channels.fetch(bridge.external_channel) as TextChannel;

      message += `\n${t(locale, 'bridge', 'infoConnected', {
        guild: channel.guild.name,
        channel: channel.name,
      })}`;
    });

    return message;
  }
  // Get the bridges from the database that use this external_channel
  const bridge = await db.bridges.findFirst({
    where: {
      internal_channel: (interaction.channel as TextChannel).id,
    },
  });

  if (!bridge) {
    return t(locale, 'bridge', 'noBridgeError');
  }

  const internalChannel = await discordClient.channels.fetch(bridge.internal_channel);
  if (!internalChannel) return t(locale, 'bridge', 'noBridgeError');
  const { guild } = internalChannel as TextChannel;

  return t(locale, 'bridge', 'infoSingle', {
    guild: guild.toString(),
    channel: internalChannel.toString(),
  });
}

export const dBridge: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setNameLocalizations(getCommandLocalizations('bridge', 'commandName'))
    .setDescription('Manage the bridge between two discord channels')
    .setDescriptionLocalizations(getCommandLocalizations('bridge', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setNameLocalizations(getCommandLocalizations('bridge', 'createSubcommand'))
      .setDescription(t('en', 'bridge', 'createDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('bridge', 'createDescription'))
      .addStringOption(option => option.setName('external_channel')
        .setDescription(t('en', 'bridge', 'externalChannelOption'))
        .setDescriptionLocalizations(getCommandLocalizations('bridge', 'externalChannelOption'))
        .setRequired(true))
      .addBooleanOption(option => option.setName('override')
        .setDescription(t('en', 'bridge', 'overrideOption'))
        .setDescriptionLocalizations(getCommandLocalizations('bridge', 'overrideOption'))
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('confirm')
      .setNameLocalizations(getCommandLocalizations('bridge', 'confirmSubcommand'))
      .setDescription(t('en', 'bridge', 'confirmDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('bridge', 'confirmDescription')))
    .addSubcommand(subcommand => subcommand
      .setName('pause')
      .setNameLocalizations(getCommandLocalizations('bridge', 'pauseSubcommand'))
      .setDescription(t('en', 'bridge', 'pauseDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('bridge', 'pauseDescription')))
    .addSubcommand(subcommand => subcommand
      .setName('resume')
      .setNameLocalizations(getCommandLocalizations('bridge', 'resumeSubcommand'))
      .setDescription(t('en', 'bridge', 'resumeDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('bridge', 'resumeDescription')))
    .addSubcommand(subcommand => subcommand
      .setName('info')
      .setNameLocalizations(getCommandLocalizations('bridge', 'infoSubcommand'))
      .setDescription(t('en', 'bridge', 'infoDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('bridge', 'infoDescription')))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setNameLocalizations(getCommandLocalizations('bridge', 'removeSubcommand'))
      .setDescription(t('en', 'bridge', 'removeDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('bridge', 'removeDescription'))
      .addStringOption(option => option.setName('confirmation')
        .setDescription(t('en', 'bridge', 'confirmationOption'))
        .setDescriptionLocalizations(getCommandLocalizations('bridge', 'confirmationOption')))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const locale = await getLocale(interaction, 'bridge');
    const embed = embedTemplate()
      .setTitle(t(locale, 'bridge', 'bridgeTitle'))
      .setColor(Colors.DarkPurple);
    if (!interaction.guild || !interaction.member) {
      await interaction.editReply({
        embeds: [
          embed
            .setDescription(t(locale, 'bridge', 'guildOnly'))
            .setColor(Colors.Red),
        ],
      });
      return false;
    }

    // Check if the guild is a partner (or the home guild)
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: interaction.guild.id,
      },
      create: {
        id: interaction.guild.id,
      },
      update: {},
    });

    if (interaction.guild.id !== env.DISCORD_GUILD_ID
      && !guildData.partner
      && !guildData.supporter) {
      await interaction.editReply({
        embeds: [
          embed
            .setDescription(t(locale, 'bridge', 'partnerOnly'))
            .setColor(Colors.Red),
        ],
      });
      return false;
    }

    const command = interaction.options.getSubcommand();

    if (command === 'create') {
      embed.setDescription(await create(interaction, locale));
    } else if (command === 'confirm') {
      embed.setDescription(await confirm(interaction, locale));
    } else if (command === 'pause') {
      embed.setDescription(await pause(interaction, locale));
    } else if (command === 'resume') {
      embed.setDescription(await resume(interaction, locale));
    } else if (command === 'remove') {
      embed.setDescription(await remove(interaction, locale));
    } else if (command === 'info') {
      embed.setDescription(await info(interaction, locale));
    }

    await interaction.editReply({
      embeds: [embed],
    });

    return true;
  },
};

export default dBridge;
