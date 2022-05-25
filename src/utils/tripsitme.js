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
  async submit(interaction) {
    // After the user submits the modal
    const target = interaction.member;
    const testRun = target.id === discordOwnerId || target.id.toString() === '332687787172167680';
    const triageInput = interaction.fields.getTextInputValue('triageInput');
    const introInput = interaction.fields.getTextInputValue('introInput');
    // logger.debug(`[${PREFIX}] target: ${target}`);
    // logger.debug(`[${PREFIX}] testRun: ${testRun}`);
    // logger.debug(`[${PREFIX}] triageInput: ${triageInput}`);
    // logger.debug(`[${PREFIX}] introInput: ${introInput}`);

    // Get a list of the target's roles
    const targetRoleNames = target.roles.cache.map(role => role.name);
    // logger.debug(`[${PREFIX}] targetRoleNames: ${targetRoleNames}`);

    const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedshelpId);
    const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === roleTripsitterId);
    const helperRole = interaction.guild.roles.cache.find(role => role.id === roleHelperId);

    // Loop through userRoles and check if the target has roles
    const targetHasNeedsHelpRole = targetRoleNames.some(role => role === needsHelpRole.name);
    // logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

    // Update the DB with the target information
    const [targetData, targetFbid] = await getUserInfo(target);
    const targetAction = `${PREFIX}_received`;
    const targetLastHelpedDate = targetData.lastHelpedDate;
    const targetLastHelpedThreadId = targetData.lastHelpedThreadId;
    const targetLastHelpedMetaThreadId = targetData.lastHelpedMetaThreadId;
    const helpThread = interaction.guild.channels.cache
      .find(chan => chan.id === targetLastHelpedThreadId);
    const metaHelpThread = interaction.guild.channels.cache
      .find(chan => chan.id === targetLastHelpedMetaThreadId);
    logger.debug(`[${PREFIX}] targetLastHelpedDate: ${typeof targetLastHelpedDate}`);
    logger.debug(`[${PREFIX}] targetLastHelpedDate: ${targetLastHelpedDate}`);
    // logger.debug(`[${PREFIX}] targetLastHelpedDate: ${targetLastHelpedDate.seconds}`);
    logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);
    logger.debug(`[${PREFIX}] targetLastHelpedMetaThreadId: ${targetLastHelpedMetaThreadId}`);

    if (targetHasNeedsHelpRole) {
      // If the user already has the needs help role, ignore the request
      const embed = template.embedTemplate()
        .setColor('DARK_BLUE')
        .setDescription(stripIndents`
          Hey ${interaction.member}, you're already being helped!\n\n
          Check your channel list for '${helpThread.toString()}'
        `);
      if (helpThread) {
        helpThread.send(stripIndents`
          Hey ${target}, use this thread to keep in touch with the Team!
        `);
      }
      if (metaHelpThread) {
        metaHelpThread.send(stripIndents`
        ${target.user.username} has submitted a new request for assistance:

        They've taken: ${triageInput ? `\n${triageInput}` : '*No info given*'}

        Their issue: ${introInput ? `\n${introInput}` : '*No info given*'}
        `);
      }
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Team check
    target.roles.cache.forEach(role => {
      if (role === 'Admin' || role === 'Operator' || role === 'Moderator' || role === 'Tripsitter') {
        const embed = template.embedTemplate()
          .setColor('DARK_BLUE')
          .setDescription('You are a member of the team and cannot be publicly helped! Try asking in #teamtripsit');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    });

    logger.debug(`[${PREFIX}] Updating target data`);
    if ('mod_actions' in targetData) {
      targetData.mod_actions[targetAction] = (targetData.mod_actions[targetAction] || 0) + 1;
    } else {
      targetData.mod_actions = { [targetAction]: 1 };
    }

    // Remove all roles from the target
    target.roles.cache.forEach(role => {
      if (role.name !== '@everyone') {
        logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.user.username}`);
        target.roles.remove(role);
      }
    });

    try {
      // Add the needsHelp role to the target
      logger.debug(`[${PREFIX}] Adding role ${needsHelpRole.name} to ${target.user.username}`);
      await target.roles.add(needsHelpRole);
    } catch (err) {
      logger.error(`[${PREFIX}] Error adding role to target: ${err}`);
      return interaction.reply(stripIndents`There was an error adding the NeedsHelp role!
      Make sure the bot's role is higher than NeedsHelp in the Role list!`);
    }

    if (targetLastHelpedDate) {
      const lastWeek = Date.now() - (1000 * 60 * 60 * 24 * 7);
      logger.debug(`[${PREFIX}] lastWeek: ${lastWeek}`);
      if (targetLastHelpedDate.seconds * 1000 > lastWeek) {
        logger.debug(`[${PREFIX}] Target was last helped within the last week!`);
        // If the user has been helped in the last week, direct them to the existing thread
        // If the user has a thread open, ping them
        helpThread.send(stripIndents`
          Hey ${target}, use this thread to keep in touch with the Team!
        `);
        metaHelpThread.send(stripIndents`
          ${target.user.username} has submitted a new request for assistance:

          They've taken: ${triageInput ? `\n${triageInput}` : '*No info given*'}

          Their issue: ${introInput ? `\n${introInput}` : '*No info given*'}
        `);
        const embed = template.embedTemplate()
          .setColor('DARK_BLUE')
          .setDescription(stripIndents`
            Hey ${target}, thank you for asking for assistance!

            Click here to be taken to your private room: ${helpThread.toString()}

            You can also click in your channel list to see your private room!`);

        interaction.reply({ embeds: [embed], ephemeral: true });
        targetData.roles = targetRoleNames;
        targetData.lastHelpedDate = new Date();

        // TODO: Use transactions
        await setUserInfo(targetFbid, targetData);

        logger.debug(`[${PREFIX}] finished!`);
        return;
      }
    }

    // Create a new private thread in the channel
    // If we're not in production we need to create a public thread
    const thread = await interaction.channel.threads.create({
      name: `${target.user.username} chat here!`,
      autoArchiveDuration: 1440,
      type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
      reason: `${target.user.username} requested help`,
    });
    // Send the intro message to the thread
    await thread.send(stripIndents`
      Hey ${target}, thank you for asking for assistance!
      A ${testRun ? 'tripsitter' : tripsitterRole}s or ${testRun ? 'helper' : helperRole}s will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
    `);
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription(stripIndents`
      Hey ${target}, thank you for asking for assistance!

      Click here to be taken to your private room: ${thread.toString()}

      You can also click in your channel list to see your private room!`);

    interaction.reply({ embeds: [embed], ephemeral: true });
    targetData.lastHelpedThreadId = thread.id;

    // Get the tripsitters channel from the guild
    const tripsittersChannel = interaction.guild.channels.cache
      .find(chan => chan.id === channelTripsittersId);

    // Create a new thread in the channel with
    const helperThread = await tripsittersChannel.threads.create({
      name: `${target.user.username} discuss here!`,
      autoArchiveDuration: 1440,
      type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
      reason: `${target.user.username} requested help`,
    });

    const channelTripsitInfo = interaction.client.channels.cache.get(channelTripsitInfoId);

    const helperMsg = stripIndents`
    Hey ${testRun ? 'tripsitter' : tripsitterRole}s and ${testRun ? 'helper' : helperRole}s, ${target.user.username} can use some help in ${thread.toString()}!

    They've taken: ${triageInput ? `\n${triageInput}` : '*No info given*'}

    Their issue: ${introInput ? `\n${introInput}` : '*No info given*'}

    Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

    *You're receiving this alert because you're a Helper/Tripsitter!*
    *Only Tripsitters, Helpers and Moderators can see this thread*!
    *You can remove the helper role in ${channelTripsitInfo.toString()}*!
    `;
    // send a message to the thread
    await helperThread.send(helperMsg);

    targetData.lastHelpedMetaThreadId = helperThread.id;
    targetData.roles = targetRoleNames;
    targetData.lastHelpedDate = new Date();

    // TODO: Use transactions
    await setUserInfo(targetFbid, targetData);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
