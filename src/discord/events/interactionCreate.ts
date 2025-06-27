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
import { buttonClick } from './buttonClick';
import { selectMenu } from './selectMenu';
import { autocomplete } from './autocomplete';
// import { Users } from '../../global/@types/database';
import { botBannedUsers } from '../utils/populateBotBans';

const F = f(__filename);  // eslint-disable-line

export const interactionCreate: InteractionCreateEvent = {
  name: 'interactionCreate',
  async execute(interaction) {
    // const startTime = new Date().getTime();
    // log.info(F, `interactionCreate event started at ${startTime}`);

    // Don't run anything if the interaction is from a bot
    if (interaction.user.bot) return;

    // See if the user exists in botBannedUsers
    // log.debug(F, `botBannedUsers: ${JSON.stringify(botBannedUsers, null, 2)}`);
    if (botBannedUsers.includes(interaction.user.id)) {
      // log.info(F, `Got user ban status in ${new Date().getTime() - startTime}ms`);
      if (interaction.isRepliable()) {
        await interaction.reply({ content: '*beeps sadly*', flags: MessageFlags.Ephemeral });
      }
      return;
    }
    // log.info(F, `Got user ban status in ${new Date().getTime() - startTime}ms`);

    // if (await db<Users>('users')
    //   .select(db.ref('id').as('id'))
    //   .where('discord_id', interaction.user.id)
    //   .andWhere('discord_bot_ban', true)
    //   .first()) {
    //   if (interaction.isRepliable()) {
    //     await interaction.reply({ content: '*beeps sadly*' });
    //   }
    //   return;
    // }
    // log.info(F, `Got user ban status in ${new Date().getTime() - startTime}ms`);

    // const newStartTime = new Date().getTime();
    // const userData = await getUser(interaction.user.id, null);
    // if (userData && userData.discord_bot_ban) {
    //   if (interaction.isRepliable()) {
    //     await interaction.reply({ content: '*beeps sadly*' });
    //   }
    //   return;
    // }
    // log.debug(F, `(Legacy) Got user ban status in ${new Date().getTime() - newStartTime}ms`);

    // Determine how long it took to get the banned status from the start time
    // log.debug(F, `interaction: ${JSON.stringify(interaction, null, 2)}`);
    // log.debug(F, `interaction: ${JSON.stringify(interaction)}`);
    // log.debug(F, `interaction: ${interaction}`);
    // log.debug(F, `typeof interaction: ${typeof interaction}`);
    // log.debug(F, `interaction.type: ${interaction.type}`);

    if (interaction.isChatInputCommand()) {
      // Slash command
      // log.debug(F, `Interaction isChatInputCommand!`);
      // log.info(F, `Decided to run slash command in ${new Date().getTime() - startTime}ms`);
      commandRun(interaction, discordClient);
      const subcommand = interaction.options.getSubcommand(false);
      const commandName = subcommand ? `${interaction.commandName} ${subcommand}` : interaction.commandName;

      // Get all options passed to the command
      const options = interaction.options.data;

      await db.users.upsert({
        where: { discord_id: interaction.user.id },
        update: {},
        create: {
          discord_id: interaction.user.id,
        },
      });

      const commandUsage = await db.command_usage.create({
        data: {
          command: commandName,
          created_at: new Date(),
          channel_id: interaction.channel?.id ?? '0',
          guild_id: interaction.guild?.id ?? null,
        },
      });

      // Now create the parameters linked to the command_usage entry
      const parameterEntries = options
        .filter(opt => opt.name !== subcommand) // optional: skip subcommand if already part of the command name
        .map(opt => ({
          name: opt.name,
          value: String(opt.value ?? ''), // Prisma expects string
          usage_id: commandUsage.id, // Use the command_usage ID to link to command_parameters
        }));

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
  },
};

export default interactionCreate;
