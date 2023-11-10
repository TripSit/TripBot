import {
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ChatInputCommandInteraction,
  PermissionResolvable,
  GuildMember,
  Channel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { PrismaClient } from '@prisma/client';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  bridgeConfirm, bridgeCreate, bridgePause, bridgeRemove, bridgeResume,
} from '../../../global/commands/g.bridge';
import commandContext from '../../utils/context';
import { checkChannelPermissions } from '../../utils/checkPermissions';

const db = new PrismaClient({ log: ['error', 'info', 'query', 'warn'] });

const F = f(__filename);

const noBridgeError = 'Error: No bridges found for this channel.';

async function create(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return 'Error: You do not have the ManageChannel permission needed to create a bridge!';
  }

  if (interaction.guild?.id !== env.DISCORD_GUILD_ID) {
    return stripIndents`Error: This command can only be used in the TripSit Discord server.
    You likely want to use the /bridge confirm command instead!`;
  }

  const internalChannel = interaction.channel;
  if (!(internalChannel instanceof TextChannel)) {
    return 'Error: Internal channel is not a text channel.';
  }

  const internalChannelPerms = await checkChannelPermissions(internalChannel, [
    'ManageWebhooks' as PermissionResolvable,
  ]);
  if (!internalChannelPerms.hasPermission) {
    log.error(F, stripIndents`Missing ${internalChannelPerms.permission} permission \
in ${internalChannel.guild.name}'s ${internalChannel}!`);
    return stripIndents`Error: Missing ${internalChannelPerms.permission} permission \
in ${internalChannel.guild.name}'s ${internalChannel}!
    Manage Webhooks - Create the channel webhook`;
  }

  const externalChannelId = interaction.options.getString('external_channel', true);

  // Do a check to make sure the external ID is a series of number
  if (!/^\d+$/.test(externalChannelId)) {
    return 'Error: External channel ID is not a number!';
  }

  let externalChannel = {} as Channel | null;
  try {
    externalChannel = await interaction.client.channels.fetch(externalChannelId);
  } catch (error) {
    log.error(F, stripIndents`Error fetching external channel: ${error}`);
    return 'Error: This channel ID does not exist, did you enter the ID correctly?';
  }

  if (!(externalChannel instanceof TextChannel)) {
    return 'Error: External channel is not a text channel.';
  }

  const externalChannelPerms = await checkChannelPermissions(externalChannel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'ManageWebhooks' as PermissionResolvable,
  ]);
  if (!externalChannelPerms.hasPermission) {
    return stripIndents`Error: Missing ${externalChannelPerms.permission} permission in \
${externalChannel.guild.name}'s ${externalChannel}!
    
    Ask the collaborator to make sure the bot has the right permissions:
    View Channel - To see the channel
    Send Messages - To send a message to the other guild
    Manage Webhooks - To create the channel webhook`;
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
        .setTitle('Bridge')
        .setDescription(stripIndents`${(interaction.member as GuildMember).displayName} has requested a bridge between \
${internalChannel.guild.name}'s ${internalChannel} and ${externalChannel.guild.name}'s ${externalChannel}!
            If you want to accept this bridge, please use the **/bridge confirm** command here.
            If this is not expected you can ignore this as it may be a mistake.
            If this command is being abused please talk to Moonbear on TripSit's Discord guild.`),
    ],
  });

  return stripIndents`Initializing bridge between ${internalChannel.guild.name}'s ${internalChannel} and \
${externalChannel.guild.name}'s ${externalChannel}!
  I've prompted the other guild to confirm the bridge.`;
}

