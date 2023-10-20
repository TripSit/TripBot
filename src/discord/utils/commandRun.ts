import {
  Client,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';
// import {SlashCommand} from './commandDef';
import handleError from '../events/error';

// const F = f(__filename);

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
  // const startTime = new Date().getTime();
  // log.info(F, `commandRun started at ${startTime}`);
  const { commandName } = interaction;

  const command = discordClient.commands.get(commandName);

  if (!command) return;

  try {
    // log.info(F, `Executed the command in ${new Date().getTime() - startTime}ms`);
    await command.execute(interaction);
    // log.info(F, `commandRun finished in ${new Date().getTime() - startTime}ms`);
  } catch (error) {
    await handleError(error, commandName, interaction);
  }
}
