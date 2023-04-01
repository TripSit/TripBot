/* eslint-disable*/
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ModalSubmitInteraction,
  TextChannel,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  InteractionEditReplyOptions,
  PermissionResolvable,
  GuildMember,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { bridgeConfirm, bridgeCreate, bridgePause, bridgeRemove, bridgeResume } from '../../../global/commands/g.bridge';
import { startLog } from '../../utils/startLog';
import { getUser } from '../../../global/utils/knex';
import { checkChannelPermissions } from '../../utils/checkPermissions';
import { stripIndents } from 'common-tags';

export default dBridge;

const F = f(__filename);

export const dBridge: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setDescription('Manage the bridge between two discord channels')
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setDescription('Create a bridge between two discord channels')
      .addChannelOption(option => option.setName('internal_channel')
        .setDescription('Channel on TripSit')
        .setRequired(true))
      .addStringOption(option => option.setName('external_channel')
        .setDescription('Channel ID on the other guild')
        .setRequired(true))
      .addBooleanOption(option => option.setName('override')
        .setDescription('Redo and existing bridge')
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('confirm')
      .setDescription('Confirm a bridge creation between two discord channels'))
      // .addChannelOption(option => option.setName('external_channel')
      //   .setDescription('Channel on your guild')
      //   .setRequired(true)))
      // .addStringOption(option => option.setName('internal_channel')
      //   .setDescription('Channel ID on TripSit')
      //   .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('pause')
      .setDescription('Pause a bridge between two discord channels')
      .addChannelOption(option => option.setName('channel')
        .setDescription('Channel on your guild')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('resume')
      .setDescription('Resume a bridge between two discord channels')
      .addChannelOption(option => option.setName('chanel')
        .setDescription('Channel on your guild')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Remove a bridge between two discord channels')
      .addChannelOption(option => option.setName('channel')
        .setDescription('Channel on your guild')
        .setRequired(true))),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: true });
    const embed = embedTemplate()
      .setTitle('Bridge')
      .setColor(Colors.DarkPurple);
    if (!interaction.guild || !interaction.member) {
      await interaction.editReply({
        embeds: [
          embed
            .setDescription('This command can only be used in a guild.')
            .setColor(Colors.Red)
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
      embed.setDescription(await bridgePause(interaction));
    } else if (command === 'resume') {
      embed.setDescription(await bridgeResume(interaction));
    } else if (command === 'remove') {
      embed.setDescription(await bridgeRemove(interaction));
    }

    await interaction.editReply({
      embeds: [embed],
    });

    return true;
  },
};

async function create(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return 'Error: You do not have the ManageChannel permission needed to create a bridge!';
  }

  if (interaction.guild?.id !== env.DISCORD_GUILD_ID) {
    return `Error: This command can only be used in the TripSit Discord server.
    You likely want to use the /bridge confirm command instead!`;
  }

  const internalChannel = interaction.options.getChannel('internal_channel', true);
  if (!(internalChannel instanceof TextChannel)) {
    return 'Error: Internal channel is not a text channel.';
  }

  const internalChannelPerms = await checkChannelPermissions(internalChannel, [
    'ManageWebhooks' as PermissionResolvable,
  ])
  if (!internalChannelPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${internalChannelPerms.permission} in ${internalChannel.guild.name}'s ${internalChannel}!`);
    return stripIndents`Error: Missing ${internalChannelPerms.permission} permission in ${internalChannel.guild.name}'s ${internalChannel}!
    Manage Webhooks - Create the channel webhook
    `;
  }

  const externalChannelId = interaction.options.getString('external_channel', true);

  // Do a check to make sure the external ID is a series of number
  if (!/^\d+$/.test(externalChannelId)) {
    return 'Error: External channel ID is not a number!';
  }

  const externalChannel = await interaction.client.channels.fetch(externalChannelId);
  if (!(externalChannel instanceof TextChannel)) {
    return 'Error: External channel is not a text channel.';
  }

  const externalChannelPerms = await checkChannelPermissions(externalChannel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'ManageWebhooks' as PermissionResolvable,
  ])
  if (!externalChannelPerms.hasPermission) {
    return stripIndents`Error: Missing ${externalChannelPerms.permission} permission in ${externalChannel.guild.name}'s ${externalChannel}!
    
    Ask the collaborator to make sure the bot has the right permissions:
    View Channel - To see the channel
    Send Messages - To send a message to the other guild
    Manage Webhooks - To create the channel webhook
    `;
  }

  // Done with all checks, start doing stuff!

  // Check if a webhook already exists with the name 'TripSit Bridge'
  const existingWebhook = await internalChannel.fetchWebhooks()
    .then(webhooks => webhooks.find(webhook => webhook.name === 'TripSit Bridge'))
    .catch(() => undefined);

  log.debug(F, `Existing webhook: ${existingWebhook?.name} (${existingWebhook?.id})`);

  // If so, use that, otherwise create a new one
  const internalWebhook = existingWebhook ?? await internalChannel.createWebhook({
    name: 'TripSit Bridge',
    avatar: interaction.client.user?.displayAvatarURL(),
    reason: 'TripSit Bridge'
  });

  const bridgeInitialized = await bridgeCreate(
    internalChannel.id,
    internalWebhook.url,
    externalChannel.guild.id,
    externalChannel.id,
    false,
  )
  if (bridgeInitialized.startsWith('Error')) {
    return bridgeInitialized;
  }

  externalChannel.send({
    content: `${(interaction.member as GuildMember).displayName} has been requested a bridge between ${internalChannel.guild.name}'s ${internalChannel} and ${externalChannel.guild.name}'s ${externalChannel}!
    If you want to accept this bridge, please use the **/bridge confirm** command here.
    If this is not expected you can ignore this as it may be a mistake.
    If this command is being abused please talk to Moonbear on TripSit's Discord guild.`,
  });        

  return`Initializing bridge between ${internalChannel.guild.name}'s ${internalChannel} and ${externalChannel.guild.name}'s ${externalChannel}!
  I've prompted the other guild to confirm the bridge. If they do not confirm within 5 minutes, the bridge will be cancelled.`;

}