async function confirm(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return 'Error: You do not have the ManageChannel permission needed to create a bridge!';
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    return stripIndents`Error: This command can only be used outside the TripSit Discord server.
    You likely want to use the /bridge create command instead!`;
  }

  // const externalChannelId = interaction.options.getString('external_channel', true);
  // const externalChannel = await interaction.client.channels.fetch(externalChannelId);
  // if (!(externalChannel instanceof TextChannel)) {
  //   return 'Error: External channel is not a text channel.';
  // }

  // const externalChannelPerms = await checkChannelPermissions(externalChannel, [
  //   'ViewChannel' as PermissionResolvable,
  //   'SendMessages' as PermissionResolvable,
  //   'ManageWebhooks' as PermissionResolvable,
  // ])
  // if (!externalChannelPerms.hasPermission) {
  //   return stripIndents`Error: Missing ${externalChannelPerms.permission} permission in \
  // ${externalChannel.guild.name}'s ${externalChannel}!

  //   Ask the collaborator to make sure the bot has the right permissions:
  //   View Channel - To see the channel
  //   Send Messages - To send a message to the other guild
  //   Manage Webhooks - To create the channel webhook`;
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
        .setTitle('Bridge')
        .setDescription(stripIndents`
        ${(interaction.member as GuildMember).displayName} has confirmed the bridge between \
${internalChannel.guild.name}'s ${internalChannel} and ${externalChannel.guild.name}'s ${externalChannel}!
            Either side can */bridge pause* and */bridge resume* to temporarily pause/resume the bridge, \
or */bridge delete* to remove the bridge.
            This is the start of something beautiful, say hi!`),
    ],
  });

  return stripIndents`${(interaction.member as GuildMember).displayName} has confirmed the bridge between \
${externalChannel.guild.name}'s ${externalChannel} and ${internalChannel.guild.name}'s ${internalChannel}!
    Either side can */bridge pause* and */bridge resume* to temporarily pause/resume the bridge, \
    or */bridge delete* to remove the bridge.
    This is the start of something beautiful, say hi!`;
}

async function pause(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return 'Error: You do not have the ManageChannel permission needed to pause a bridge!';
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    // Get the bridges from the database that use this internal_channel
    const bridges = await db.bridges.findMany({
      where: {
        internal_channel: (interaction.channel as TextChannel).id,
      },
    });

    if (bridges.length === 0) {
      return noBridgeError;
    }

    const activeBridges = bridges.filter(bridge => bridge.status === 'ACTIVE');

    if (activeBridges.length === 0) {
      return 'Error: No active bridges found for this channel. Did you mean to use the /bridge resume command?';
    }

    await Promise.allSettled(activeBridges.map(bridge => bridgePause(bridge.external_channel)));

    return stripIndents`Paused ${bridges.length} bridge(s) connected to this room.`;
  }
  // Get the bridges from the database that use this external_channel
  const bridge = await db.bridges.findFirst({
    where: {
      internal_channel: (interaction.channel as TextChannel).id,
    },
  });

  if (!bridge) {
    return noBridgeError;
  }

  if (bridge.status !== 'ACTIVE') {
    return 'Error: No active bridges found for this channel. Did you mean to use the /bridge resume command?';
  }

  await bridgePause((interaction.channel as TextChannel).id);

  return 'Paused bridge connected to this room.';
}

async function resume(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return 'Error: You do not have the ManageChannel permission needed to resume a bridge!';
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    // Get the bridges from the database that use this internal_channel
    const bridges = await db.bridges.findMany({
      where: {
        internal_channel: (interaction.channel as TextChannel).id,
      },
    });

    if (bridges.length === 0) {
      return noBridgeError;
    }

    const activeBridges = bridges.filter(bridge => bridge.status === 'PAUSED');

    if (activeBridges.length === 0) {
      return 'Error: No paused bridges found for this channel. Did you mean to use the /bridge pause command?';
    }

    // Resume all bridges
    await Promise.allSettled(activeBridges.map(bridge => bridgeResume(bridge.external_channel)));

    return stripIndents`Resumed ${bridges.length} bridge(s) connected to this room.`;
  }
  // Get the bridges from the database that use this external_channel
  const bridge = await db.bridges.findFirst({
    where: {
      internal_channel: (interaction.channel as TextChannel).id,
    },
  });

  if (!bridge) {
    return noBridgeError;
  }

  if (bridge.status !== 'PAUSED') {
    return 'Error: No paused bridges found for this channel. Did you mean to use the /bridge pause command?';
  }

  await bridgeResume((interaction.channel as TextChannel).id);

  return 'Resumed bridge connected to this room.';
}

