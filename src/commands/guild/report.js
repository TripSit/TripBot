const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../../utils/logger');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed-template');
const { get_user_info } = require('../../utils/get-user-info');

if (process.env.NODE_ENV !== 'production') { require('dotenv').config(); }
const { users_db_name } = process.env;
const channel_moderators_id = process.env.channel_moderators;
const { db } = global;

const mod_buttons = new MessageActionRow()
  .addComponents(
    new MessageButton()
      .setCustomId('warnbtn')
      .setLabel('Warn')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('timeoutbtn')
      .setLabel('Timeout')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('kickbtn')
      .setLabel('Kick')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('banbtn')
      .setLabel('Ban')
      .setStyle('DANGER'),
  );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .addUserOption(option => option.setName('user')
      .setDescription('User to report!')
      .setRequired(true))
    .addChannelOption(option => option.setName('channel')
      .setDescription('Where are they?')
      .setRequired(true))
    .addStringOption(option => option.setName('reason')
      .setDescription('What are they doing?')
      .setRequired(true)),
  async execute(interaction) {
    const actor = interaction.member.user;
    const target = interaction.options.getMember('user');
    const rchannel = interaction.options.getChannel('channel');
    const reason = interaction.options.getString('reason');
    const command = 'report';

    const actor_results = get_user_info(actor);
    const actor_data = actor_results[0];
    const actor_fbid = actor_results[1];
    const actor_action = `${command}_sent`;

    const target_results = get_user_info(target);
    const target_data = target_results[0];
    const target_fbid = target_results[1];
    const target_action = `${command}_received`;

    logger.debug(`[${PREFIX}] Found actor data, updating it`);
    if ('mod_actions' in actor_data) {
      actor_data.mod_actions[actor_action] = (actor_data.mod_actions[actor_action] || 0) + 1;
    } else {
      actor_data.mod_actions = { [actor_action]: 1 };
    }

    if (actor_fbid !== '') {
      logger.debug(`[${PREFIX}] Updating actor data`);
      try {
        await db.collection(users_db_name).doc(actor_fbid).set(actor_data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating actor data`);
      try {
        await db.collection(users_db_name).set(actor_data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
      }
    }

    logger.debug(`[${PREFIX}] Found target data, updating it`);
    if ('mod_actions' in target_data) {
      target_data.mod_actions[target_action] = (target_data.mod_actions[target_action] || 0) + 1;
    } else {
      target_data.mod_actions = { [target_action]: 1 };
    }

    if (target_fbid !== '') {
      logger.debug(`[${PREFIX}] Updating target data`);
      try {
        await db.collection(users_db_name).doc(target_fbid).set(target_data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating target data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating target data`);
      try {
        await db.collection(users_db_name).doc().set(target_data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating target data: ${err}`);
      }
    }

    const embed_mod = template.embedTemplate()
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
        { name: '# of Reports', value: `${target_data.reports_recv}`, inline: true },
        { name: '# of Timeouts', value: `${target_data.timeouts}`, inline: true },
        { name: '# of Warns', value: `${target_data.warns}`, inline: true },
      )
      .addFields(
        { name: '# of Kicks', value: `${target_data.warns}`, inline: true },
        { name: '# of Bans', value: `${target_data.bans}`, inline: true },
        { name: '# of Fucks to give', value: '0', inline: true },
      );

    const mod_chan = interaction.client.channels.cache.get(channel_moderators_id);
    mod_chan.send({ embeds: [embed_mod], components: [mod_buttons] });

    const embed = template.embedTemplate()
      .setTitle('Thank you!')
      .setDescription(`${target} has been reported for ${reason} ${rchannel ? `in ${rchannel}` : ''}`);
    interaction.reply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
