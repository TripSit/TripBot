'use strict';

const path = require('path');
const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../utils/firebase');

const PREFIX = path.parse(__filename).name;

const { channelModeratorsId } = require('../../../env');

const modButtons = new MessageActionRow()
  .addComponents(
    new MessageButton().setCustomId('warnbtn').setLabel('Warn').setStyle('PRIMARY'),
    new MessageButton().setCustomId('timeoutbtn').setLabel('Timeout').setStyle('SECONDARY'),
    new MessageButton().setCustomId('kickbtn').setLabel('Kick').setStyle('SECONDARY'),
    new MessageButton().setCustomId('banbtn').setLabel('Ban').setStyle('DANGER'),
  );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to report!')
      .setRequired(true))
    .addChannelOption(option => option
      .setName('channel')
      .setDescription('Where are they?')
      .setRequired(true))
    .addStringOption(option => option
      .setName('reason')
      .setDescription('What are they doing?')
      .setRequired(true)),

  async execute(interaction) {
    const actor = interaction.member.user;
    const target = interaction.options.getMember('user');
    const rchannel = interaction.options.getChannel('channel');
    const reason = interaction.options.getString('reason');
    const command = 'report';

    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);
    const actorAction = `${command}_sent`;

    // Transform actor data
    logger.debug(`[${PREFIX}] Found actor data, updating it`);
    if ('discord' in actorData) {
      if ('modActions' in actorData.discord) {
        actorData.discord.modActions[actorAction] = (
          actorData.discord.modActions[actorAction] || 0) + 1;
      } else {
        actorData.discord.modActions = { [actorAction]: 1 };
      }
    } else {
      actorData.discord = {
        modActions: { [actorAction]: 1 },
      };
    }

    // Load actor data
    await setUserInfo(actorFbid, actorData);

    // Extract target data
    const [targetData, targetFbid] = await getUserInfo(target);
    const targetAction = `${command}_received`;

    // Transform target data
    logger.debug(`[${PREFIX}] Found target data, updating it`);
    if ('discord' in targetData) {
      if ('modActions' in targetData.discord) {
        targetData.discord.modActions[targetAction] = (
          targetData.discord.modActions[targetAction] || 0) + 1;
      } else {
        targetData.discord.modActions = { [targetAction]: 1 };
      }
    } else {
      targetData.discord = {
        modActions: { [targetAction]: 1 },
      };
    }

    // Load target data
    await setUserInfo(targetFbid, targetData);

    const embedMod = template.embedTemplate()
      .setDescription(`${actor} reported ${target} for ${reason} in ${rchannel}`)
      .addFields(
        { name: 'Username', value: `${target.user.username}#${target.user.discriminator}`, inline: true },
        { name: 'Nickname', value: `${target.nickname}`, inline: true },
        { name: 'ID', value: `${target.user.id}`, inline: true },
      )
      .addFields(
        { name: 'Account created', value: `${time(interaction.member.user.createdAt, 'R')}`, inline: true },
        { name: 'First joined', value: `${time(interaction.member.joinedAt, 'R')}`, inline: true },
        { name: 'Timeout until', value: `${time(interaction.member.communicationDisabledUntil, 'R')}`, inline: true },
      )
      .addFields(
        { name: 'Pending', value: `${target.pending}`, inline: true },
        { name: 'Moderatable', value: `${target.moderatable}`, inline: true },
        { name: 'Muted', value: `${target.isCommunicationDisabled()}`, inline: true },
      )
      .addFields(
        { name: 'Manageable', value: `${target.manageable}`, inline: true },
        { name: 'Bannable', value: `${target.bannable}`, inline: true },
        { name: 'Kickable', value: `${target.kickable}`, inline: true },
      )
      .addFields(
        { name: '# of Reports', value: `${targetData.reports_recv}`, inline: true },
        { name: '# of Timeouts', value: `${targetData.timeouts}`, inline: true },
        { name: '# of Warns', value: `${targetData.warns}`, inline: true },
      )
      .addFields(
        { name: '# of Kicks', value: `${targetData.warns}`, inline: true },
        { name: '# of Bans', value: `${targetData.bans}`, inline: true },
        { name: '# of Fucks to give', value: '0', inline: true },
      );

    const modChan = interaction.client.channels.cache.get(channelModeratorsId);
    modChan.send({ embeds: [embedMod], components: [modButtons] });

    const embed = template.embedTemplate()
      .setTitle('Thank you!')
      .setDescription(`${target} has been reported for ${reason} ${rchannel ? `in ${rchannel}` : ''}`);
    interaction.reply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