async function remove(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return 'Error: You do not have the ManageChannel permission needed to remove a bridge!';
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
      return noBridgeError;
    }

    if (confirmation !== interaction.guild?.id) {
      return stripIndents`Error: Are you sure you want to remove ${bridges.length} bridge(s) connected to this room? 
      
      If so, please use the confirmation option with your guild id.`;
    }

    await Promise.allSettled(bridges.map(bridge => bridgeRemove(bridge.external_channel)));

    return stripIndents`Removed ${bridges.length} bridge(s) connected to this room.`;
  }
  // Get the bridges from the database that use this external_channel
  const bridge = await db.bridges.findFirst({
    where: {
      internal_channel: (interaction.channel as TextChannel).id,
    },
  });

  if (!bridge) {
    return noBridgeError;
  }

  if (confirmation !== interaction.guild?.id) {
    return stripIndents`Error: Are you sure you want to remove this bridge?
    
    If so, please use the confirmation option using your guild ID as the confirmation code!`;
  }

  await bridgeRemove((interaction.channel as TextChannel).id);

  return 'Removed bridge connected to this room.';
}

async function info(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return 'Error: You do not have the ManageChannel permission needed to info a bridge!';
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    // Get the bridges from the database that use this internal_channel
    const bridges = await db.bridges.findMany({
      where: {
        internal_channel: (interaction.channel as TextChannel).id,
      },
    });

    if (bridges.length === 0) {
      return noBridgeError;
    }

    let message = stripIndents`This room is connected to ${bridges.length} other rooms:`;

    bridges.forEach(async bridge => {
      const channel = await discordClient.channels.fetch(bridge.external_channel) as TextChannel;

      message += stripIndents`
      - ${channel.guild.name} - ${channel.name}`;
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
    return noBridgeError;
  }

  const internalChannel = await discordClient.channels.fetch(bridge.internal_channel);
  const { guild } = internalChannel as TextChannel;

  return stripIndents`This room is connected to ${guild} - ${internalChannel}`;
}

export const dBridge: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setDescription('Manage the bridge between two discord channels')
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setDescription('Create a bridge between two discord channels')
      .addStringOption(option => option.setName('external_channel')
        .setDescription('Channel ID on the other guild')
        .setRequired(true))
      .addBooleanOption(option => option.setName('override')
        .setDescription('Redo an existing bridge')
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('confirm')
      .setDescription('Confirm a bridge creation between two discord channels'))
    .addSubcommand(subcommand => subcommand
      .setName('pause')
      .setDescription('Pause a bridge between two discord channels'))
    .addSubcommand(subcommand => subcommand
      .setName('resume')
      .setDescription('Resume a bridge between two discord channels'))
    .addSubcommand(subcommand => subcommand
      .setName('info')
      .setDescription('Get info on this bridge setup'))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Remove a bridge between two discord channels')
      .addStringOption(option => option.setName('confirmation')
        .setDescription('Confirmation Code'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: false });
    const embed = embedTemplate()
      .setTitle('Bridge')
      .setColor(Colors.DarkPurple);
    if (!interaction.guild || !interaction.member) {
      await interaction.editReply({
        embeds: [
          embed
            .setDescription('This command can only be used in a guild.')
            .setColor(Colors.Red),
        ],
      });
      return false;
    }

    // Check if the guild is a partner (or the home guild)
    // const guildData = await database.guilds.get(interaction.guild.id);
    const guildData = await db.discord_guilds.findFirstOrThrow({
      where: {
        id: interaction.guild.id,
      },
    });

    if (interaction.guild.id !== env.DISCORD_GUILD_ID
      && !guildData.partner
      && !guildData.supporter) {
      await interaction.editReply({
        embeds: [
          embed
            .setDescription(`This command can only be used in a partner guild!
            If you are a partner and this is an error, please contact Moonbear.
            If you are not a partner, tell Moonbear you're interested:
            This is a new system and we're still figuring out how it works.`)
            .setColor(Colors.Red),
        ],
      });
      return false;
    }

    const command = interaction.options.getSubcommand();

    if (command === 'create') {
      embed.setDescription(await create(interaction));
    } else if (command === 'confirm') {
      embed.setDescription(await confirm(interaction));
    } else if (command === 'pause') {
      embed.setDescription(await pause(interaction));
    } else if (command === 'resume') {
      embed.setDescription(await resume(interaction));
    } else if (command === 'remove') {
      embed.setDescription(await remove(interaction));
    } else if (command === 'info') {
      embed.setDescription(await info(interaction));
    }

    await interaction.editReply({
      embeds: [embed],
    });

    return true;
  },
};

export default dBridge;
