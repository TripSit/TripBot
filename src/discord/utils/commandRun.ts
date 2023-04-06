import {
  Client,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
  TextChannel,
  Colors,
  Guild,
} from 'discord.js';
// import {SlashCommand} from './commandDef';
import { embedTemplate } from './embedTemplate';

const F = f(__filename);

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
    Error.stackTraceLimit = 25;
    const genericError = 'There was an error while executing this command!';
    const botlog = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;
    if (error instanceof Error) {
      log.error(F, `ERROR: ${error.stack}`);
      // log.debug(F, `ERROR: ${JSON.stringify(error, null, 2)}`);
      if ((error as any).code === 10062) {
        await botlog.send(`I just got an "Unknown interaction" error, this is still a problem!
        Check out <https://github.com/discord/discord-api-docs/issues/5558> for details`);
        return;
      }
      if (!interaction.replied) {
        if (interaction.deferred) {
          await interaction.editReply(genericError);
        } else {
          await interaction.reply({
            content: genericError,
            ephemeral: true,
          });
        }
      } else {
        const embed = embedTemplate()
          .setColor(Colors.Red)
          .setDescription(genericError);
        await interaction.editReply({ embeds: [embed] });
      }
      if (env.NODE_ENV === 'production') {
        const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
        const tripbotdevrole = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
        await botlog.send(`Hey ${tripbotdevrole}, I just got an error (commandRun: ${commandName}):
        ${error.stack}
        `);
      }
    } else {
      log.error(F, `ERROR: ${error}`);
      await interaction.reply({ content: 'There was an unexpected error while executing this command!' });
      if (env.NODE_ENV === 'production') {
        const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
        const tripbotdevrole = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
        await botlog.send(`Hey ${tripbotdevrole}, I just got an error (commandRun: ${commandName}):
        ${error}
        `);
      }
    }
  }
}
