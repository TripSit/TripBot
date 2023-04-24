import {
  Colors,
  EmbedBuilder,
  TextChannel,
  DiscordAPIError,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import { ErrorEvent } from '../@types/eventDef';

const F = f(__filename);

const error10062 = 'Error 10062: (Unknown Interaction Error)[https://github.com/discord/discord-api-docs/issues/5558] for details'; // eslint-disable-line max-len
const dataSensitiveCommands = [
  'idose',
  'moderate',
  'report',
];

export default async function handleError(
  errorData: Error | DiscordAPIError | unknown,
  commandName?: string,
  interaction?: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
) {
  Error.stackTraceLimit = 50;
  let errorStack = '';

  if (errorData instanceof Error) {
    errorStack = errorData.stack || JSON.stringify(errorData, null, 2);
  } else {
    errorStack = JSON.stringify(errorData, null, 2);
  }

  // Log the error locally
  log.error(F, `${errorStack}`);

  // Construct the embed
  const embed = new EmbedBuilder()
    .setColor(Colors.Red);

  // If this is production, send a message to the channel and alert the developers
  if (env.NODE_ENV === 'production') {
    if (interaction) {
      sentry.captureException(errorData, {
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
      sentry.captureException(errorData);
    }

    // Get channel we send errors to
    const channel = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;

    // If the error is a 10062, we know it's a Discord API error, to kind of ignore it =/
    if ((errorData as DiscordAPIError).code === 10062) { // eslint-disable-line @typescript-eslint/no-explicit-any
      await channel.send({
        embeds: [
          embed.setDescription(error10062), // eslint-disable-line max-len
        ],
      });
      return;
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
    await channel.send({
      content: `${role}`,
      embeds: [
        embed.setDescription(message),
      ],
    });
  }

  if (interaction) {
    const errorMessage = env.NODE_ENV === 'production'
      ? `There was an error while executing this command!

    The developers have been alerted, you can try again with new parameters maybe?`
      : errorStack;

    embed.setDescription(errorMessage);

    // Respond to the user. We don't know how this command was invoked, so we need to check and respond accordingly
    if (!interaction.replied) {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
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