async function confirm(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  // Check if the member doing this command has permissions to make channels
  if (!(interaction.member as GuildMember).permissions.has('ManageChannels' as PermissionResolvable)) {
    return 'Error: You do not have the ManageChannel permission needed to create a bridge!';
  }

  if (interaction.guild?.id === env.DISCORD_GUILD_ID) {
    return `Error: This command can only be used outside the TripSit Discord server.
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
  //   return stripIndents`Error: Missing ${externalChannelPerms.permission} permission in ${externalChannel.guild.name}'s ${externalChannel}!
    
  //   Ask the collaborator to make sure the bot has the right permissions:
  //   View Channel - To see the channel
  //   Send Messages - To send a message to the other guild
  //   Manage Webhooks - To create the channel webhook
  //   `;
  // }
  
  // Checks were already done in the other script, so we can just assume it's fine

  const externalChannel = interaction.channel as TextChannel;

  // Check if a webhook already exists with the name 'TripSit Bridge'
  const existingWebhook = await externalChannel.fetchWebhooks()
    .then(webhooks => webhooks.find(webhook => webhook.name === 'TripSit Bridge'))
    .catch(() => undefined);

  log.debug(F, `Existing webhook: ${existingWebhook?.name} (${existingWebhook?.id})`);

  // If so, use that, otherwise create a new one
  const externalWebhook = existingWebhook ?? await externalChannel.createWebhook({
    name: 'TripSit Bridge',
    avatar: interaction.client.user?.displayAvatarURL(),
    reason: 'TripSit Bridge'
  });

  const bridgedChannel = await bridgeConfirm(
    externalChannel.guild.id,
    externalChannel.id,
    externalWebhook.url,
  )

  if (bridgedChannel.startsWith('Error')) {
    return bridgedChannel;
  }

  const internalChannel = await interaction.client.channels.fetch(bridgedChannel) as TextChannel;

  internalChannel.send({
    content: stripIndents`${(interaction.member as GuildMember).displayName} has confirmed the bridge between ${internalChannel.guild.name}'s ${internalChannel} and ${externalChannel.guild.name}'s ${externalChannel}!
    Either side can */bridge pause* and */bridge resume* to temporarily pause/resume the bridge, or */bridge delete* to remove the bridge.
    This is the start of something beautiful, say hi!
    `,
  });   

  return stripIndents`${(interaction.member as GuildMember).displayName} has confirmed the bridge between ${externalChannel.guild.name}'s ${externalChannel} and ${internalChannel.guild.name}'s ${internalChannel}!
  This is the start of something beautiful, say hi!
  `;

};