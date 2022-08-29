// eslint-disable no-irregular-whitespace

'use strict';

const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Colors,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { stripIndents } = require('common-tags');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { getUserInfo, setUserInfo } = require('../../global/services/firebaseAPI');

const template = require('./embed-template');

const {
  NODE_ENV,
  channelHowToTripsitId,
  channelTripsittersId,
  channelTripsitId,
  channelOpentripsitId,
  roleNeedshelpId,
  roleHelperId,
  roleDirectorId,
  roleSuccessorId,
  roleSysadminId,
  roleLeaddevId,
  roleIrcadminId,
  roleDiscordadminId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbotId,
  roleTripbot2Id,
  roleBotId,
  roleDeveloperId,
  roleTreeId,
  roleSproutId,
  roleSeedlingId,
  roleBoosterId,
  roleRedId,
  roleOrangeId,
  roleYellowId,
  roleGreenId,
  roleBlueId,
  rolePurpleId,
  rolePinkId,
  roleBrownId,
  roleBlackId,
  roleWhiteId,
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  roleSoberId,
} = require('../../../env');

const teamRoles = [
  roleDirectorId,
  roleSuccessorId,
  roleSysadminId,
  roleLeaddevId,
  roleIrcadminId,
  roleDiscordadminId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbot2Id,
  roleTripbotId,
  roleBotId,
  roleDeveloperId,
];

const colorRoles = [
  roleTreeId,
  roleSproutId,
  roleSeedlingId,
  roleBoosterId,
  roleRedId,
  roleOrangeId,
  roleYellowId,
  roleGreenId,
  roleBlueId,
  rolePurpleId,
  rolePinkId,
  roleBrownId,
  roleBlackId,
  roleWhiteId,

];

