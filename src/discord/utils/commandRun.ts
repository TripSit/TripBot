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
import { parse } from 'path';
import { embedTemplate } from './embedTemplate';
import log from '../../global/utils/log';

import env from '../../global/utils/env.config';

const PREFIX = parse(__filename).name;

export default commandRun;

/**
 * Runs a slash command
 * @param {ChatInputCommandInteraction} interaction The interaction that spawned this commend
 * @param {Client} client The Client that manages this interaction
 * @return {Discord.MessageEmbed}
 */
export async function commandRun(
  interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
  client: Client,
) {
  const { commandName } = interaction;

  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    Error.stackTraceLimit = 25;
    const genericError = 'There was an error while executing this command!';
    if (error instanceof Error) {
      log.error(`[${PREFIX}] ERROR: ${error.stack}`);
      if (!interaction.replied) {
        if (interaction.deferred) {
          interaction.editReply(genericError);
        } else {
          interaction.reply({
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
        const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
        const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID) as Guild;
        const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
        botlog.send(`Hey ${tripbotdevrole}, I just got an error (commandRun: ${commandName}):
        ${error.stack}
        `);
      }
    } else {
      log.error(`[${PREFIX}] ERROR: ${error}`);
      interaction.reply({
        content: 'There was an unexpected error while executing this command!',
        ephemeral: true,
      });
      if (env.NODE_ENV === 'production') {
        const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
        const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID) as Guild;
        const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
        botlog.send(`Hey ${tripbotdevrole}, I just got an error (commandRun: ${commandName}):
        ${error}
        `);
      }
    }
  }
}
