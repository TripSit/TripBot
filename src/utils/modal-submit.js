'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const template = require('./embed-template');
const tripsitme = require('./tripsitme');
// const tripsat = require('./tripsat');

const {
  discordOwnerId,
  roleDeveloperId,
  channelTripbotId,
} = require('../../env');

module.exports = {
  async execute(interaction) {
    // logger.debug(`[${PREFIX}] interaction: ${interaction}`);
    logger.debug(`[${PREFIX}] interaction: ${interaction.customId}`);
    if (interaction.customId === 'tripsitModal') {
      tripsitme.submit(interaction);
      return;
    }
    // if (interaction.customId === 'feedbackModal') {
    //   tripsat.submit(interaction);
    //   return;
    // }
    if (interaction.customId === 'bugReportModal') {
      const username = `${interaction.user.username}#${interaction.user.discriminator}`;
      const guildMessage = `${interaction.guild.name ? ` in ${interaction.guild.name}` : 'DM'}`;

      const bugReport = interaction.fields.getTextInputValue('bugReport');
      logger.debug(`[${PREFIX}] bugReport:`, bugReport);

      const botOwner = interaction.client.users.cache.get(discordOwnerId);
      const botOwnerEmbed = template.embedTemplate()
        .setColor('RANDOM')
        .setDescription(`Hey ${botOwner.toString()},\n${username}${guildMessage} reports:\n${bugReport}`);
      botOwner.send({ embeds: [botOwnerEmbed] });

      const developerRole = interaction.guild.roles.cache.find(role => role.id === roleDeveloperId);
      const devChan = interaction.client.channels.cache.get(channelTripbotId);
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
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
