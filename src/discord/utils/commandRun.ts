import {
  Client,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
  TextChannel,
  Colors,
  EmbedBuilder,
} from 'discord.js';
// import {SlashCommand} from './commandDef';
import { commandContext } from './context';

const F = f(__filename);

const error10062 = 'Error 10062: (Unknown Interaction Error)[https://github.com/discord/discord-api-docs/issues/5558] for details'; // eslint-disable-line max-len
// const genericError = 'There was an error while executing this command!';

const dataSensitiveCommands = [
  'idose',
  'moderate',
  'report',
];

export default commandRun;

/**
 * Runs a slash command
 * @param {ChatInputCommandInteraction} interaction The interaction that spawned this commend
 * @param {Client} discordClient The Client that manages this interaction
 * @return {Discord.MessageEmbed}
 */
export async function commandRun(
  interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
  discordClient: Client,
) {
  const startTime = new Date().getTime();
  log.info(F, `commandRun started at ${startTime}`);
  const { commandName } = interaction;

  const command = discordClient.commands.get(commandName);

  if (!command) return;

  try {
    log.info(F, `Executed the command in ${new Date().getTime() - startTime}ms`);
    await command.execute(interaction);
    // log.info(F, `commandRun finished in ${new Date().getTime() - startTime}ms`);
  } catch (error) {
    Error.stackTraceLimit = 50;
    const errorStack = (error as Error).stack || JSON.stringify(error, null, 2);

    // Log the error locally
    log.error(F, `${await commandContext(interaction)}:\n\n${errorStack}`);

    // Construct the public/default message
    const errorMessage = env.NODE_ENV === 'production'
      ? `There was an error while executing this command!

      The developers have been alerted, you can try again with new parameters maybe?`
      : errorStack;

    // Construct the embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setDescription(errorMessage);

    // If this is production, send a message to the channel and alert the developers
    if (env.NODE_ENV === 'production') {
      // Log the error to Sentry
      sentry.captureException(error, {
        tags: {
          command: commandName,
          context: await commandContext(interaction),
        },
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
      });

      // Get channel we send errors to
      const channel = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;

      // If the error is a 10062, we know it's a Discord API error, to kind of ignore it =/
      if ((error as any).code === 10062) { // eslint-disable-line @typescript-eslint/no-explicit-any
        await channel.send({
          embeds: [
            embed.setDescription(error10062),
          ],
        });
        return;
      }

      // Get the role we want to ping
      const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
      const role = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
      const context = dataSensitiveCommands.includes(commandName) ? '' : await commandContext(interaction);

      // Alert the developers
      await channel.send({
        embeds: [
          embed.setDescription(`**Error running /${commandName} ${context}**\`\`\`${errorStack}\`\`\`${role} should check this out!`), // eslint-disable-line max-len
        ],
      });
    }

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
