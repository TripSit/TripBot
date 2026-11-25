import { ChatInputCommandInteraction, MessageComponentInteraction } from 'discord.js';
import {
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10';
import {
  InteractionCreateEvent,
} from '../@types/eventDef';
import { commandRun } from '../utils/commandRun';
import { autocomplete } from './autocomplete';
import { buttonClick } from './buttonClick';
import { selectMenu } from './selectMenu';
import { botBannedUsers } from '../utils/populateBotBans';
import { getOrCreateUser } from '../../global/utils/dbRecords';
import { touchLastSeen } from '../../global/utils/lastSeen';
import { dataSensitiveCommands } from '../utils/commandStats';

const F = f(__filename);  // eslint-disable-line

async function recordCommandUsage(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand(false);
  const commandName = subcommand ? `${interaction.commandName} ${subcommand}` : interaction.commandName;

  // Only TripSit guild members get a user record just for using the bot; other guilds' users aren't tracked
  // Privacy deletion runs concurrently with accounting; never recreate the account it is removing.
  const deletingProfile = interaction.commandName === 'privacy' && subcommand === 'delete';
  if (interaction.guildId === env.DISCORD_GUILD_ID && !deletingProfile) {
    touchLastSeen(await getOrCreateUser(interaction.user.id));
  }

  // Personal doses, moderation and reports are never kept, not even as stats.
  if (dataSensitiveCommands.includes(interaction.commandName)) return;

  // Usage stats must never break the command that already ran.
  try {
    const usedAt = new Date();
    await db.command_usage.upsert({
      where: { command: commandName },
      create: { command: commandName, usage_count: 1, last_used_at: usedAt },
      update: { usage_count: { increment: 1 }, last_used_at: usedAt },
    });
  } catch (error) {
    log.error(F, `Failed to record command usage: ${error}`);
  }
}

function routeComponent(interaction: MessageComponentInteraction): void {
  if (interaction.isContextMenuCommand()) {
    commandRun(interaction, discordClient);
  } else if (interaction.isAnySelectMenu()) {
    selectMenu(interaction);
  } else if (interaction.isButton()) {
    buttonClick(interaction, discordClient);
  }
}

export const interactionCreate: InteractionCreateEvent = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Don't run anything if the interaction is from a bot
    if (interaction.user.bot) return;

    // See if the user exists in botBannedUsers
    // log.debug(F, `botBannedUsers: ${JSON.stringify(botBannedUsers, null, 2)}`);
    if (botBannedUsers.includes(interaction.user.id)) {
      if (interaction.isRepliable()) {
        await interaction.reply({ content: '*beeps sadly*', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      // Slash command
      // log.debug(F, `Interaction isChatInputCommand!`);
      // log.info(F, `Decided to run slash command in ${new Date().getTime() - startTime}ms`);
      commandRun(interaction, discordClient);
      await recordCommandUsage(interaction);

      return;
    }

    if (interaction.type === InteractionType.ApplicationCommand
      // Right click command
      && interaction.isContextMenuCommand()) {
      commandRun(interaction, discordClient);
      return;
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      autocomplete(interaction);
      return;
    }

    if (interaction.type === InteractionType.MessageComponent) {
      routeComponent(interaction);
    }
  },
};

export default interactionCreate;
