'use strict';

const {
  MessageActionRow, Modal, TextInputComponent,
} = require('discord.js');
const { stripIndents } = require('common-tags');
const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('./firebase');

const template = require('./embed-template');

const {
  discordOwnerId,
  NODE_ENV,
  channelTripsitInfoId,
  channelTripsittersId,
  roleNeedshelpId,
  roleTripsitterId,
  roleHelperId,
} = require('../../env');

module.exports = {
  async execute(interaction) {
    // Create the modal
    const modal = new Modal()
      .setCustomId('tripsitModal')
      .setTitle('TripSit Help Request');
    modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent()
      .setCustomId('triageInput')
      .setLabel('What substance? How much taken? What time?')
      .setStyle('SHORT')));
    modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent()
      .setCustomId('introInput')
      .setLabel('What\'s going on? Give us the details!')
      .setStyle('PARAGRAPH')));
    await interaction.showModal(modal);
  },
  async submit(interaction, memberInput) {
    // Get the input from the modal, if it was submitted
    let triageInput = '';
    let introInput = '';

    if (!memberInput) {
      triageInput = interaction.fields.getTextInputValue('triageInput');
      introInput = interaction.fields.getTextInputValue('introInput');
    }
    // logger.debug(`[${PREFIX}] triageInput: ${triageInput}`);
    // logger.debug(`[${PREFIX}] introInput: ${introInput}`);

    // Get the roles we'll be referencing
    const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedshelpId);
    const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === roleTripsitterId);
    const helperRole = interaction.guild.roles.cache.find(role => role.id === roleHelperId);

    // Get the channels we'll be referencing
    const channelTripsitInfo = interaction.client.channels.cache.get(channelTripsitInfoId);

    // Determine the target.
    // If the user clicked the button, the target is whoever started the interaction.
    // Otherwise, the target is the user mentioned in the /tripsit command.
    let target = interaction.member;
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] memberInput: ${memberInput}`);
    if (memberInput !== undefined && memberInput !== null) {
      target = memberInput;
      const actorRoleNames = actor.roles.cache.map(role => role.name);
      logger.debug(`[${PREFIX}] actor: ${actor.user.username}#${actor.user.discriminator}`);
      const [actorData, actorFbid] = await getUserInfo(actor);
      const actorAction = `${PREFIX}_sent`;
      logger.debug(`[${PREFIX}] Updating actor data it`);
      if ('mod_actions' in actorData) {
        actorData.mod_actions[actorAction] = (actorData.mod_actions[actorAction] || 0) + 1;
      } else {
        actorData.mod_actions = { [actorAction]: 1 };
      }
      actorData.roles = actorRoleNames;

      await setUserInfo(actorFbid, actorData);
    }
    logger.debug(`[${PREFIX}] target: ${target}`);

    // Determine if this is a test run, eg, run by the bot owner
    // If so, don't ping the tripsitters and helpers down below
    const testRun = target.id === discordOwnerId || target.id.toString() === '332687787172167680';
    logger.debug(`[${PREFIX}] testRun: ${testRun}`);

    // Get a list of the target's roles
    const targetRoleNames = target.roles.cache.map(role => role.name);
    // logger.debug(`[${PREFIX}] targetRoleNames: ${targetRoleNames}`);

    // Loop through userRoles and check if the target has roles
    const targetHasNeedsHelpRole = targetRoleNames.some(role => role === needsHelpRole.name);
    logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

    // Get the target lastHelped information from the db
    const [targetData, targetFbid] = await getUserInfo(target);
    const targetAction = `${PREFIX}_received`;
    const targetLastHelpedDate = targetData.lastHelpedDate;
    const targetLastHelpedThreadId = targetData.lastHelpedThreadId;
    logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);
    const targetLastHelpedMetaThreadId = targetData.lastHelpedMetaThreadId;
    logger.debug(`[${PREFIX}] targetLastHelpedMetaThreadId: ${targetLastHelpedMetaThreadId}`);

    // Get the channel objects for the help and meta threads
    let helpThread = interaction.guild.channels.cache
      .find(chan => chan.id === targetLastHelpedThreadId);
    let helperThread = interaction.guild.channels.cache
      .find(chan => chan.id === targetLastHelpedMetaThreadId);

    if (targetHasNeedsHelpRole) {
      // A user will have the NeedsHelp role when they click the button.
      // After they click the button, their roles are saved and then removed
      // So we need to stop the code below from saving an empty list of roles
      // We trust that the button did it's job and saved the roles and applied the channels,
      // so it assumes that it doesn't need to do anything as long as the user has this role.

      // Remind the user that they have a channel open
      try {
        const rejectMessage = memberInput
          ? stripIndents`Hey ${interaction.member}, ${target.user.username} is already being helped!

          Check your channel list for '${helpThread.toString()} to help them!'`
          : stripIndents`Hey ${interaction.member}, you are already being helped!

          Check your channel list for '${helpThread.toString()} to get help!`;
        const embed = template.embedTemplate()
          .setColor('DARK_BLUE')
          .setDescription(rejectMessage);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] Rejected need for help`);

        // Ping the user in the help thread
        if (helpThread && !memberInput) {
          helpThread.send(stripIndents`
            Hey ${target}, use this thread to keep in touch with the Team!
          `);
        }
        logger.debug(`[${PREFIX}] Pinged user in help thread`);

        // Update the meta thread
        if (helperThread) {
          const metaUpdate = memberInput
            ? stripIndents`Hey ${interaction.member}, ${target.user.username} is already being helped!
            Use this ${helpThread} to discuss it!'`
            : stripIndents`${target.user.username} has submitted a new request for assistance:
            They've taken: ${triageInput ? `\n${triageInput}` : '*No info given*'}
            Their issue: ${introInput ? `\n${introInput}` : '*No info given*'}
            Use this ${helpThread} to discuss it!`;
          helperThread.send(metaUpdate);
        }
        logger.debug(`[${PREFIX}] Updated meta help thread`);

        return;
      } catch (err) {
        logger.debug(`[${PREFIX}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
      }
    }
    // Team check - Cannot be run on team members
    target.roles.cache.forEach(role => {
      if (role === 'Admin' || role === 'Operator' || role === 'Moderator' || role === 'Tripsitter') {
        const embed = template.embedTemplate()
          .setColor('DARK_BLUE')
          .setDescription('You are a member of the team and cannot be publicly helped! Try asking in #teamtripsit');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    });
    logger.debug(`[${PREFIX}] Target is not a team member!`);

    // Remove all roles from the target
    target.roles.cache.forEach(role => {
      if (role.name !== '@everyone') {
        logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.user.username}`);
        target.roles.remove(role);
      }
    });

    // Add the needsHelp role to the target
    try {
      logger.debug(`[${PREFIX}] Adding role ${needsHelpRole.name} to ${target.user.username}`);
      await target.roles.add(needsHelpRole);
    } catch (err) {
      logger.error(`[${PREFIX}] Error adding role to target: ${err}`);
      return interaction.reply(stripIndents`There was an error adding the NeedsHelp role!
      Make sure the bot's role is higher than NeedsHelp in the Role list!`);
    }

    // If the user has been helped in the last week, direct them to the existing thread
    if (targetLastHelpedDate) {
      const lastWeek = Date.now() - (1000 * 60 * 60 * 24 * 7);
      logger.debug(`[${PREFIX}] lastHelp: ${targetLastHelpedDate.seconds * 1000}`);
      logger.debug(`[${PREFIX}] lastWeek: ${lastWeek}`);
      if (targetLastHelpedDate.seconds * 1000 > lastWeek) {
        logger.debug(`[${PREFIX}] Target was last helped within the last week!`);
        // Ping them in the open thread
        try {
          // Send the intro message to the thread
          const firstMessage = memberInput
            ? stripIndents`
            Hey ${target}, the team thinks you could use assistance!
            A ${testRun ? 'tripsitter' : tripsitterRole}s or ${testRun ? 'helper' : helperRole}s will be with you as soon as they're available!
            If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.`
            : stripIndents`
            Hey ${target}, thank you for asking for assistance!
            The team will be with you as soon as they're available!
            If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.`;

          helpThread.send(firstMessage);

          // Update the meta thread too
          const helperMsg = memberInput
            ? stripIndents`
            Hey ${testRun ? 'tripsitter' : tripsitterRole}s and ${testRun ? 'helper' : helperRole}s, ${actor} thinks ${target.user.username} can use some help in ${helpThread.toString()}!

            Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

            *You're receiving this alert because you're a Helper/Tripsitter!*
            *Only Tripsitters, Helpers and Moderators can see this thread*!
            *You can remove the helper role in ${channelTripsitInfo.toString()}*!`
            : stripIndents`
            Hey team, ${target.user.username} sent a new request for help in ${helpThread.toString()}!

            They've taken: ${triageInput ? `\n${triageInput}` : '*No info given*'}

            Their issue: ${introInput ? `\n${introInput}` : '*No info given*'}`;
          helperThread.send(helperMsg);

          // Respond to the user and remind them they have an open thread
          const reminderMessage = memberInput
            ? stripIndents`
            Hey ${actor}, thank you for requestiong assistance on the behalf of ${target.user.username}!

            Click here to be taken to their private room: ${helpThread.toString()}

            You can also click in your channel list to see their private room!`
            : stripIndents`
            Hey ${target}, thank you for asking for assistance!

            Click here to be taken to your private room: ${helpThread.toString()}

            You can also click in your channel list to see your private room!`;

          const embed = template.embedTemplate()
            .setColor('DARK_BLUE')
            .setDescription(reminderMessage);

          interaction.reply({ embeds: [embed], ephemeral: true });

          targetData.roles = targetRoleNames;
          targetData.lastHelpedDate = new Date();

          // TODO: Use transactions
          await setUserInfo(targetFbid, targetData);

          logger.debug(`[${PREFIX}] finished!`);

          // Return here so that we don't create the new thread below
          return;
        } catch (err) {
          logger.info(`[${PREFIX}] The previous thread was likely deleted, starting fresh!:\n ${err}`);
        }
      }
    }
    // Create a new private thread in the channel
    // If we're not in production we need to create a public thread
    helpThread = await interaction.channel.threads.create({
      name: `${target.user.username} chat here!`,
      autoArchiveDuration: 1440,
      type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
      reason: `${target.user.username} requested help`,
    });
    logger.debug(`[${PREFIX}] Created helpThread ${helpThread.id}`);

    // Send the intro message to the helpThread
    const firstMessage = memberInput
      ? stripIndents`
      Hey ${target}, the team thinks you could use assistance!
      A ${testRun ? 'tripsitter' : tripsitterRole}s or ${testRun ? 'helper' : helperRole}s will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.`
      : stripIndents`
      Hey ${target}, thank you for asking for assistance!
      A ${testRun ? 'tripsitter' : tripsitterRole}s or ${testRun ? 'helper' : helperRole}s will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.`;
    await helpThread.send(firstMessage);
    logger.debug(`[${PREFIX}] Sent intro message to helpThread ${helpThread.id}`);

    // Get the tripsitters channel from the guild
    const tripsittersChannel = interaction.guild.channels.cache
      .find(chan => chan.id === channelTripsittersId);

    // Create a new helperThread in the tripsitters channel
    helperThread = await tripsittersChannel.threads.create({
      name: `${target.user.username} discuss here!`,
      autoArchiveDuration: 1440,
      type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
      reason: `${target.user.username} requested help`,
    });
    logger.debug(`[${PREFIX}] Created meta-thread ${helperThread.id}`);

    // Send the intro message to the thread
    const helperMsg = memberInput
      ? stripIndents`
      Hey ${testRun ? 'tripsitter' : tripsitterRole}s and ${testRun ? 'helper' : helperRole}s, ${actor} thinks ${target.user.username} can use some help in ${helpThread.toString()}!

      Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

      *You're receiving this alert because you're a Helper/Tripsitter!*
      *Only Tripsitters, Helpers and Moderators can see this thread*!
      *You can remove the helper role in ${channelTripsitInfo.toString()}*!`
      : stripIndents`
      Hey ${testRun ? 'tripsitter' : tripsitterRole}s and ${testRun ? 'helper' : helperRole}s, ${target.user.username} can use some help in ${helpThread.toString()}!

      They've taken: ${triageInput ? `\n${triageInput}` : '*No info given*'}

      Their issue: ${introInput ? `\n${introInput}` : '*No info given*'}

      Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

      *You're receiving this alert because you're a Helper/Tripsitter!*
      *Only Tripsitters, Helpers and Moderators can see this thread*!
      *You can remove the helper role in ${channelTripsitInfo.toString()}*!`;
    // send a message to the thread
    await helperThread.send(helperMsg);
    logger.debug(`[${PREFIX}] Sent intro message to meta-thread ${helperThread.id}`);

    // Send the triage info to the thread
    const replyMessage = memberInput
      ? stripIndents`
      Hey ${interaction.member}, we've activated tripsit mode on ${target.user.username}!

      Check your channel list for ${helpThread.toString()} to talk to the user

      Check your channel list for ${helperThread.toString()} to meta-talk about the user

      **Be sure add some information about the user to the thread!**`
      : stripIndents`
      Hey ${target}, thank you for asking for assistance!

      Click here to be taken to your private room: ${helpThread.toString()}

      You can also click in your channel list to see your private room!`;

    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription(replyMessage);
    interaction.reply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] Sent response to user`);

    // Update targetData with how many times they've been helped
    logger.debug(`[${PREFIX}] Updating target data`);
    if ('mod_actions' in targetData) {
      targetData.mod_actions[targetAction] = (targetData.mod_actions[targetAction] || 0) + 1;
    } else {
      targetData.mod_actions = { [targetAction]: 1 };
    }

    // Update database information
    targetData.lastHelpedThreadId = helpThread.id;
    targetData.lastHelpedMetaThreadId = helperThread.id;
    targetData.roles = targetRoleNames;
    targetData.lastHelpedDate = new Date();
    // TODO: Use transactions
    await setUserInfo(targetFbid, targetData);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
