'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const {
  channelTripsitters,
  roleNeedshelp,
  roleTripsitter,
  roleHelper,
} = process.env;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tripsitme')
    .setDescription('Check substance information'),

  async execute(interaction) {
    const patient = interaction.member;

    // Get a list of the patient's roles
    const patientRoles = patient.roles.cache;
    const patientRoleNames = patientRoles.map(role => role.name);
    logger.debug(`[${PREFIX}] userRoles: ${patientRoleNames}`);

    const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedshelp);
    const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === roleTripsitter);
    const helperRole = interaction.guild.roles.cache.find(role => role.id === roleHelper);

    // Loop through userRoles and check if the patient has the needsHelp role
    const hasNeedsHelpRole = patientRoleNames.some(role => role === needsHelpRole.name);
    logger.debug(`[${PREFIX}] hasNeedsHelpRole: ${hasNeedsHelpRole}`);

    const patientid = patient.id.toString();
    logger.debug(`[${PREFIX}] patientid: ${patientid}`);

    if (hasNeedsHelpRole) {
      const embed = template.embedTemplate()
        .setColor('DARK_BLUE')
        .setDescription(`Hey ${interaction.member}, you're already being helped!\n\nCheck your channel list for '${patient.user.username} chat here!'`);
      logger.debug(`[${PREFIX}] Done!`);
      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    const msg = `Hey ${patient}, thank you for asking for assistance!\n\n\
            Check your channel list for '${patient.user.username} chat here!'`;
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription(msg);
    logger.debug(`[${PREFIX}] Done!`);

    interaction.reply({ embeds: [embed], ephemeral: true });

    const privMsg = `Hey ${patient}, thank you for asking for assistance!\n\nStart off by telling us what's going on: what did you take, how much, what time?\n\nA ${tripsitterRole} or ${helperRole} will be with you as soon as they're available!`;

    // Create a new thread in the interaction.channel with the
    // patient's name and the priv_message as the startMessage
    const threadType = process.env.NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD';
    const thread = await interaction.channel.threads.create({
      name: `${patient.user.username} chat here!`,
      autoArchiveDuration: 60,
      type: threadType,
      reason: `${patient.user.username} requested help`,
    });

    // send a message to the thread
    await thread.send(privMsg);

    // Get the tripsitters channel from the guild
    const tripsittersChannel = interaction.guild.channels.cache
      .find(chan => chan.id === channelTripsitters);

    // Create a new thread in the interaction.channel with the
    // patient's name and the priv_message as the startMessage
    const helperThread = await tripsittersChannel.threads.create({
      name: `${patient.user.username} discuss here!`,
      autoArchiveDuration: 60,
      type: 'GUILD_PUBLIC_THREAD',
      reason: `${patient.user.username} requested help`,
    });

    const helperMsg = `Hey ${tripsitterRole} and ${helperRole}, ${patient.user.username} can use some help, use this thread to talk about it!`;

    // send a message to the thread
    await helperThread.send(helperMsg);
    return logger.debug(`[${PREFIX}] finished!`);
  },
};
