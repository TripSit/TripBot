'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const channelDevId = process.env.channel_development;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Report a bug to the bot owner')
    .addStringOption(option => option.setName('bug_report').setDescription('What do you want to tell the owner? Please be as detailed as possible!').setRequired(true)),

  async execute(interaction, parameters) {
    const username = `${interaction.user.username}#${interaction.user.discriminator}`;
    const guildMessage = `${interaction.guild.name ? ` in ${interaction.guild.name}` : 'DM'}`;

    const bugReport = interaction.options.getString('bug_report') || parameters;
    logger.debug(`[${PREFIX}] bugReport:`, bugReport);

    const botOwner = interaction.client.users.cache.get(process.env.ownerId);

    logger.debug(`[${PREFIX}] channel_dev_id:`, channelDevId);
    const devChan = interaction.client.channels.cache.get(channelDevId);
    const devEmbed = template.embedTemplate()
      .setColor('RANDOM')
      .setDescription(`Hey ${botOwner.toString()},\n${username}${guildMessage} reports:\n${bugReport}`);
    devChan.send({ embeds: [devEmbed] });

    const embed = template.embedTemplate()
      .setColor('RANDOM')
      .setTitle('Thank you!')
      .setDescription('I\'ve submitted this feedback to the bot owner. \n\nYou\'re more than welcome to join the TripSit server and speak to Moonbear directly if you want! Check the /contact command for more info.');
    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
