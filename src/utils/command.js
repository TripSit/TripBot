'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const {
  ownerId,
} = process.env;

module.exports = {
  async execute(interaction, client) {
    const blacklistUsers = [];
    global.guild_db.forEach(doc => {
      if (doc.value.isBanned) {
        blacklistUsers.push(doc.value.guild_id);
      }
    });

    // Check if the user is in blacklist_users and if so, ignore it
    if (blacklistUsers.includes(interaction.user.id)) {
      logger.debug(`[${PREFIX}] ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id}) is banned from using commands.`);
      return interaction.reply('You are banned from using commands.');
    }

    // // Cooldown logic
    // if (interaction.user.id !== ownerId) {
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

    const { commandName } = interaction;

    const command = client.commands.get(commandName);
    if (!command) return;

    const commandsAdmin = ['rules', 'how-to-tripsit', 'invite', 'button', 'gban', 'gunban', 'uban', 'uunban', 'test', 'ping'];
    // const commands_pm = ['idose'];

    // Check if the command is in commands_admin list and then check to see if the user is moonbear
    if (commandsAdmin.includes(commandName) && interaction.user.id !== ownerId) {
      interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return; // eslint-disable-line
    }

    // // Check if the command is in the commands_pm list and check if the command came in from a DM
    // if (commands_pm.includes(commandName)) {
    //     if (interaction.inGuild() && interaction.user.id !== ownerId) {
    // eslint-disable-next-line
    //         interaction.reply({ content: 'This command is only available in DMs.', ephemeral: true });
    //         return;
    //     }
    // }

    try {
      command.execute(interaction);
    } catch (error) {
      logger.error(error);
      interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  },
};
