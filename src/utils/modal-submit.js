'use strict';

const path = require('path');
const { stripIndents } = require('common-tags');
const logger = require('./logger');
const template = require('./embed-template');

const channelTripsitInfoId = process.env.channel_tripsitinfo;

const {
  ownerId,
  NODE_ENV,
  role_developer: roleDeveloperId,
  channel_development: channelDevId,
  channel_tripsitters: channelTripsitters,
  role_needshelp: roleNeedsHelp,
  role_tripsitter: roleTripsitter,
  role_helper: roleHelper,
} = process.env;

const PREFIX = path.parse(__filename).name;

module.exports = {
  async execute(interaction) {
    logger.debug(`[${PREFIX}] interaction: ${interaction}`);
    logger.debug(`[${PREFIX}] interaction.customId: ${interaction.customId}`);
    if (interaction.customId === 'tripsitModal') {
      const patient = interaction.member;
      logger.debug(`[${PREFIX}] patient: ${patient}`);

      const test = patient.id === process.env.ownerId || patient.id.toString() === '332687787172167680';
      logger.debug(`[${PREFIX}] test: ${test}`);

      const triageInput = interaction.fields.getTextInputValue('triageInput');
      logger.debug(`[${PREFIX}] triageInput: ${triageInput}`);

      const introInput = interaction.fields.getTextInputValue('introInput');
      logger.debug(`[${PREFIX}] introInput: ${introInput}`);

      // Get a list of the patient's roles
      const patientRoles = patient.roles.cache;
      const patientRoleNames = patientRoles.map(role => role.name);
      logger.debug(`[${PREFIX}] patientRoleNames: ${patientRoleNames}`);

      const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedsHelp);
      const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === roleTripsitter);
      const helperRole = interaction.guild.roles.cache.find(role => role.id === roleHelper);

      // Loop through userRoles and check if the patient has the needsHelp role
      const hasNeedsHelpRole = patientRoleNames.some(role => role === needsHelpRole.name);
      const hasHelperRole = patientRoleNames.some(role => role === helperRole.name);
      logger.debug(`[${PREFIX}] hasNeedsHelpRole: ${hasNeedsHelpRole}`);

      const patientId = patient.id.toString();
      logger.debug(`[${PREFIX}] patientid: ${patientId}`);

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

      try {
        // Add the needsHelp role to the patient
        logger.debug(`[${PREFIX}] Adding the needsHelp role to the patient`);
        await patient.roles.add(needsHelpRole);
      } catch (err) {
        logger.error(`[${PREFIX}] Error adding role to patient: ${err}`);
        return interaction.reply(stripIndents`There was an error adding the NeedsHelp role!
        Make sure the bot's role is higher than NeedsHelp in the Role list!`);
      }

      if (hasHelperRole) {
        try {
          // Remove the helper role so they can't see their own thread
          logger.debug(`[${PREFIX}] Removing the helper role from the patient`);
          await patient.roles.remove(helperRole);
        } catch (err) {
          logger.error(`[${PREFIX}] Error removing role from patient: ${err}`);
          return interaction.reply(stripIndents`There was an error removing the Helper role!
          Make sure the bot's role is higher than Helper in the Role list!`);
        }
      }
      const privMsg = stripIndents`
        Hey ${patient}, thank you for asking for assistance!
        A ${test ? 'tripsitter' : tripsitterRole}s or ${test ? 'helper' : helperRole}s will be with you as soon as they're available!
        If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
      `;

      // Create a new thread in the interaction.channel with the
      // patient's name and the priv_message as the startMessage
      const thread = await interaction.channel.threads.create({
        name: `${patient.user.username} chat here!`,
        autoArchiveDuration: 1440,
        type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
        reason: `${patient.user.username} requested help`,
      });

      // send a message to the thread
      await thread.send(privMsg);

      const msg = `Hey ${patient}, thank you for asking for assistance!\n\n\
      Click here to be taken to your private room: ${thread.toString()}\n
      You can also click in your channel list to see your private room!`;
      const embed = template.embedTemplate()
        .setColor('DARK_BLUE')
        .setDescription(msg);
      logger.debug(`[${PREFIX}] Done!`);
      interaction.reply({ embeds: [embed], ephemeral: true });

      // Get the tripsitters channel from the guild
      const tripsittersChannel = interaction.guild.channels.cache
        .find(chan => chan.id === channelTripsitters);

      // Create a new thread in the interaction.channel with the
      // patient's name and the priv_message as the startMessage
      const helperThread = await tripsittersChannel.threads.create({
        name: `${patient.user.username} discuss here!`,
        autoArchiveDuration: 1440,
        type: 'GUILD_PUBLIC_THREAD',
        reason: `${patient.user.username} requested help`,
      });

      const channelTripsitInfo = interaction.client.channels.cache.get(channelTripsitInfoId);

      const helperMsg = stripIndents`
      Hey ${test ? 'tripsitter' : tripsitterRole}s and ${test ? 'helper' : helperRole}s, ${patient.user.username} can use some help in ${thread.toString()}!

      ${triageInput ? `They've taken: \n${triageInput}` : ''}

      ${introInput ? `Their issue: \n${introInput}` : ''}

      Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

      *You're receiving this alert because you're a Helper/Tripsitter!*
      *Only Tripsitters, Helpers and Moderators can see this thread*!
      *You can remove the helper role in ${channelTripsitInfo.toString()}*!
      `;
      // send a message to the thread
      await helperThread.send(helperMsg);
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
