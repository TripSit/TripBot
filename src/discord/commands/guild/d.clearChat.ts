import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const clearChat: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('clear-chat')
    .setDescription('This will delete the last 100 messages!')
    .addIntegerOption((option) => option
      .setDescription('Number of messages to delete (default/max: 99)')
      .setName('count'))
    .addBooleanOption((option) => option
      .setDescription('Delete threads? (default: true)')
      .setName('delete-threads'))
    .addBooleanOption((option) => option
      .setDescription('Delete threads? (default: true)')
      .setName('delete-archived-threads')),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] started!`);
    if (!interaction.channel) {
      interaction.reply({content: 'This command can only be used in a server!', ephemeral: true});
      return false;
    }

    const count = interaction.options.getInteger('count') || 99;
    const deleteThreads = interaction.options.getBoolean('delete-threads') || true;
    const deleteArchived = interaction.options.getBoolean('delete-archived-threads') || true;

    // const count = interaction.options.getInteger('count');
    await interaction.reply({content: 'Clearing chat...', fetchReply: true})
      .then(async (msg) => {
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
    //     logger.error(`[${PREFIX}] ${err}`);
    //   }
    // }

    if (deleteThreads) {
      // Delete every thread in the channel
      const fetchedThreads = await (interaction.channel as TextChannel).threads.fetch();
      // logger.debug(`[${PREFIX}] fetchedThreads: ${JSON.stringify(fetchedThreads, null, 2)}`);
      fetchedThreads.threads.forEach(async (thread) => {
        try {
          thread.delete();
        } catch (err) {
          logger.error(`[${PREFIX}] ${err}`);
        }
      });
    }

    if (deleteArchived) {
      // Delete every archived thread in the channel
      const archivedThreads = await (interaction.channel as TextChannel).threads.fetchArchived();
      // logger.debug(`[${PREFIX}] fetchedThreads: ${JSON.stringify(archivedThreads, null, 2)}`);
      archivedThreads.threads.forEach(async (thread) => {
        try {
          thread.delete();
        } catch (err) {
          logger.error(`[${PREFIX}] ${err}`);
        }
      });
    }
    return true;
  },
};
