'use strict';

const PREFIX = require('path').parse(__filename).name;
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const { getUserInfo, setUserInfo } = require('../../utils/firebase');
const parseDuration = require('../../utils/parseDuration');

const {
  NODE_ENV,
} = require('../../../env');

let botPrefix = '-';
if (NODE_ENV === 'production') {
  botPrefix = '~';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod-irc')
    .setDescription('IRC Mod Actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Info on a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to get info on!')
        .setRequired(true))
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Warn a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for warn!')
        .setRequired(true))
      .setName('warn'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Quiet a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to quiet!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('duration')
        .setDescription('How long to quiet!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for quiet!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoice('On', 'on')
        .addChoice('Off', 'off')
        .setRequired(true))
      .setName('quiet'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Kick a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for kick!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('channel')
        .setDescription('Channel to kick from!')
        .setRequired(true))
      .setName('kick'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Ban a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('duration')
        .setDescription('How long to ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoice('On', 'on')
        .addChoice('Off', 'off')
        .setRequired(true))
      .setName('ban')),
  async execute(interaction) {
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] Actor: ${actor}`);
    const command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);
    const target = interaction.options.getString('target');
    logger.debug(`[${PREFIX}] target: ${target}`);
    const toggle = interaction.options.getString('toggle');
    logger.debug(`[${PREFIX}] toggle: ${toggle}`);
    const reason = interaction.options.getString('reason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    const channel = interaction.options.getString('channel');
    logger.debug(`[${PREFIX}] channel: ${channel}`);
    const duration = interaction.options.getString('duration');
    logger.debug(`[${PREFIX}] duration: ${duration}`);

    const minutes = duration ? (await parseDuration.execute(duration) / 1000) / 60 : 0;

    if (toggle === 'off') {
      if (command === 'ban') {
        global.ircClient.say('tripbot', `${botPrefix}nunban ${target} ${reason}`);
        global.ircClient.say('#sandbox', `Sent: ${botPrefix}nunban ${target} ${reason}`);
        interaction.reply(`I un${command}ed ${target} because '${reason}'`);
      } else if (command === 'quiet') {
        global.ircClient.say('tripbot', `${botPrefix}un${command} ${target} ${reason}`);
        global.ircClient.say('#sandbox', `Sent: ${botPrefix}un${command} ${target} ${reason}`);
        interaction.reply(`I un${command}ed ${target} because '${reason}'`);
      }
      return;
    }
    try {
      if (command === 'warn') {
        global.ircClient.say('tripbot', `${botPrefix}${command} ${target} ${reason}`);
        global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${target} ${reason}`);
      } else if (command === 'quiet') {
        global.ircClient.say('tripbot', `${botPrefix}${command} ${target} ${minutes}m ${reason}`);
        global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${target} ${minutes}m ${reason}`);
      } else if (command === 'kick') {
        global.ircClient.say('tripbot', `${botPrefix}${command} ${target} ${channel} ${reason}`);
        global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${target} ${channel} ${reason}`);
      } else if (command === 'ban') {
        global.ircClient.say('tripbot', `${botPrefix}n${command} ${target} ${minutes}m ${reason}`);
        global.ircClient.say('#sandbox', `Sent: ${botPrefix}n${command} ${target} ${minutes}m ${reason}`);
      } else if (command === 'info') {
        global.ircClient.say('tripbot', `${botPrefix}${command} ${target}`);
        global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${target}`);
      }
    } catch (err) {
      logger.error(`[${PREFIX}] Error:`, err);
    }

    interaction.reply(`I ${command}ed ${target} ${channel ? `in ${channel}` : ''}${minutes ? ` for ${minutes} minutes` : ''} because '${reason}'`);
    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);
    const actorAction = `${command}_received`;

    // Transfor actor data
    if ('discord' in actorData) {
      if ('modActions' in actorData) {
        actorData.discord.modActions[actorAction] = (
          actorData.discord.modActions[actorAction] || 0) + 1;
      } else {
        actorData.discord.modActions = { [actorAction]: 1 };
      }
    }

    // Load actor data
    await setUserInfo(actorFbid, actorData);

    // TODO: fix db for target
    // if (target) {
    //   // Extract target data
    //   const targetResults = await getUserInfo(target);
    //   const targetData = targetResults[0];
    //   const targetAction = `${command}_received`;

    //   // Transform taget data
    //   if ('modActions' in targetData) {
    //     targetData.discord.modActions[targetAction] = (
    // targetData.discord.modActions[targetAction] || 0) + 1;
    //   } else {
    //     targetData.discord.modActions = { [targetAction]: 1 };
    //   }

    //   // Load target data
    //   await setUserInfo(targetResults[1], targetData);
    // }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
