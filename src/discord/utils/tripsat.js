'use strict';

const PREFIX = require('path').parse(__filename).name;
const {
  Colors,
} = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../global/utils/logger');
const { getUserInfo } = require('../../global/services/firebaseAPI');

const template = require('./embed-template');

const {
  NODE_ENV,
  channelTripsittersId,
  channelOpentripsitId,
  channelSanctuaryId,
  roleNeedshelpId,
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

const testNotice = '🧪THIS IS A TEST PLEASE IGNORE🧪\n\n';

const invisibleEmoji = NODE_ENV === 'production'
  ? '<:invisible:976853930489298984>'
  : '<:invisible:976824380564852768>';

module.exports = {
  async execute(interaction, memberInput) {
    logger.debug(`[${PREFIX}] starting!`);
    await interaction.deferReply({ ephemeral: true });

    let target = interaction.member;
    const actor = interaction.member;
    if (memberInput) {
      target = memberInput;
    }

    const [targetData] = await getUserInfo(target);
    const targetLastHelpedDate = targetData.discord.lastHelpedDate;
    logger.debug(`[${PREFIX}] targetLastHelpedDate: ${targetLastHelpedDate}`);
    const targetLastHelpedThreadId = targetData.discord.lastHelpedThreadId;
    logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);
    const targetLastHelpedMetaThreadId = targetData.discord.lastHelpedMetaThreadId;
    logger.debug(`[${PREFIX}] targetLastHelpedMetaThreadId: ${targetLastHelpedMetaThreadId}`);

    const tripsittersChannel = interaction.guild.channels.cache.get(channelTripsittersId);
    const channelOpentripsit = await interaction.client.channels.cache.get(channelOpentripsitId);
    const channelSanctuary = await interaction.client.channels.cache.get(channelSanctuaryId);
    // Get the channel objects for the help and meta threads
    const threadHelpUser = interaction.guild.channels.cache
      .find(chan => chan.id === targetLastHelpedThreadId);
    const threadDiscussUser = interaction.guild.channels.cache
      .find(chan => chan.id === targetLastHelpedMetaThreadId);

    const roleDeveloper = actor.roles.cache.find(role => role.id === roleDeveloperId);
    const roleNeedshelp = interaction.guild.roles.cache.find(role => role.id === roleNeedshelpId);

    const actorHasRoleDeveloper = actor.roles.cache.find(
      role => role === roleDeveloper,
    ) !== undefined;
    logger.debug(`[${PREFIX}] actorHasRoleDeveloper: ${actorHasRoleDeveloper}`);

    const targetHasRoleDeveloper = target.roles.cache.find(
      role => role === roleDeveloper,
    ) !== undefined;
    logger.debug(`[${PREFIX}] targetHasRoleDeveloper: ${targetHasRoleDeveloper}`);

    const targetHasNeedsHelpRole = target.roles.cache.find(
      role => role === roleNeedshelp,
    ) !== undefined;
    logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

    if (!targetHasNeedsHelpRole) {
      let rejectMessage = memberInput
        ? `Hey ${interaction.member}, ${target.nickname || target.user.username} isnt currently being taken care of!`
        : `Hey ${interaction.member}, you're not currently being taken care of!`;

      if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
        rejectMessage = testNotice + rejectMessage;
      }
      const embed = template.embedTemplate().setColor(Colors.DarkBlue);
      embed.setDescription(rejectMessage);
      logger.debug(`[${PREFIX}] target ${target} does not need help!`);
      interaction.editReply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] finished!`);
      return;
    }

    if (targetLastHelpedDate && !memberInput) {
      const lastHour = Date.now() - (1000 * 60 * 60);
      logger.debug(`[${PREFIX}] lastHelp: ${targetLastHelpedDate.seconds * 1000}`);
      logger.debug(`[${PREFIX}] lastHour: ${lastHour}`);
      if (targetLastHelpedDate.seconds * 1000 > lastHour) {
        let message = stripIndents`Hey ${interaction.member} you just asked for help recently!
        Take a moment to breathe and wait for someone to respond =)
        Maybe try listening to some lofi music while you wait?
        You can also talk **calmly** in ${channelSanctuary} or ${channelOpentripsit}`;

        if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
          message = testNotice + message;
        }

        const embed = template.embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(message);
        interaction.editReply({ embeds: [embed], ephemeral: true });

        if (threadDiscussUser) {
          let metaUpdate = stripIndents`Hey team, ${target.nickname || target.user.username} said they're good but it's been less than an hour since they asked for help.

            If they still need help it's okay to leave them with that role.
            If you're sure they don't need help you can use /tripsit to turn off TripSit-Mode`;
          if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
            metaUpdate = testNotice + metaUpdate;
          }
          threadDiscussUser.send(metaUpdate);
        }

        logger.debug(`[${PREFIX}] finished!`);

        logger.debug(`[${PREFIX}] Rejected the "im good" button`);
        return;
      }
    }

    // For each role in targetRoles2, add it to the target
    if (targetData.discord.roles) {
      targetData.discord.roles.forEach(roleName => {
        const roleObj = interaction.guild.roles.cache.find(r => r.name === roleName);
        if (!ignoredRoles.includes(roleObj.id) && roleName !== '@everyone') {
          logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.nickname || target.user.username}`);
          try {
            target.roles.add(roleObj);
          } catch (err) {
            logger.error(`[${PREFIX}] Error adding role ${roleObj.name} to ${target.nickname || target.user.username}`);
            logger.error(err);
          }
        }
      });
    }

    target.roles.remove(roleNeedshelp);
    logger.debug(`[${PREFIX}] Removed ${roleNeedshelp.name} from ${target.nickname || target.user.username}`);

    let endHelpMessage = memberInput
      ? stripIndents`Hey ${target.nickname || target.user.username}, it looks like you're doing better =)
      This thread will remain here for a day if you want to follow up tomorrow.
      After 7 days, or on request, it will be deleted to preserve your privacy =)`
      : stripIndents`Hey ${target}, we're glad you're doing better!
      We've restored your old roles back to normal <3
      This thread will remain here for a day if you want to follow up tomorrow.
      After 7 days, or on request, it will be deleted to preserve your privacy =)`;

    if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
      endHelpMessage = testNotice + endHelpMessage;
    }

    try {
      threadHelpUser.send(endHelpMessage);
    } catch (err) {
      // logger.error(`[${PREFIX}] Error sending end help message to ${threadHelpUser}`);
      // logger.error(err);
    }

    let message = '';
    await threadHelpUser.send(stripIndents`
        ${invisibleEmoji}
        > **If you have a minute, your feedback is important to us!**
        > Please rate your experience with the TripSit service by reacting below.
        > Thank you!
        ${invisibleEmoji}
        `)
      .then(async msg => {
        message = msg;
        await msg.react('🙁');
        await msg.react('😕');
        await msg.react('😐');
        await msg.react('🙂');
        await msg.react('😁');

        // Setup the reaction collector
        const filter = (reaction, user) => user.id === target.id;
        const collector = message.createReactionCollector({ filter, time: 1000 * 60 * 60 * 24 });
        collector.on('collect', async (reaction, user) => {
          threadHelpUser.send(stripIndents`
            ${invisibleEmoji}
            > Thank you for your feedback, here's a cookie! 🍪
            ${invisibleEmoji}
            `);
          logger.debug(`[${PREFIX}] Collected ${reaction.emoji.name} from ${user.tag}`);
          const finalEmbed = template.embedTemplate()
            .setColor(Colors.Blue)
            .setDescription(`Collected ${reaction.emoji.name} from ${user.tag}`);
          logger.debug(`[${PREFIX}] tripsittersChannel ${tripsittersChannel}`);
          try {
            if (threadDiscussUser) {
              await threadDiscussUser.send({ embeds: [finalEmbed] });
            }
          } catch (err) {
            logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
          }
          msg.delete();
          collector.stop();
        });
      });

    let endMetaHelpMessage = memberInput
      ? stripIndents`${actor.user.username} has indicated that ${target.nickname || target.user.username} no longer needs help!
      *This thread, and ${threadHelpUser}, will remain un-archived for 24 hours to allow the user to follow-up.
      If the user requests help again within 7 days these threads will be un-archived.
      After 7 days the threads will be deleted to preserve privacy.*`
      : stripIndents`${target.nickname || target.user.username} has indicated that they no longer need help!
      *This thread, and the #tripsit thread, will remain un-archived for 24 hours to allow the user to follow-up.
      If the user requests help again within 7 days these threads will be un-archived.
      After 7 days the threads will be deleted to preserve privacy.*`;

    if (actorHasRoleDeveloper && targetHasRoleDeveloper) {
      endMetaHelpMessage = testNotice + endMetaHelpMessage;
    }

    threadDiscussUser.send(endMetaHelpMessage);

    logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);
    logger.debug(`[${PREFIX}] finished!`);
    await interaction.editReply({ content: 'Done!', ephemeral: true });
  },
  // async submit(interaction) {
  //   const feedback = interaction.fields.getTextInputValue('feedbackReport');
  //   logger.debug(feedback);
  // },
};