const mindsetRoles = [
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  roleSoberId,
];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles}`;

// Declare the static test nitice
const testNotice = '🧪THIS IS A TEST PLEASE IGNORE🧪\n\n';

module.exports = {
  async execute(interaction) {
    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId('tripsitModal')
      .setTitle('TripSit Help Request');
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
      .setCustomId('triageInput')
      .setLabel('What substance? How much taken? What time?')
      .setStyle(TextInputStyle.Short)));
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
      .setCustomId('introInput')
      .setLabel('What\'s going on? Give us the details!')
      .setStyle(TextInputStyle.Paragraph)));
    await interaction.showModal(modal);
  },
  async submit(interaction, memberInput, triageGiven, introGiven) {
    logger.debug(`[${PREFIX}] starting!`);
    logger.debug(`[${PREFIX}] memberInput: ${memberInput}`);

    // Get the input from the modal, if it was submitted
    let triageInput = triageGiven;
    let introInput = introGiven;
    // Otherwise get the input from the modal, if it was submitted
    if (interaction.fields) {
      triageInput = interaction.fields.getTextInputValue('triageInput');
      introInput = interaction.fields.getTextInputValue('introInput');
    }
    logger.debug(`[${PREFIX}] triageInput: ${triageInput}`);
    logger.debug(`[${PREFIX}] introInput: ${introInput}`);

    // Get the roles we'll be referencing
    const roleNeedshelp = interaction.guild.roles.cache.find(role => role.id === roleNeedshelpId);
    logger.debug(`[${PREFIX}] roleNeedshelp: ${roleNeedshelp}`);
    const roleTripsitter = interaction.guild.roles.cache.find(role => role.id === roleTripsitterId);
    logger.debug(`[${PREFIX}] roleTripsitter: ${roleTripsitter}`);
    const roleHelper = interaction.guild.roles.cache.find(role => role.id === roleHelperId);
    logger.debug(`[${PREFIX}] roleHelper: ${roleHelper}`);
    const roleDeveloper = interaction.guild.roles.cache.find(role => role.id === roleDeveloperId);
    logger.debug(`[${PREFIX}] roleDeveloper: ${roleDeveloper}`);

    // Get the channels we'll be referencing
    const channelHowToTripsit = interaction.client.channels.cache
      .find(channel => channel.id === channelHowToTripsitId);
    logger.debug(`[${PREFIX}] channelHowToTripsit: ${channelHowToTripsit}`);

    const channelOpenTripsit = interaction.guild.channels.cache
      .find(chan => chan.id === channelOpentripsitId);

    // Determine the actor.
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] actor: ${actor.user.username}#${actor.user.discriminator}`);

    // Determine if this command was started by a Developer
    const actorHasRoleDeveloper = actor.roles.cache.find(
      role => role.id === roleDeveloper.id,
    ) !== undefined;
    logger.debug(`[${PREFIX}] actorHasRoleDeveloper: ${actorHasRoleDeveloper}`);

    // Determine the target.
    // If the user clicked the button, the target is whoever started the interaction.
    // Otherwise, the target is the user mentioned in the /tripsit command.
    const target = memberInput || interaction.member;
    logger.debug(`[${PREFIX}] target: ${target}`);

    // Get a list of the target's roles
    const targetRoleNames = target.roles.cache.map(role => role.name);
    logger.debug(`[${PREFIX}] targetRoleNames: ${targetRoleNames}`);

    // Check if the target already needs help
    const targetHasRoleNeedshelp = target.roles.cache.find(
      role => role === roleNeedshelp,
    ) !== undefined;
    logger.debug(`[${PREFIX}] targetHasRoleNeedshelp: ${targetHasRoleNeedshelp}`);

    const targetHasRoleDeveloper = target.roles.cache.find(
      role => role === roleDeveloper,
    ) !== undefined;
    logger.debug(`[${PREFIX}] targetHasRoleDeveloper: ${targetHasRoleDeveloper}`);

    // Get the target lastHelped information from the db
    const [targetData, targetFbid] = await getUserInfo(target);
    const targetAction = `${PREFIX}_received`;
    const targetLastHelpedDate = new Date(targetData.discord.lastHelpedDate);
    logger.debug(`[${PREFIX}] targetLastHelpedDate: ${targetLastHelpedDate}`);
    const targetLastHelpedThreadId = targetData.discord.lastHelpedThreadId;
    logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);
    const targetLastHelpedMetaThreadId = targetData.discord.lastHelpedMetaThreadId;
    logger.debug(`[${PREFIX}] targetLastHelpedMetaThreadId: ${targetLastHelpedMetaThreadId}`);

    // Get the channel objects for the help and meta threads
    // const threadHelpUser = interaction.client.channels.cache.get(targetLastHelpedThreadId);
    let threadHelpUser = interaction.client.channels.cache.get(targetLastHelpedThreadId);
    logger.debug(`[${PREFIX}] threadHelpUser: ${threadHelpUser}`);

    let threadDiscussUser = interaction.client.channels.cache.get(targetLastHelpedMetaThreadId);
    logger.debug(`[${PREFIX}] threadDiscussUser: ${threadDiscussUser}`);

    // ██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗
    // ██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
    // ██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗
    // ██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝
    // ╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗
    //  ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
    if (targetHasRoleNeedshelp && threadHelpUser !== undefined && threadDiscussUser !== undefined) {
      logger.debug(`[${PREFIX}] Target already needs help, updating existing threads!`);
      // A user will have the NeedsHelp role when they click the button.
      // After they click the button, their roles are saved and then removed
      // So we need to stop the code below from saving an empty list of roles
      // We trust that the button did it's job and saved the roles and applied the channels,
      // so it assumes that it doesn't need to do anything as long as the user has this role.

      // Remind the user that they have a channel open
      try {
        let message = memberInput
          ? stripIndents`Hey ${interaction.member}, ${target.nickname || target.user.username} is already being helped!

          Check your channel list for '${threadHelpUser.toString()} to help them!'`
          : stripIndents`Hey ${interaction.member}, you are already being helped!

          Check your channel list for '${threadHelpUser.toString()} to get help!`;

        if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
          message = testNotice + message;
        }

        const embed = template.embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(message);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] Rejected need for help`);

        // Send the update message to the thread
        let helpMessage = memberInput
          ? stripIndents`
          Hey ${target}, the team thinks you could still use assistance!
          ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper} will be with you as soon as they're available!
          If this is a medical emergency please contact your local /EMS
          We do not call EMS or ambulance on behalf of anyone.`
          : stripIndents`
          Hey ${target}, thank you for the update!
          **If no responds right away you can try chatting in ${channelOpenTripsit}**

          You've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

          Your issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

          ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper} will be with you as soon as they're available!
          If this is a medical emergency please contact your local /EMS
          We do not call EMS or ambulance on behalf of anyone.`;

        if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
          helpMessage = testNotice + helpMessage;
        }

        if (threadHelpUser && !memberInput) {
          threadHelpUser.send(helpMessage);
        }
        logger.debug(`[${PREFIX}] Pinged user in help thread`);

        // Update the meta thread
        if (threadDiscussUser) {
          let metaUpdate = memberInput
            ? stripIndents`Hey ${interaction.member}, ${target.nickname || target.user.username} is already being helped!
            Use this thread to discuss it!'`
            : stripIndents`Hey ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper}, ${target.nickname || target.user.username} sent a new request for help in ${threadHelpUser.toString()}!

            They've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

            Their issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}`;
          if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
            metaUpdate = testNotice + metaUpdate;
          }
          threadDiscussUser.send(metaUpdate);
        }

        logger.debug(`[${PREFIX}] Updated meta help thread`);

        return;
      } catch (err) {
        logger.debug(`[${PREFIX}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
      }
    }

    // Team check - Cannot be run on team members
    // This this user is a developer then this is a test run and ignore this check,
    // but we'll change the output down below to make it clear this is a test.
    let targetIsTeamMember = false;
    if (!actorHasRoleDeveloper) {
      target.roles.cache.forEach(async role => {
        if (teamRoles.includes(role.id)) {
          targetIsTeamMember = true;
        }
      });
      if (targetIsTeamMember) {
        logger.debug(`[${PREFIX}] Target is a team member!`);
        const teamMessage = memberInput
          ? stripIndents`Hey ${actor}, ${target.nickname || target.user.username} is a team member!
          Did you mean to do that?`
          : stripIndents`You are a member of the team and cannot be publicly helped!
          Try asking in #teamtripsit =)`;
        const embed = template.embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(teamMessage);
        if (!interaction.replied) {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        return;
      }
    }
    logger.debug(`[${PREFIX}] Target is not a team member!`);

    // Remove all roles, except team and vanity, from the target
    target.roles.cache.forEach(role => {
      logger.debug(`[${PREFIX}] role: ${role.name} - ${role.id}`);
      if (!ignoredRoles.includes(role.id) && !role.name.includes('@everyone') && !role.name.includes('NeedsHelp')) {
        logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.nickname || target.user.username}`);
        try {
          target.roles.remove(role);
        } catch (err) {
          logger.debug(`[${PREFIX}] There was an error removing the role ${role.name} from ${target.nickname || target.user.username}\n${err}`);
        }
      }
    });

    // Add the needsHelp role to the target
    try {
      logger.debug(`[${PREFIX}] Adding role ${roleNeedshelp.name} to ${target.nickname || target.user.username}`);
      await target.roles.add(roleNeedshelp);
    } catch (err) {
      logger.error(`[${PREFIX}] Error adding role to target: ${err}`);
      return interaction.reply(stripIndents`There was an error adding the NeedsHelp role!
      Make sure the bot's role is higher than NeedsHelp in the Role list!`);
    }

    // ██████╗ ███████╗ ██████╗ ██████╗ ███████╗███╗   ██╗
    // ██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝████╗  ██║
    // ██████╔╝█████╗  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║
    // ██╔══██╗██╔══╝  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║
    // ██║  ██║███████╗╚██████╔╝██║     ███████╗██║ ╚████║
    // ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝
    // If the user has been helped in the last week, direct them to the existing thread
    if (targetLastHelpedDate) {
      const lastWeek = Date.now() - (1000 * 60 * 60 * 24 * 7);
      logger.debug(`[${PREFIX}] lastHelp: ${targetLastHelpedDate.valueOf()}`);
      logger.debug(`[${PREFIX}] lastWeek: ${lastWeek}`);
      if (targetLastHelpedDate.valueOf() > lastWeek) {
        logger.debug(`[${PREFIX}] Target was last helped within the last week!`);
        // Ping them in the open thread
        try {
          // Respond to the user and remind them they have an open thread
          let message = memberInput
            ? stripIndents`
              Hey ${actor}, thank you for requestiong assistance on the behalf of ${target.user.username}!

              Click here to be taken to their private room: ${threadHelpUser.toString()}

              You can also click in your channel list to see their private room!`
            : stripIndents`
              Hey ${target}, thank you for asking for assistance!

              Click here to be taken to your private room: ${threadHelpUser.toString()}

              You can also click in your channel list to see your private room!`;

          if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
            message = testNotice + message;
          }

          const embed = template.embedTemplate()
            .setColor(Colors.DarkBlue)
            .setDescription(message);

          interaction.reply({ embeds: [embed], ephemeral: true });

          // Send the intro message to the thread
          let firstMessage = memberInput
            ? stripIndents`
            Hey ${target}, the team thinks you could still use assistance!
            ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper} will be with you as soon as they're available!
            If this is a medical emergency please contact your local /EMS
            We do not call EMS or ambulance on behalf of anyone.`
            : stripIndents`
            Hey ${target}, thank you for asking for help!

            You've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

            Your issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

            ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper} will be with you as soon as they're available!
            If this is a medical emergency please contact your local /EMS
            We do not call EMS or ambulance on behalf of anyone.

            **If no responds right away you can try chatting in ${channelOpenTripsit}**`;

          if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
            firstMessage = testNotice + firstMessage;
          }
          threadHelpUser.send(firstMessage);

          // Update the meta thread too
          let helperMsg = memberInput
            ? stripIndents`
            Hey ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper}, ${actor} sent a new request for help on behalf of ${target.nickname || target.user.username} in ${threadHelpUser.toString()}!

            They've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

            Their issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

            Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!`
            : stripIndents`
            Hey ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper}, ${target.nickname || target.user.username} sent a new request for help in ${threadHelpUser.toString()}!

            They've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

            Their issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

            Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!`;
          if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
            helperMsg = testNotice + helperMsg;
          }
          threadDiscussUser.send(helperMsg);

          targetData.discord.roles = targetRoleNames;
          targetData.discord.lastHelpedDate = new Date();

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

    // ███╗   ██╗███████╗██╗    ██╗
    // ████╗  ██║██╔════╝██║    ██║
    // ██╔██╗ ██║█████╗  ██║ █╗ ██║
    // ██║╚██╗██║██╔══╝  ██║███╗██║
    // ██║ ╚████║███████╗╚███╔███╔╝
    // ╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝
    // Get the tripsitters channel from the guild
    const tripsittersChannel = interaction.guild.channels.cache
      .find(chan => chan.id === channelTripsittersId);

    // Get the tripsit channel from the guild
    const tripsitChannel = interaction.guild.channels.cache
      .find(chan => chan.id === channelTripsitId);

    // Create a new threadDiscussUser in the tripsitters channel
    threadDiscussUser = await tripsittersChannel.threads.create({
      name: `${target.user.username} discuss here!`,
      autoArchiveDuration: 1440,
      type: NODE_ENV === 'production' ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
      reason: `${target.user.username} requested help`,
      invitable: NODE_ENV === 'production' ? false : null,
    });
    logger.debug(`[${PREFIX}] Created meta-thread ${threadDiscussUser.id}`);

    // Create a new private thread in the channel
    // If we're not in production we need to create a public thread
    threadHelpUser = await tripsitChannel.threads.create({
      name: `${target.nickname || target.user.username} chat here!`,
      autoArchiveDuration: 1440,
      type: NODE_ENV === 'production' ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
      reason: `${target.nickname || target.user.username} requested help`,
    });
    logger.debug(`[${PREFIX}] Created threadHelpUser ${threadHelpUser.id}`);

    // Send the triage info to the thread
    let replyMessage = memberInput
      ? stripIndents`
        Hey ${interaction.member}, we've activated tripsit mode on ${target.user.username}!

        Check your channel list for ${threadHelpUser.toString()} to talk to the user

        Check your channel list for ${threadDiscussUser.toString()} to meta-talk about the user

        **Be sure add some information about the user to the thread!**`
      : stripIndents`
        Hey ${target}, thank you for asking for assistance!

        Click here to be taken to your private room: ${threadHelpUser.toString()}

        You can also click in your channel list to see your private room!`;

    if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
      replyMessage = testNotice + replyMessage;
    }

    const embed = template.embedTemplate()
      .setColor(Colors.DarkBlue)
      .setDescription(replyMessage);
    interaction.reply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] Sent response to user`);

    // Send the intro message to the threadHelpUser
    let firstMessage = memberInput
      ? stripIndents`
      Hey ${target}, the team thinks you could use assistance!
      ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper} will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.`
      : stripIndents`
      Hey ${target}, thank you for asking for assistance!

      You've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

      Your issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

      ${actorHasRoleDeveloper ? 'tripsitters' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helpers' : roleHelper} will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
      When you're feeling better you can use the "I'm Good" button to let the team know you're okay.`;

    if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
      firstMessage = testNotice + firstMessage;
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tripsat')
          .setLabel('I\'m good now!')
          .setStyle(ButtonStyle.Success),
      );

    await threadHelpUser.send({ content: firstMessage, components: [row] });
    logger.debug(`[${PREFIX}] Sent intro message to threadHelpUser ${threadHelpUser.id}`);

    // Send the intro message to the thread
    let helperMsg = memberInput
      ? stripIndents`
      Hey ${actorHasRoleDeveloper ? 'tripsitter' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helper' : roleHelper}, ${actor} thinks ${target.nickname || target.user.username} can use some help in ${threadHelpUser.toString()}!

      They've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

      Their issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

      Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

      *You're receiving this alert because you're a Helper/Tripsitter!*
      *Only Tripsitters, Helpers and Moderators can see this thread*!
      *You can remove the helper role in ${channelHowToTripsit.toString()}*!`
      : stripIndents`
      Hey ${actorHasRoleDeveloper ? 'tripsitter' : roleTripsitter} and ${actorHasRoleDeveloper ? 'helper' : roleHelper}, ${target.nickname || target.user.username} can use some help in ${threadHelpUser.toString()}!

      They've taken: ${triageInput ? `\n${triageInput}` : '\n*No info given*'}

      Their issue: ${introInput ? `\n${introInput}` : '\n*No info given*'}

      Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

      *You're receiving this alert because you're a Helper/Tripsitter!*
      *Only Tripsitters, Helpers and Moderators can see this thread*!
      *You can remove the helper role in ${channelHowToTripsit.toString()}*!`;
    // send a message to the thread

    if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
      helperMsg = testNotice + helperMsg;
    }

    const endSession = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`tripsat_${target.id}`)
          .setLabel('They\'re good now!')
          .setStyle(ButtonStyle.Success),
      );

    await threadDiscussUser.send({ content: helperMsg, components: [endSession] });
    logger.debug(`[${PREFIX}] Sent intro message to meta-thread ${threadDiscussUser.id}`);

    // Update targetData with how many times they've been helped
    logger.debug(`[${PREFIX}] Updating target data`);
    if ('discord' in targetData) {
      if ('modActions' in targetData.discord) {
        targetData.discord.modActions[targetAction] = (
          targetData.discord.modActions[targetAction] || 0) + 1;
      } else {
        targetData.discord.modActions = { [targetAction]: 1 };
      }
    } else {
      targetData.discord = { modActions: { [targetAction]: 1 } };
    }

    // Update database information
    targetData.discord.lastHelpedThreadId = threadHelpUser.id;
    targetData.discord.lastHelpedMetaThreadId = threadDiscussUser.id;
    targetData.discord.roles = targetRoleNames;
    targetData.discord.lastHelpedDate = new Date();
    // TODO: Use transactions
    await setUserInfo(targetFbid, targetData);

    // // Extract actor data
    // const [actorData, actorFbid] = await getUserInfo(actor);

    // // Transform actor data
    // const actorAction = `${PREFIX}_sent`;
    // logger.debug(`[${PREFIX}] Updating actor data`);
    // if ('discord' in actorData) {
    //   if ('modActions' in actorData.discord) {
    //     actorData.discord.modActions[actorAction] = (
    //       actorData.discord.modActions[actorAction] || 0) + 1;
    //   } else {
    //     actorData.discord.modActions = { [actorAction]: 1 };
    //   }
    // } else {
    //   actorData.discord = { modActions: { [actorAction]: 1 } };
    // }

    // // save the actor's data
    // setUserInfo(actorFbid, actorData);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
