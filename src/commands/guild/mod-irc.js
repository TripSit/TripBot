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
      .setDescription('Have tripbot say something in a channel')
      .addStringOption(option => option
        .setName('quote')
        .setDescription('What to say!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('channel')
        .setDescription('Channel to say in!')
        .setRequired(true))
      .setName('say'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Info on a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to warn!')
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
      // eslint-disable-next-line
      // .addStringOption(option => option.setName('duration').setDescription('Duration of ban!').setRequired(true))
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
    const quote = interaction.options.getString('quote');
    logger.debug(`[${PREFIX}] quote: ${quote}`);
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
      if (command === 'say') {
        global.ircClient.say('tripbot', `${botPrefix}${command} ${channel} ${quote}`);
        global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${channel} ${quote}`);
        interaction.reply(`I ${command} ${quote} in ${channel}`);
        return;
      }
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
    const actorResults = await getUserInfo(actor);
    const actorData = actorResults[0];
    const actorAction = `${command}_sent`;

    // Transfor actor data
    if ('mod_actions' in actorData) {
      actorData.mod_actions[actorAction] = (actorData.mod_actions[actorAction] || 0) + 1;
    } else {
      actorData.mod_actions = { [actorAction]: 1 };
    }

    // Load actor data
    await setUserInfo(actorResults[1], actorData);

    // TODO: fix db for target
    // if (target) {
    //   // Extract target data
    //   const targetResults = await getUserInfo(target);
    //   const targetData = targetResults[0];
    //   const targetAction = `${command}_received`;

    //   // Transform taget data
    //   if ('mod_actions' in targetData) {
    //     targetData.mod_actions[targetAction] = (targetData.mod_actions[targetAction] || 0) + 1;
    //   } else {
    //     targetData.mod_actions = { [targetAction]: 1 };
    //   }

    //   // Load target data
    //   await setUserInfo(targetResults[1], targetData);
    // }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
