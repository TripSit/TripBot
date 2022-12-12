// 'use strict';

// import { parse } from 'path';

// const F = f(__filename);
// const { SlashCommandBuilder } = require('discord.js');
// const logger = require('../../../global/utils/log');
// const parseDuration = require('../../../global/utils/parseDuration');

// const {
//   NODE_ENV,
// } = require('../../../../env');

// const botPrefix = env.IRC_BOTPREFIX;

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName('mod-irc')
//     .setDescription('IRC Mod Actions!')
//     .addSubcommand(subcommand => subcommand
//       .setDescription('Info on a user')
//       .addStringOption(option => option
//         .setName('target')
//         .setDescription('User to get info on!')
//         .setRequired(true))
//       .setName('info'))
//     .addSubcommand(subcommand => subcommand
//       .setDescription('Warn a user')
//       .addStringOption(option => option
//         .setName('target')
//         .setDescription('User to warn!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('reason')
//         .setDescription('Reason for warn!')
//         .setRequired(true))
//       .setName('warn'))
//     .addSubcommand(subcommand => subcommand
//       .setDescription('Quiet a user')
//       .addStringOption(option => option
//         .setName('target')
//         .setDescription('User to quiet!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('duration')
//         .setDescription('How long to quiet!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('reason')
//         .setDescription('Reason for quiet!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('toggle')
//         .setDescription('On off?')
//         .addChoices(
//           { name: 'On', value: 'on' },
//           { name: 'Off', value: 'off' },
//         )
//         .setRequired(true))
//       .setName('quiet'))
//     .addSubcommand(subcommand => subcommand
//       .setDescription('Kick a user')
//       .addStringOption(option => option
//         .setName('target')
//         .setDescription('User to kick!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('reason')
//         .setDescription('Reason for kick!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('channel')
//         .setDescription('Channel to kick from!')
//         .setRequired(true))
//       .setName('kick'))
//     .addSubcommand(subcommand => subcommand
//       .setDescription('Ban a user')
//       .addStringOption(option => option
//         .setName('target')
//         .setDescription('User to ban!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('duration')
//         .setDescription('How long to ban!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('reason')
//         .setDescription('Reason for ban!')
//         .setRequired(true))
//       .addStringOption(option => option
//         .setName('toggle')
//         .setDescription('On off?')
//         .addChoices(
//           { name: 'On', value: 'on' },
//           { name: 'Off', value: 'off' },
//         )
//         .setRequired(true))
//       .setName('ban')),
//   async execute(interaction) {
//     const actor = interaction.member;
//   // log.debug(F, `Actor: ${actor}`);
//     const command = interaction.options.getSubcommand();
//   // log.debug(F, `Command: ${command}`);
//     const target = interaction.options.getString('target');
//   // log.debug(F, `target: ${target}`);
//     const toggle = interaction.options.getString('toggle');
//   // log.debug(F, `toggle: ${toggle}`);
//     const reason = interaction.options.getString('reason');
//   // log.debug(F, `reason: ${reason}`);
//     const channel = interaction.options.getString('channel');
//   // log.debug(F, `channel: ${channel}`);
//     const duration = interaction.options.getString('duration');
//   // log.debug(F, `duration: ${duration}`);

//     const minutes = duration ? (await parseDuration.execute(duration) / 1000) / 60 : 0;

//     if (toggle === 'off') {
//       if (command === 'ban') {
//         global.ircClient.say('tripbot', `${botPrefix}nunban ${target} ${reason}`);
//         global.ircClient.say('#sandbox', `Sent: ${botPrefix}nunban ${target} ${reason}`);
//         interaction.reply(`I un${command}ed ${target} because '${reason}'`);
//       } else if (command === 'quiet') {
//         global.ircClient.say('tripbot', `${botPrefix}un${command} ${target} ${reason}`);
//         global.ircClient.say('#sandbox', `Sent: ${botPrefix}un${command} ${target} ${reason}`);
//         interaction.reply(`I un${command}ed ${target} because '${reason}'`);
//       }
//       return;
//     }
//     try {
//       if (command === 'warn') {
//         global.ircClient.say('tripbot', `${botPrefix}${command} ${target} ${reason}`);
//         global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${target} ${reason}`);
//       } else if (command === 'quiet') {
//         global.ircClient.say('tripbot', `${botPrefix}${command} ${target} ${minutes}m ${reason}`);
//         global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${target} ${minutes}m ${reason}`);
//       } else if (command === 'kick') {
//         global.ircClient.say('tripbot', `${botPrefix}${command} ${target} ${channel} ${reason}`);
//         global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${target} ${channel} ${reason}`);
//       } else if (command === 'ban') {
//         global.ircClient.say('tripbot', `${botPrefix}n${command} ${target} ${minutes}m ${reason}`);
//         global.ircClient.say('#sandbox', `Sent: ${botPrefix}n${command} ${target} ${minutes}m ${reason}`);
//       } else if (command === 'info') {
//         global.ircClient.say('tripbot', `${botPrefix}${command} ${target}`);
//         global.ircClient.say('#sandbox', `Sent: ${botPrefix}${command} ${target}`);
//       }
//     } catch (err) {
//       log.error(F, `Error: ${err}`);
//     }

//     interaction.reply(`I ${command}ed ${target} ${channel ? `in ${channel}` : ''}${minutes ? ` for ${minutes} minutes` : ''} because '${reason}'`);
//     // Extract actor data
//     const [actorData, actorFbid] = await getUserInfo(actor);
//     const actorAction = `${command}_received`;

//     // Transfor actor data
//     if ('discord' in actorData) {
//       if ('ModActions' in actorData) {
//         actorData.discord.ModActions[actorAction] = (
//           actorData.discord.ModActions[actorAction] || 0) + 1;
//       } else {
//         actorData.discord.ModActions = { [actorAction]: 1 };
//       }
//     }

//     // Load actor data
//     await setUserInfo(actorFbid, actorData);

//     // TODO: fix db for target
//     // if (target) {
//     //   // Extract target data
//     //   const targetResults = await getUserInfo(target);
//     //   const targetData = targetResults[0];
//     //   const targetAction = `${command}_received`;

//     //   // Transform taget data
//     //   if ('ModActions' in targetData) {
//     //     targetData.discord.ModActions[targetAction] = (
//     // targetData.discord.ModActions[targetAction] || 0) + 1;
//     //   } else {
//     //     targetData.discord.ModActions = { [targetAction]: 1 };
//     //   }

//     //   // Load target data
//     //   await setUserInfo(targetResults[1], targetData);
//     // }
//   },
// };
