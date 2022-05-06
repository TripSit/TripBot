'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const {
  NODE_ENV,
  channel_tripsitters: channelTripsitters,
  role_needshelp: roleNeedsHelp,
  role_tripsitter: roleTripsitter,
  role_helper: roleHelper,
} = process.env;

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tripsitme')
    .setDescription('Check substance information'),
  async execute(interaction) {
    const patient = interaction.member;
    const test = patient.id === process.env.ownerId || patient.id.toString() === '332687787172167680';

    // Get a list of the patient's roles
    const patientRoles = patient.roles.cache;
    const patientRoleNames = patientRoles.map(role => role.name);
    logger.debug(`[${PREFIX}] userRoles:`, patientRoleNames);

    const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedsHelp);
    const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === roleTripsitter);
    const helperRole = interaction.guild.roles.cache.find(role => role.id === roleHelper);

    // Loop through userRoles and check if the patient has the needsHelp role
    const hasNeedsHelpRole = patientRoleNames.some(role => role === needsHelpRole.name);
    const hasHelperRole = patientRoleNames.some(role => role === helperRole.name);
    logger.debug(`[${PREFIX}] hasNeedsHelpRole:`, hasNeedsHelpRole);

    const patientId = patient.id.toString();
    logger.debug(`[${PREFIX}] patientid:`, patientId);

    if (hasNeedsHelpRole) {
      const embed = template.embedTemplate()
        .setColor('DARK_BLUE')
        .setDescription(stripIndents`
          Hey ${interaction.member}, you're already being helped!\n\n
          Check your channel list for '${patient.user.username} chat here!'
        `);
      logger.debug(`[${PREFIX}] Done!`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (hasHelperRole) {
      patient.roles.remove(helperRole);
    }

    const msg = `Hey ${patient}, thank you for asking for assistance!\n\n\
            Check your channel list for '${patient.user.username} chat here!'`;
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription(msg);
    logger.debug(`[${PREFIX}] Done!`);

    interaction.reply({ embeds: [embed], ephemeral: true });

    const privMsg = stripIndents`
      Hey ${patient}, thank you for asking for assistance!
      **Start off by telling us what's going on: what did you take, how much, what time?**
      A ${test ? 'tripsitter' : tripsitterRole}s or ${test ? 'helper' : helperRole}s will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
    `;

    // Create a new thread in the interaction.channel with the
    // patient's name and the priv_message as the startMessage
    const thread = await interaction.channel.threads.create({
      name: `${patient.user.username} chat here!`,
      autoArchiveDuration: 60,
      type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
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

    const helperMsg = stripIndents`Hey ${test ? 'tripsitter' : tripsitterRole}s and ${test ? 'helper' : helperRole}s, ${patient.user.username} can use some help, use this thread to talk about it!`;

    // send a message to the thread
    await helperThread.send(helperMsg);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
