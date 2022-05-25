'use strict';

const PREFIX = require('path').parse(__filename).name;
// const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const logger = require('./logger');
const { getUserInfo } = require('./firebase');

const template = require('./embed-template');

const {
  roleNeedshelpId,
  channelModlogId,
} = require('../../env');

module.exports = {
  async execute(interaction, memberInput) {
    let target = interaction.member;
    const actor = interaction.member;
    if (memberInput) {
      target = memberInput;
    }

    // Get a list of the target's roles
    const targetRoleNames = target.roles.cache.map(role => role.name);
    // logger.debug(`[${PREFIX}] targetRoleNames: ${targetRoleNames}`);

    const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedshelpId);

    // Loop through userRoles and check if the target has roles
    const targetHasNeedsHelpRole = targetRoleNames.some(role => role === needsHelpRole.name);
    // logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

    if (!targetHasNeedsHelpRole) {
      const rejectMessage = memberInput
        ? `Hey ${interaction.member}, ${target.user.username} isnt currently being taken care of!`
        : `Hey ${interaction.member}, you're not currently being taken care of!`;
      const embed = template.embedTemplate().setColor('DARK_BLUE');
      embed.setDescription(rejectMessage);
      logger.debug(`[${PREFIX}] target ${target} does not need help!`);
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] finished!`);
      return;
    }

    await target.roles.remove(needsHelpRole);
    logger.debug(`[${PREFIX}] Removed ${needsHelpRole.name} from ${target.user.username}`);

    const targetResults = await getUserInfo(target);
    const targetData = targetResults[0];
    const targetLastHelpedThreadId = targetData.lastHelpedThreadId;
    logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);
    const targetLastHelpedMetaThreadId = targetData.lastHelpedMetaThreadId;
    logger.debug(`[${PREFIX}] targetLastHelpedMetaThreadId: ${targetLastHelpedMetaThreadId}`);

    // Get the channel objects for the help and meta threads
    const helpThread = interaction.guild.channels.cache
      .find(chan => chan.id === targetLastHelpedThreadId);
    const metaHelpThread = interaction.guild.channels.cache
      .find(chan => chan.id === targetLastHelpedMetaThreadId);

    // For each role in targetRoles2, add it to the target
    if (targetData.roles) {
      targetData.roles.forEach(roleName => {
        if (roleName !== '@everyone') {
          const roleObj = interaction.guild.roles.cache.find(r => r.name === roleName);
          logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.user.username}`);
          target.roles.add(roleObj);
        }
      });
    }

    const responseMessage = memberInput
      ? stripIndents`
      Hey ${interaction.member}, we're glad ${target.user.username} is feeling better!
      We've restored their roles back to normal.
      You can keep talking with them in ${helpThread} if needed!`
      : stripIndents`
      Hey ${interaction.member}, we're glad you're feeling better =)
      We've restored your old roles back to normal.
      You can keep talking in ${helpThread} if you want to follow up tomorrow!`;
    const embed = template.embedTemplate().setColor('DARK_BLUE');
    embed.setDescription(responseMessage);
    interaction.reply({ embeds: [embed], ephemeral: true });

    const endHelpMessage = memberInput
      ? stripIndents`Hey ${target.user.username}, it looks like you're doing better =)
      This thread will remain here for a day if you want to follow up tomorrow.
      After 7 days, or on request, it will be deleted to preserve your privacy =)`
      : stripIndents`Hey ${target}, we're glad you're doing better!
      This thread will remain here for a day if you want to follow up tomorrow.
      After 7 days, or on request, it will be deleted to preserve your privacy =)`;
    helpThread.send(endHelpMessage);

    let message = '';
    await helpThread.send(stripIndents`
        <:invisible:976824380564852768>
        > **If you have a minute, your feedback is important to us!**
        > Please rate your experience with the TripSit service by reacting below.
        > You'll have the option to give confidential feedback, or just click submit.
        > Thank you!
        <:invisible:976824380564852768>
        `)
      .then(async msg => {
        message = msg;
        await msg.react('😁');
        await msg.react('🙂');
        await msg.react('😐');
        await msg.react('😕');
        await msg.react('🙁');
        // Setup the reaction collector
        const filter = (reaction, user) => user.id === target.id;
        const collector = message.createReactionCollector({ filter, time: 1000 * 60 * 60 * 24 });
        collector.on('collect', async (reaction, user) => {
          helpThread.send(stripIndents`
            <:invisible:976824380564852768>
            > Thank you for your feedback, here's a cookie! 🍪
            <:invisible:976824380564852768>
            `);
          // // Create the modal
          // const modal = new Modal()
          //   .setCustomId('feedbackModal')
          //   .setTitle('TripSit Feedback Form');
          // const bugReport = new TextInputComponent()
          //   .setCustomId('feedbackReport')
          //   .setLabel('What feedback do you have for the team?')
          //   .setStyle('PARAGRAPH');
          // // An action row only holds one text input, so you need one action row per text input.
          // const firstActionRow = new MessageActionRow().addComponents(bugReport);
          // // Add inputs to the modal
          // modal.addComponents(firstActionRow);
          // // Show the modal to the user
          // // interaction.showModal(modal);
          logger.debug(`Collected ${reaction.emoji.name} from ${user.tag}`);
          const finalEmbed = template.embedTemplate()
            .setColor('BLUE')
            .setDescription(`Collected ${reaction.emoji.name} from ${user.tag}`);
          try {
            const modlogChannel = await interaction.client.channels.cache.get(channelModlogId);
            if (modlogChannel) {
              await modlogChannel.send({ embeds: [finalEmbed] });
            }
          } catch (err) {
            logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
          }
          msg.delete();
          collector.stop();
        });
        // collector.on('end', async collected => {
        //   logger.debug(`[${PREFIX}] collected: ${JSON.stringify(collected, null, 2)}`);
        // });
      });

    const endMetaHelpMessage = memberInput
      ? stripIndents`${actor.user.username} has indicated that ${target.user.username} no longer needs help!
      *This thread, and ${helpThread}, will remain un-archived for 24 hours to allow the user to follow-up.
      If the user requests help again within 7 days these threads will be un-archived.
      After 7 days the threads will be deleted to preserve privacy.*`
      : stripIndents`${target.user.username} has indicated that they no longer need help!
      *This thread, and the #tripsit thread, will remain un-archived for 24 hours to allow the user to follow-up.
      If the user requests help again within 7 days these threads will be un-archived.
      After 7 days the threads will be deleted to preserve privacy.*`;
    metaHelpThread.send(endMetaHelpMessage);

    logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);

    logger.debug(`[${PREFIX}] finished!`);
  },
  // async submit(interaction) {
  //   const feedback = interaction.fields.getTextInputValue('feedbackReport');
  //   logger.debug(feedback);
  // },
};
