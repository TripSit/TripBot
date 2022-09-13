import {
  Client,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';
// import {SlashCommand} from './commandDef';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

import env from '../../global/utils/env.config';

/**
 * Runs a slash command
 * @param {ChatInputCommandInteraction} interaction The interaction that spawned this commend
 * @param {Client} client The Client that manages this interaction
 * @return {Discord.MessageEmbed}
 */
export async function commandRun(
    interaction: ChatInputCommandInteraction| MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
    client: Client) {
  logger.debug(`[${PREFIX}] starting!`);
  // const blacklistUsers = [];
  // if (global.guild_db) {
  //   global.guild_db.forEach((doc) => {
  //     if (doc.value.isBanned) {
  //       blacklistUsers.push(doc.value.guild_id);
  //     }
  //   });
  // }

  // Check if the user is in blacklist_users and if so, ignore it
  // if (blacklistUsers.includes(interaction.user.id)) {
  //   logger.debug(`[${PREFIX}] ${interaction.user.username}#${interaction.user.discriminator}
  // (${interaction.user.id}) is banned from using commands.`);
  //   return interaction.reply('You are banned from using commands.');
  // }
  // logger.debug(`[${PREFIX}] ${interaction.user.username} is not banned!`);

  // // Cooldown logic
  // if (interaction.user.id !== DISCORD_OWNER_ID) {
  //     if (cooldown.has(interaction.user.id)) {
  //     // / If the cooldown did not end
  //         interaction.reply({ content: 'Don\'t be a coconut ( ͡° ͜ʖ ͡°)', ephemeral: true });
  //         return;
  //     }
  //     else {
  //     // Set cooldown
  //         cooldown.add(interaction.user.id);
  //         setTimeout(() => {
  //         // Removes the user from the set after 1 minute
  //             cooldown.delete(interaction.user.id);
  //         }, cooldownTime);
  //     }
  // }

  const {commandName} = interaction;

  const command = client.commands.get(commandName);

  if (!command) return;

  const commandsAdmin = [
    'update-guilds',
    'vip-welcome',
    'clearChat',
    'start-here',
    'clean-db',
    'rules',
    'how-to-tripsit',
    'invite',
    'button',
    'gban',
    'gunban',
    'uban',
    'uunban',
    'test',
    'ping',
  ];

  // Check if the command is in commands_admin list and then check to see if the user is moonbear
  if (commandsAdmin.includes(commandName) && interaction.user.id !== env.DISCORD_OWNER_ID.toString()) {
    // logger.debug(`[${PREFIX}] commandName: ${commandName}`);
    // logger.debug(`[${PREFIX}] commandsAdmin.includes(commandName): ${commandsAdmin.includes(commandName)}`);
    // logger.debug(`[${PREFIX}] interaction.user.id : ${interaction.user.id}`);
    // logger.debug(`[${PREFIX}] interaction.user.id : ${typeof interaction.user.id}`);
    // logger.debug(`[${PREFIX}] env.DISCORD_OWNER_ID: ${env.DISCORD_OWNER_ID}`);
    // logger.debug(`[${PREFIX}] env.DISCORD_OWNER_ID: ${typeof env.DISCORD_OWNER_ID}`);
    interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true,
    });
    return;
  }

  // // Check if the command is in the commands_pm list and check if the command came in from a DM
  // if (commands_pm.includes(commandName)) {
  //     if (interaction.inGuild() && interaction.user.id !== DISCORD_OWNER_ID) {
  // eslint-disable-next-line
    //         interaction.reply({ content: 'This command is only available in DMs.', ephemeral: true });
  //         return;
  //     }
  // }

  try {
    await command.execute(interaction);
  } catch (error:any) {
    logger.error(`[${PREFIX}] Client error ${JSON.stringify(error, null, 2)}`);
    logger.error(`[${PREFIX}] error.name: ${error.name}`);
    logger.error(`[${PREFIX}] error.message: ${error.message}`);
    logger.error(`[${PREFIX}] error.stack: ${error.stack}`);
    interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
  logger.debug(`[${PREFIX}] finished!`);
};
