import type {
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  TextChannel,
  UserContextMenuCommandInteraction,
} from 'discord.js';

import { Colors, DiscordAPIError, EmbedBuilder, MessageFlags } from 'discord.js';

// import * as Sentry from '@sentry/node';
import type { ErrorEvent } from '../@types/eventDef';

const F = f(__filename);

const error10062 =
  'Error 10062: (Unknown Interaction Error)[https://github.com/discord/discord-api-docs/issues/5558] for details';
const dataSensitiveCommands = new Set(['idose', 'moderate', 'report']);

export default async function handleError(
  errorData: DiscordAPIError | Error | unknown,
  commandName?: string,
  interaction?:
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction
    | UserContextMenuCommandInteraction,
) {
  Error.stackTraceLimit = 50;
  let errorStack = '';

  if (errorData instanceof Error) {
    log.debug(F, 'Error is an instance of Error');
    // log.debug(F, `Error: ${JSON.stringify(errorData, null, 2)}`); // eslint-disable-line no-console
    // log.debug(F, `Error stack: ${JSON.stringify(errorData.stack, null, 2)}`); // eslint-disable-line no-console
    // log.debug(F, `Error message: ${JSON.stringify(errorData.message, null, 2)}`); // eslint-disable-line no-console
    // log.debug(F, `Error cause: ${JSON.stringify(errorData.cause, null, 2)}`); // eslint-disable-line no-console
    // log.debug(F, `Error name: ${JSON.stringify(errorData.name, null, 2)}`); // eslint-disable-line no-console

    errorStack = errorData.stack ?? JSON.stringify(errorData, null, 2);
  } else if (errorData instanceof DiscordAPIError) {
    log.debug(F, 'Error is an instance of DiscordAPIError');
    errorStack = JSON.stringify(errorData, null, 2);
  } else {
    log.debug(F, 'Error is not an instance of Error or DiscordAPIError');
    errorStack = JSON.stringify(errorData, null, 2);
  }

  // Log the error locally
  log.error(F, errorStack);

  // Construct the embed
  const embed = new EmbedBuilder().setColor(Colors.Red);

  // If this is production, send a message to the channel and alert the developers
  if (env.NODE_ENV === 'production') {
    /* Uncomment this if you want to use Sentry

    if (interaction) {
      log.debug(F, 'Interaction found, sending error to Sentry');
      Sentry.captureException(errorData, {
        tags: {
          command: commandName,
          context: await commandContext(interaction),
        },
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
      });
    } else {
      log.debug(F, 'No interaction, sending error to Sentry');
      Sentry.captureException(errorData);
    } */
    if (interaction) {
      log.debug(F, 'Interaction found, sending error to rollbar');
      globalThis.rollbar.error(errorStack, {
        tags: {
          command: commandName,
          context: await commandContext(interaction),
        },
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
      });
    } else {
      log.debug(F, 'No interaction, sending error to rollbar');
      globalThis.rollbar.error(errorStack);
    }

    // Get channel we send errors to
    const channel = (await discordClient.channels.fetch(env.CHANNEL_BOTERRORS)) as TextChannel;

    // If the error is a 10062, we know it's a Discord API error, to kind of ignore it =/
    if ((errorData as DiscordAPIError).code === 10_062) {
      await channel.send({
        embeds: [embed.setDescription(error10062)],
      });
      return;
    }

    // Get the role we want to ping
    const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
    const role = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
    let message = `\`\`\`${errorStack}\`\`\``;
    if (interaction && commandName) {
      const context = dataSensitiveCommands.has(commandName)
        ? ''
        : await commandContext(interaction);
      message = `**Error running /${commandName} ${context}${message}`;
    }

    // Alert the developers
    await channel.send({
      content: `${role}`,
      embeds: [embed.setDescription(message)],
    });
  }

  if (interaction) {
    const errorMessage =
      env.NODE_ENV === 'production'
        ? `There was an error while executing this command!

    The developers have been alerted, you can try again with new parameters maybe?`
        : errorStack;

    embed.setDescription(errorMessage);

    // Respond to the user. We don't know how this command was invoked, so we need to check and respond accordingly
    if (interaction.replied) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await (interaction.deferred
        ? interaction.editReply({ embeds: [embed] })
        : interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral }));
    }
  }
}

export const error: ErrorEvent = {
  async execute(errorObject) {
    await handleError(errorObject);
  },
  name: 'error',
};

process.on('unhandledRejection', async (errorData: Error) => {
  await handleError(errorData);
});

process.on('uncaughtException', async (errorData: Error) => {
  await handleError(errorData);
});
