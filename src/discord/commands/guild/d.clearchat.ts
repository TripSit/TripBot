import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { GUILD_ONLY_TEXT } from '../../utils/guildOnly';

const F = f(__filename);

export const dClearchat: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('clear-chat')
    .setDescription('This will delete the last 100 messages!')
    .setIntegrationTypes([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option => option
      .setDescription('Number of messages to delete (default/max: 99)')
      .setName('count'))
    .addBooleanOption(option => option
      .setDescription('Delete threads? (default: true)')
      .setName('delete-threads'))
    .addBooleanOption(option => option
      .setDescription('Delete threads? (default: true)')
      .setName('delete-archived-threads')) as SlashCommandBuilder,
  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const count = interaction.options.getInteger('count') ?? 99;
    const deleteThreads = interaction.options.getBoolean('delete-threads') === true;
    const deleteArchived = interaction.options.getBoolean('delete-archived-threads') === true;

    // Deletion runs with the bot's permissions, so the caller must hold the matching permissions themselves.
    // Default member permissions only hide the command; servers can change who may run it.
    const caller = interaction.memberPermissions;
    const missing = [
      !caller?.has(PermissionFlagsBits.ManageMessages) && 'Manage Messages',
      (deleteThreads || deleteArchived) && !caller?.has(PermissionFlagsBits.ManageThreads) && 'Manage Threads',
    ].filter(Boolean);
    if (missing.length > 0) {
      await interaction.reply({
        content: `You need the ${missing.join(' and ')} permission to do that!`,
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }

    await interaction.deferReply({ });
    if (!interaction.channel) {
      await interaction.editReply({ content: GUILD_ONLY_TEXT });
      return false;
    }

    await interaction.editReply({ content: 'Clearing chat...' })
      .then(async msg => {
        await msg.delete();
      });

    await (interaction.channel as TextChannel).bulkDelete(count, true);

    // Manually delete the rest of the messages
    // const fetchedMessages = await interaction.channel.messages.fetch({limit: count});
    // // eslint-disable-next-line no-restricted-syntax
    // for (const message of fetchedMessages.values()) {
    //   try {
    //     message.delete();
    //   } catch (err) {
    //     log.error(F, `${err}`);
    //   }
    // }

    if (deleteThreads) {
      // Delete every thread in the channel
      const fetchedThreads = await (interaction.channel as TextChannel).threads.fetch();
      fetchedThreads.threads.forEach(async thread => {
        try {
          thread.delete();
        } catch (err) {
          log.error(F, `${err}`);
        }
      });
    }

    if (deleteArchived) {
      // Delete every archived thread in the channel
      const archivedThreads = await (interaction.channel as TextChannel).threads.fetchArchived();
      archivedThreads.threads.forEach(async thread => {
        try {
          thread.delete();
        } catch (err) {
          log.error(F, `${err}`);
        }
      });
    }
    return true;
  },
};

export default dClearchat;
