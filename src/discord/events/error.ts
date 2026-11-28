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
import { ErrorEvent } from '../@types/eventDef';
import commandContext from '../utils/context';
import { dataSensitiveCommands } from '../utils/commandStats';
import { describeError } from '../../global/utils/networkErrors';
import { ReportLimiter, withTimeout } from '../../global/utils/errorReporter';
import fileErrorIssue from '../../global/utils/errorIssue';

const F = f(__filename);

type ErrorInteraction = ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction;

const error10062 = 'Error 10062: (Unknown Interaction Error)[https://github.com/discord/discord-api-docs/issues/5558] for details'; // eslint-disable-line max-len
const reportLimiter = new ReportLimiter();
const REPORT_TIMEOUT_MS = 10_000;
// Embed descriptions are capped at 4096 characters; leave room for the code fence and command context
const MAX_REPORTED_STACK = 3500;

/** Posts to the bot-errors channel. Throws on failure; the caller catches. */
async function reportToChannel(
  errorData: unknown,
  errorStack: string,
  embed: EmbedBuilder,
  commandName?: string,
  interaction?: ErrorInteraction,
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
  const reportedStack = errorStack.length > MAX_REPORTED_STACK
    ? `${errorStack.slice(0, MAX_REPORTED_STACK)}\n... (truncated, see the bot logs)`
    : errorStack;
  let message = `\`\`\`${reportedStack}\`\`\``;
  if (interaction && commandName) {
    const context = dataSensitiveCommands.includes(commandName) ? '' : await commandContext(interaction);
    message = `**Error running /${commandName} ${context}${message}`;
  }

  // Alert the developers
  await channel.send({ content: `${role}`, embeds: [embed.setDescription(message)] });
  return false;
}

function buildErrorStack(errorData: unknown): string {
  if (errorData instanceof Error) {
    log.debug(F, 'Error is an instance of Error');

    let errorStack = errorData.stack ?? JSON.stringify(errorData, null, 2);
    // Network errors carry the addresses tried and the real reason in their cause chain
    if (errorData.cause) errorStack += `\nCause: ${describeError(errorData.cause)}`;
    return errorStack;
  }
  // DiscordAPIError extends Error, so it was handled above
  log.debug(F, 'Error is not an instance of Error');
  return JSON.stringify(errorData, null, 2);
}

/** Sends the error to the bot-errors channel in production. Returns true when the error was ignorable. */
async function reportInProduction(
  errorData: unknown,
  errorStack: string,
  embed: EmbedBuilder,
  commandName?: string,
  interaction?: ErrorInteraction,
): Promise<boolean> {
  if (!global.discordClient?.isReady()) {
    log.warn(F, 'Discord is not ready, not reporting the error to the bot-errors channel');
    return false;
  }
  if (!reportLimiter.allow(errorStack)) {
    log.debug(F, 'Error report suppressed by the rate limiter');
    return false;
  }
  try {
    return await withTimeout(
      reportToChannel(errorData, errorStack, embed, commandName, interaction),
      REPORT_TIMEOUT_MS,
      'Reporting the error to Discord',
    );
  } catch (err) {
    console.error('Could not report the error to Discord:', err); // eslint-disable-line no-console
    return false;
  }
}

// Respond to the user. We don't know how this command was invoked, so we need to check and respond accordingly
async function answerInteraction(interaction: ErrorInteraction, embed: EmbedBuilder, errorStack: string) {
  const errorMessage = env.NODE_ENV === 'production'
    ? `There was an error while executing this command!

    The developers have been alerted, you can try again with new parameters maybe?`
    : errorStack;

  embed.setDescription(errorMessage);

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    console.error('Could not answer the interaction with the error:', err); // eslint-disable-line no-console
  }
}

async function handleErrorUnsafe(
  errorData: unknown,
  commandName?: string,
  interaction?: ErrorInteraction,
) {
  Error.stackTraceLimit = 50;
  const errorStack = buildErrorStack(errorData);

  // Log the error locally
  log.error(F, `${errorStack}`);

  // Construct the embed
  const embed = new EmbedBuilder()
    .setColor(Colors.Red);

  // If this is production, send a message to the channel and alert the developers
  if (env.NODE_ENV === 'production') {
    // Track it on GitHub too; runs in parallel and never throws
    fileErrorIssue(errorData, errorStack, commandName).catch(() => undefined);
    const wasIgnorable = await reportInProduction(errorData, errorStack, embed, commandName, interaction);
    if (wasIgnorable) return;
  }

  if (interaction) {
    await answerInteraction(interaction, embed, errorStack);
  }
}

/**
 * Logs an error, reports it to Discord and answers the user. It never throws: it also runs from the
 * unhandledRejection handler, and when Discord is unreachable the report itself fails.
 */
export default async function handleError(
  errorData: unknown,
  commandName?: string,
  interaction?: ErrorInteraction,
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

// Leave uncaughtException unhandled: Node prints the fatal stack and exits nonzero so PM2 can restart the bot.
// Awaiting an asynchronous report here would suppress that exit and keep an unsafe process running.
