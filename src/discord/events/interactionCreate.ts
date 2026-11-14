// import {
//   Client,
//   Interaction,
// } from 'discord.js';
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
// import { Users } from '../../global/@types/database';
import { botBannedUsers } from '../utils/populateBotBans';
import modalSubmit from './modalSubmit';
import { getOrCreateUser } from '../../global/utils/dbRecords';
import { touchLastSeen } from '../../global/utils/lastSeen';
import { statParameters } from '../utils/commandStats';

const F = f(__filename);  // eslint-disable-line

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
      const subcommand = interaction.options.getSubcommand(false);
      const commandName = subcommand ? `${interaction.commandName} ${subcommand}` : interaction.commandName;

      // Only TripSit guild members get a user record just for using the bot; other guilds' users aren't tracked
      if (interaction.guildId === env.DISCORD_GUILD_ID) {
        touchLastSeen(await getOrCreateUser(interaction.user.id));
      }

      const commandUsage = await db.command_usage.create({
        data: {
          command: commandName,
          created_at: new Date(),
          channel_id: interaction.channel?.id ?? '0',
          guild_id: interaction.guild?.id ?? null,
        },
      });

      // Now create the parameters linked to the command_usage entry. Values are stripped to what stats need.
      const parameterEntries = statParameters(interaction.options.data)
        .map(param => ({ ...param, usage_id: commandUsage.id }));

      // Create the parameters in the database
      await db.command_usage_parameter.createMany({
        data: parameterEntries,
      });

      return;
    }

    if (interaction.type === InteractionType.ApplicationCommand
      // Right click command
      && interaction.isContextMenuCommand()) {
      // log.debug(F, `interaction.isContextMenuCommand(): ${interaction.isContextMenuCommand()}`);
      commandRun(interaction, discordClient);
      return;
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      autocomplete(interaction);
      return;
    }

    if (interaction.type === InteractionType.MessageComponent) {
      if (interaction.isContextMenuCommand()) {
        commandRun(interaction, discordClient);
        return;
      }
      if (interaction.isAnySelectMenu()) {
        selectMenu(interaction);
        return;
      }
      if (interaction.isButton()) {
        buttonClick(interaction, discordClient);
      }
      // log.debug(F, `Unknown interaction!`);
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      modalSubmit(interaction);
    }
  },
};

export default interactionCreate;
