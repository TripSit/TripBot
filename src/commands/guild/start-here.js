'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const { ReactionRole } = require('discordjs-reaction-role');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getGuildInfo, setGuildInfo } = require('../../utils/firebase');

const {
  NODE_ENV,
  channelStartId,
  channelRulesId,
  // channelBotspamId,
  // channelIrcId,
  // channelTripsitId,
  // channelSanctuaryId,
  // channelDrugQuestionsId,
  // channelGeneralId,
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

const drunkEmoji = NODE_ENV === 'production'
  ? '<:ts_drunk:979362236613160990>'
  : '<:ts_drunk:980917123322896395>';
const highEmoji = NODE_ENV === 'production'
  ? '<:ts_high:979362238349578250>'
  : '<:ts_high:980917339698634853>';
const rollingEmoji = NODE_ENV === 'production'
  ? '<:ts_rolling:979362238936797194>'
  : '<:ts_rolling:980917339837038672>';
const trippingEmoji = NODE_ENV === 'production'
  ? '<:ts_tripping:979362238437670922>'
  : '<:ts_tripping:980917339778326638>';
const dissociatingEmoji = NODE_ENV === 'production'
  ? '<:ts_dissociating:979362236575387698>'
  : '<:ts_dissociating:980917339761569812>';
const stimmingEmoji = NODE_ENV === 'production'
  ? '<:ts_stimming:979362237452025936>'
  : '<:ts_stimming:980917339895787580>';
const noddingEmoji = NODE_ENV === 'production'
  ? '<:ts_nodding:979362238534123520>'
  : '<:ts_nodding:980917339803512902>';
const soberEmoji = NODE_ENV === 'production'
  ? '<:ts_sober:979362237695295508>'
  : '<:ts_sober:980917339728007188>';
const upvoteEmoji = NODE_ENV === 'production'
  ? '<:ts_voteup:960161563849932892>'
  : '<:ts_voteup:980917845472985189>';
const downvoteEmoji = NODE_ENV === 'production'
  ? '<:ts_votedown:960161563849932892>'
  : '<:ts_votedown:980917845015818251>';
// const thumbupEmoji = NODE_ENV === 'production'
//   ? '<:ts_thumbup:>'
//   : '<:ts_thumbup:980917845640773653>';
// const thumbdownEmoji = NODE_ENV === 'production'
//   ? '<:ts_thumbdown:>'
//   : '<:ts_thumbdown:980917845527519312>';
const pinkHeart = NODE_ENV === 'production'
  ? '<:pink_heart:958072815884582922>'
  : '<:pink_heart:977926946656763904>';

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start-here')
    .setDescription('Re-creates the start-here information!'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] Starting!`);

    logger.debug(pinkHeart.slice(2, -20));
    logger.debug(drunkEmoji.slice(2, -20));

    const finalEmbed = template.embedTemplate()
      .setTitle('Start here started!');
    interaction.reply({ embeds: [finalEmbed], ephemeral: true });

    const channelStart = interaction.client.channels.cache.get(channelStartId);
    // const channelIrc = interaction.member.client.channels.cache.get(channelIrcId);
    // const channelQuestions = interaction.client.channels.cache.get(channelDrugQuestionsId);
    // const channelBotspam = interaction.client.channels.cache.get(channelBotspamId);
    // const channelSanctuary = interaction.client.channels.cache.get(channelSanctuaryId);
    // const channelGeneral = interaction.client.channels.cache.get(channelGeneralId);
    // const channelTripsit = interaction.client.channels.cache.get(channelTripsitId);
    const channelRules = interaction.client.channels.cache.get(channelRulesId);

    // Extract guild data
    const [targetGuildData, targetGuildFbid] = await getGuildInfo(interaction.guild);

    // Transform guild data
    const reactionRoles = targetGuildData.reactionRoles ? targetGuildData.reactionRoles : {};

    const message = stripIndents`
      **Welcome to the TripSit Discord!**

      Our discord is a bit different from others, channel is meant to help you get started.

      As of Summer 2022, this discord is undergoing active development and promotion.
      If you join during this period expect things to be slower and change frequenty!
      *Now is the time to help shape the future of TripSit =)*

      > **Be sure to read the ${channelRules}**
      > If there is anything disrupting your stay here, please /report, or mention a @moderator
      > Three ${downvoteEmoji} on a message activates a timeout!

      **Fill in your profile!**
      Use /birthday SET to set your birthday!
      Use /time SET to set your timezone!
      Use the below messages to set your color and emblem!

      **We have a karma system!**
      Use /karma to see your karma!
      React with ${upvoteEmoji} or ${downvoteEmoji} to give or take karma!
      *Three ${downvoteEmoji} on a message activates a timeout!*

      **We have an experience system!**
      As you chat with other users, you will gain experience and level up!
      At level 5 you'll unlock the VIP role gain access to other channels.

      **Certain channels are bridged with IRC!**
      The 🌉 icon in the channel name means the channel is bridged with IRC.

      **You can link your account to IRC!**
      Use /link-account IRC to link your account to IRC!
      This is completely optional and provides no benefits currently, but it's nice to have!
      `;

    await channelStart.send(message);

    const mindsetEmbed = template.embedTemplate()
      .setDescription(stripIndents`
        ${drunkEmoji} - Drunk
        ${highEmoji} - High
        ${rollingEmoji} - Rolling
        ${trippingEmoji} - Tripping
        ${dissociatingEmoji} - Dissociating
        ${stimmingEmoji} - Stimming
        ${noddingEmoji} - Nodding
        ${soberEmoji} - Sober and happy to be here!
      `)
      .setAuthor({
        name: 'React to this message to set an icon next to your name!',
        iconURL: '',
        url: '',
      })
      .setFooter(null)
      .setColor('PURPLE');
    let mindsetMessage = '';
    await channelStart.send({ embeds: [mindsetEmbed], ephemeral: false })
      .then(async msg => {
        mindsetMessage = msg;
        await msg.react(`${drunkEmoji}`);
        await msg.react(`${highEmoji}`);
        await msg.react(`${rollingEmoji}`);
        await msg.react(`${trippingEmoji}`);
        await msg.react(`${dissociatingEmoji}`);
        await msg.react(`${stimmingEmoji}`);
        await msg.react(`${noddingEmoji}`);
        await msg.react(`${soberEmoji}`);
        reactionRoles.startHere = [
          {
            messageId: mindsetMessage.id,
            reaction: `${drunkEmoji.slice(2, -20)}`,
            roleId: roleDrunkId,
          },
          {
            messageId: mindsetMessage.id,
            reaction: `${highEmoji.slice(2, -20)}`,
            roleId: roleHighId,
          },
          {
            messageId: mindsetMessage.id,
            reaction: `${rollingEmoji.slice(2, -20)}`,
            roleId: roleRollingId,
          },
          {
            messageId: mindsetMessage.id,
            reaction: `${trippingEmoji.slice(2, -20)}`,
            roleId: roleTrippingId,
          },
          {
            messageId: mindsetMessage.id,
            reaction: `${dissociatingEmoji.slice(2, -20)}`,
            roleId: roleDissociatingId,
          },
          {
            messageId: mindsetMessage.id,
            reaction: `${stimmingEmoji.slice(2, -20)}`,
            roleId: roleStimmingId,
          },
          {
            messageId: mindsetMessage.id,
            reaction: `${noddingEmoji.slice(2, -20)}`,
            roleId: roleNoddingId,
          },
          {
            messageId: mindsetMessage.id,
            reaction: `${soberEmoji.slice(2, -20)}`,
            roleId: roleSoberId,
          },
        ];
      });

    const colorEmbed = template.embedTemplate()
      .setAuthor({ name: 'React to this message to set the color of your nickname!', iconURL: '', url: '' })
      .setFooter(null)
      .setColor('BLUE');

    let colorMessage = '';
    await channelStart.send({ embeds: [colorEmbed], ephemeral: false })
      .then(async msg => {
        colorMessage = msg;
        await msg.react('❤');
        await msg.react('🧡');
        await msg.react('💛');
        await msg.react('💚');
        await msg.react('💙');
        await msg.react('💜');
        await msg.react(pinkHeart);
        await msg.react('🖤');
        await msg.react('🤍');
        reactionRoles.startHere = reactionRoles.startHere.concat([
          {
            messageId: colorMessage.id,
            reaction: '❤',
            roleId: roleRedId,
          },
          {
            messageId: colorMessage.id,
            reaction: '🧡',
            roleId: roleOrangeId,
          },
          {
            messageId: colorMessage.id,
            reaction: '💛',
            roleId: roleYellowId,
          },
          {
            messageId: colorMessage.id,
            reaction: '💚',
            roleId: roleGreenId,
          },
          {
            messageId: colorMessage.id,
            reaction: '💙',
            roleId: roleBlueId,
          },
          {
            messageId: colorMessage.id,
            reaction: '💜',
            roleId: rolePurpleId,
          },
          {
            messageId: colorMessage.id,
            reaction: 'pink_heart',
            roleId: rolePinkId,
          },
          {
            messageId: colorMessage.id,
            reaction: '🤎',
            roleId: roleBrownId,
          },
          {
            messageId: colorMessage.id,
            reaction: '🖤',
            roleId: roleBlackId,
          },
          {
            messageId: colorMessage.id,
            reaction: '🤍',
            roleId: roleWhiteId,
          },
        ]);
      });

    logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoles)}`);
    targetGuildData.reactionRoles = reactionRoles;

    // Load data
    await setGuildInfo(targetGuildFbid, targetGuildData);

    let reactionConfig = [];
    Object.keys(reactionRoles).forEach(key => {
      logger.debug(`[${PREFIX}] key: ${key}`);
      logger.debug(`[${PREFIX}] reactionRoles[${key}] = ${JSON.stringify(reactionRoles[key], null, 2)}`);
      // reactionConfig = reactionRoles[key]; this works
      reactionConfig = reactionConfig.concat(reactionRoles[key]);
    });
    logger.debug(`[${PREFIX}] reactionConfig: ${JSON.stringify(reactionConfig, null, 2)}`);
    global.manager = new ReactionRole(interaction.client, reactionConfig);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
