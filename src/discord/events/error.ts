import {
  Colors,
  EmbedBuilder,
  TextChannel,
  DiscordAPIError,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
  MessageFlags,
} from 'discord.js';
// import * as Sentry from '@sentry/node';
import { ErrorEvent } from '../@types/eventDef';
import commandContext from '../utils/context';
import { describeError } from '../../global/utils/networkErrors';
import { ReportLimiter, withTimeout } from '../../global/utils/errorReporter';

const F = f(__filename);

const error10062 = 'Error 10062: (Unknown Interaction Error)[https://github.com/discord/discord-api-docs/issues/5558] for details'; // eslint-disable-line max-len
const dataSensitiveCommands = [
  'idose',
  'moderate',
  'report',
];

const reportLimiter = new ReportLimiter();
const REPORT_TIMEOUT_MS = 10_000;

/** Posts to the bot-errors channel. Throws on failure; the caller catches. */
async function reportToChannel(
  errorData: unknown,
  errorStack: string,
  embed: EmbedBuilder,
  commandName?: string,
  interaction?: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
) {
  const channel = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;

  // If the error is a 10062, we know it's a Discord API error, to kind of ignore it =/
  if ((errorData as DiscordAPIError).code === 10062) { // eslint-disable-line @typescript-eslint/no-explicit-any
    await channel.send({ embeds: [embed.setDescription(error10062)] });
    return true;
  }

  // Get the role we want to ping
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const role = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
  let message = `\`\`\`${errorStack}\`\`\``;
  if (interaction && commandName) {
    const context = dataSensitiveCommands.includes(commandName) ? '' : await commandContext(interaction);
    message = `**Error running /${commandName} ${context}${message}`;
  }

  // Alert the developers
  await channel.send({ content: `${role}`, embeds: [embed.setDescription(message)] });
  return false;
}

async function handleErrorUnsafe(
  errorData: Error | DiscordAPIError | unknown,
  commandName?: string,
  interaction?: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
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
    // Network errors carry the addresses tried and the real reason in their cause chain
    if (errorData.cause) errorStack += `\nCause: ${describeError(errorData.cause)}`;
  } else {
    // DiscordAPIError extends Error, so it was handled above
    log.debug(F, 'Error is not an instance of Error');
    errorStack = JSON.stringify(errorData, null, 2);
  }

  // Log the error locally
  log.error(F, `${errorStack}`);

  // Construct the embed
  const embed = new EmbedBuilder()
    .setColor(Colors.Red);

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
    if (!global.discordClient?.isReady()) {
      log.warn(F, 'Discord is not ready, not reporting the error to the bot-errors channel');
    } else if (!reportLimiter.allow(errorStack)) {
      log.debug(F, 'Error report suppressed by the rate limiter');
    } else {
      try {
        const wasIgnorable = await withTimeout(
          reportToChannel(errorData, errorStack, embed, commandName, interaction),
          REPORT_TIMEOUT_MS,
          'Reporting the error to Discord',
        );
        if (wasIgnorable) return;
      } catch (err) {
        console.error('Could not report the error to Discord:', err); // eslint-disable-line no-console
      }
    }
  }

  if (interaction) {
    const errorMessage = env.NODE_ENV === 'production'
      ? `There was an error while executing this command!

    The developers have been alerted, you can try again with new parameters maybe?`
      : errorStack;

    embed.setDescription(errorMessage);

    // Respond to the user. We don't know how this command was invoked, so we need to check and respond accordingly
    try {
      if (!interaction.replied) {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
      } else {
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Could not answer the interaction with the error:', err); // eslint-disable-line no-console
    }
  }
}

/**
 * Logs an error, reports it to Discord and answers the user. It never throws: it also runs from the
 * unhandledRejection/uncaughtException handlers, and when Discord is unreachable the report itself fails.
 */
export default async function handleError(
  errorData: Error | DiscordAPIError | unknown,
  commandName?: string,
  interaction?: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
) {
  try {
    await handleErrorUnsafe(errorData, commandName, interaction);
  } catch (err) {
    console.error('handleError failed:', err); // eslint-disable-line no-console
  }
}

export const error: ErrorEvent = {
  name: 'error',
  async execute(errorObj) {
    await handleError(errorObj);
  },
};

process.on('unhandledRejection', async (errorData: Error) => {
  await handleError(errorData);
});

process.on('uncaughtException', async (errorData: Error) => {
  await handleError(errorData);
});
