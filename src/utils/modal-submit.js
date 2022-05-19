'use strict';

const path = require('path');
const logger = require('./logger');
const template = require('./embed-template');

const {
  ownerId,
  role_developer: roleDeveloperId,
  channel_development: channelDevId,
} = process.env;

const PREFIX = path.parse(__filename).name;

module.exports = {
  async execute(interaction) {
    try {
      logger.debug(`[${PREFIX}] interaction0: ${JSON.stringify(interaction, null, 2)}`);
    } catch (err0) {
      logger.debug(`[${PREFIX}] interaction0 err: ${err0}`);
      try {
        logger.debug(`[${PREFIX}] interaction1: ${JSON.stringify(interaction)}`);
      } catch (err1) {
        logger.debug(`[${PREFIX}] interaction1 err: ${err1}`);
        logger.debug(interaction);
      }
    }
    if (interaction.customId === 'bugReportModal') {
      const username = `${interaction.user.username}#${interaction.user.discriminator}`;
      const guildMessage = `${interaction.guild.name ? ` in ${interaction.guild.name}` : 'DM'}`;

      const bugReport = interaction.fields.getTextInputValue('bugReport');
      logger.debug(`[${PREFIX}] bugReport:`, bugReport);

      const botOwner = interaction.client.users.cache.get(ownerId);
      const botOwnerEmbed = template.embedTemplate()
        .setColor('RANDOM')
        .setDescription(`Hey ${botOwner.toString()},\n${username}${guildMessage} reports:\n${bugReport}`);
      botOwner.send({ embeds: [botOwnerEmbed] });

      const developerRole = interaction.guild.roles.cache.find(role => role.id === roleDeveloperId);
      const devChan = interaction.client.channels.cache.get(channelDevId);
      const devEmbed = template.embedTemplate()
        .setColor('RANDOM')
        .setDescription(`Hey ${developerRole.toString()}s, a user submitted a bug report:\n${bugReport}`);
      devChan.send({ embeds: [devEmbed] });

      const embed = template.embedTemplate()
        .setColor('RANDOM')
        .setTitle('Thank you!')
        .setDescription('I\'ve submitted this feedback to the bot owner. \n\nYou\'re more than welcome to join the TripSit server and speak to Moonbear directly if you want! Check the /contact command for more info.');
      if (!interaction.replied) {
        interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      } else {
        interaction.followUp({
          embeds: [embed],
          ephemeral: false,
        });
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
