import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionUpdateOptions,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  Snowflake,
  TextChannel,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
// import { stats } from '../../../global/commands/g.stats';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';

const F = f(__filename);

// A dictionary using channelIDs as the key, and an array of messageIDs as the value
type MessageDict = {
  [key: string]: string[];
};

async function getMessages(
  interaction: ChatInputCommandInteraction | UserSelectMenuInteraction | ButtonInteraction,
  selectedUser: Snowflake,
):Promise<MessageDict> {
  // Get all the messages this user has sent in the guild in the past two weeks
  log.debug(F, `InteractionId:  ${interaction.id}`);

  const messageData = {} as MessageDict;

  // Get all the channels in the guild
  const channels = await interaction.guild?.channels.fetch();
  if (!channels) return messageData;

  // Get all the messages in each channel
  await Promise.all(
    channels.map(async channel => {
      if (!channel) return;
      if (channel.type === ChannelType.GuildText) {
        const messages = await channel.messages.fetch();
        const memberMessages = messages.filter(message => message.author.id === selectedUser);
        if (memberMessages.size > 0) {
          messageData[channel.id] = memberMessages.map(message => message.id);
        }
      }
    }),
  );

  // log.debug(F, `messageData: ${JSON.stringify(messageData, null, 2)}`);
  return messageData;
}

async function deleteMessages(
  interaction: ButtonInteraction,
):Promise<void> {
  // Get messages
  const messageData = await getMessages(interaction, interaction.customId.split('~')[2]);

  // Delete all the messages
  await Promise.all(
    Object.entries(messageData).map(async ([channel, messages]) => {
      log.debug(F, `Deleting messages in channel ${channel}`);
      // Wait for all message deletions in this channel to complete
      await Promise.all(
        Object.values(messages).map(async message => {
          log.debug(F, `Deleting message ${message} in channel ${channel}`);
          await (interaction.guild?.channels.cache.get(channel) as TextChannel).messages.delete(message);
        }),
      );
    }),
  );
}

async function purgeMessagesPage(
  interaction: ChatInputCommandInteraction | UserSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, `purge messages ${interaction.id}`);

  let selectedUser = interaction.user.id;

  if (interaction.isUserSelectMenu()) {
    // Get the ID of the select menu
    log.debug(F, `interaction.customId: ${interaction.customId}`);

    if (interaction.customId === 'purge~user') {
      [selectedUser] = interaction.values;
      log.debug(F, `selectedUser: ${selectedUser}`);
    }
  }
  log.debug(F, `selectedUser: ${selectedUser}`);

  // We have this second page so that the loading of messages only happens if the user is sure they want to purge
  const messages = await getMessages(interaction, selectedUser);

  let explanation = stripIndents`Discord allows bots to remove up to 14 days worth of messages from the server. 
    For messages older than 14 days, you will need to remove them manually.
    This tool takes some time to run, so please be patient.
    This action is irreversible, so please be careful.
    This will not remove extra data from our database, only discord messages.
    If you want to delete your data from our database, use the \`/privacy\` command.
  
    **I will delete ${Object.values(messages).flat().length} messages in ${Object.keys(messages).length} channels**.
    
    If you're sure, click the below button and we'll gather all your messages for deletion.`;

  // Check if the user who did the interaction has the permission to manage messages
  const components:ActionRowBuilder<UserSelectMenuBuilder | ButtonBuilder>[] = [
    new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setLabel('Start the purge!')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
        .setCustomId(`purge~confirm~${selectedUser}`),
    ]),
  ];

  // Only add the user select menu if the user has the permission to manage messages
  if ((interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageMessages)) {
    components.push(
      new ActionRowBuilder<UserSelectMenuBuilder>().addComponents([
        new UserSelectMenuBuilder()
          .setCustomId('purge~user')
          .setDefaultUsers([interaction.user.id]),
      ]),
    );
    explanation += '\n\n';
    explanation += stripIndents`
    **Moderators: If you want to delete someone else\'s messages, use the dropdown.**
    This menu is only visible to those with the Manage Messages permission on your guild.`;
  }

  return {
    embeds: [
      embedTemplate()
        .setTitle('So you wanna purge some messages?')
        .setDescription(explanation),
    ],
    components,
  };
}

async function purgeConfirmedPage(
  interaction: ButtonInteraction,
):Promise<InteractionUpdateOptions> {
  log.debug(F, `purge confirm ${interaction.id}`);

  await interaction.update({
    embeds: [
      embedTemplate()
        .setTitle('Purge Deletion')
        .setDescription('Please hold while I delete in your messages. This may take a while.'),
    ],
    components: [],
  });

  await deleteMessages(interaction);

  return {
    embeds: [
      embedTemplate()
        .setTitle('Purge Done')
        .setDescription(stripIndents`I've deleted your messages!`),
    ],
    components: [],
  };
}

export async function purgeButton(
  interaction: ButtonInteraction,
) {
  log.info(F, await commandContext(interaction));
  const button = interaction.customId.split('~')[1];
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (button) {
    case 'confirm': {
      await interaction.editReply(await purgeConfirmedPage(interaction));
      break;
    }
    default:
      log.error(F, `This shouldn't have happened: ${interaction.customId}`);
      break;
  }
}

export async function purgeMenu(
  interaction: UserSelectMenuInteraction,
) {
  log.info(F, await commandContext(interaction));
  const menu = interaction.customId.split('~')[1];
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (menu) {
    case 'user': {
      await interaction.update(await purgeMessagesPage(interaction));
      break;
    }
    default:
      log.error(F, `This shouldn't have happened: ${interaction.customId}`);
      break;
  }
}

export const dPurge: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Purge messages from the server.')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('messages')
      .setDescription('Purge messages from the server')
      .addBooleanOption(option => option.setName('private')
        .setDescription('Set to "True" to show the response only to you'))),
  async execute(interaction) {
    if (!interaction.channel) return false;
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    const command = interaction.options.getSubcommand() as 'messages';
    // By default we want to make the reply private
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (command) {
      case 'messages': {
        if (interaction.deferred) {
          await interaction.editReply(await purgeMessagesPage(interaction));
        } else {
          await interaction.reply(await purgeMessagesPage(interaction) as InteractionReplyOptions);
        }
        return true;
      }
      default: {
        log.debug(F, `default ${command}`);
        await interaction.editReply(await purgeMessagesPage(interaction));
        return true;
      }
    }
  },
};

export default dPurge;
