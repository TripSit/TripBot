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
  channelBotspamId,
  channelRulesId,
  channelIrcId,
  channelTripsitId,
  channelSanctuaryId,
  channelDrugQuestionsId,
  channelGeneralId,
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

let pinkHeart = '';
let weedEmoji = '';
if (NODE_ENV === 'production') {
  pinkHeart = '<:pink_heart:958072815884582922>';
  weedEmoji = '<:weed:960163220268671006>';
} else {
  pinkHeart = '<:pink_heart:977926946656763904>';
  weedEmoji = '<:weed:977926946740662272>';
}

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start-here')
    .setDescription('Re-creates the start-here information!'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] Starting!`);
    const finalEmbed = template.embedTemplate()
      .setTitle('Start here started!');
    interaction.reply({ embeds: [finalEmbed], ephemeral: true });

    const reactionConfig = [];

    const channelStart = interaction.client.channels.cache.get(channelStartId);
    const channelIrc = interaction.member.client.channels.cache.get(channelIrcId);
    const channelQuestions = interaction.client.channels.cache.get(channelDrugQuestionsId);
    const channelBotspam = interaction.client.channels.cache.get(channelBotspamId);
    const channelSanctuary = interaction.client.channels.cache.get(channelSanctuaryId);
    const channelGeneral = interaction.client.channels.cache.get(channelGeneralId);
    const channelTripsit = interaction.client.channels.cache.get(channelTripsitId);
    const channelRules = interaction.client.channels.cache.get(channelRulesId);

    const message = stripIndents`
      **Welcome to the TripSit Discord!**

      Our discord is a bit different from others, channel is meant to help you get started.

      As of Summer 2022, this discord is undergoing active development and promotion.
      If you join during this period expect things to be slower and change frequenty!
      Now is the time to help shape the future of TripSit =)

      > **Be sure to read the ${channelRules}**
      > If somone is disturbing chat, react with <:ts_votedown:960161563849932892>.
      > Three <:ts_votedown:960161563849932892> on a message activates a timeout!
      > If there is anything disrupting your stay here, please /report, or mention a @moderator

      **Try to keep channels on-topic**
      ${channelTripsit} is for when you need a tripsitter
      🛑 Please do not message helpers or tripsitters directly! 🛑

      ${channelSanctuary} is for when you need a slow, positive chat
      This room is rate limited to 1-message-per-5-seconds.

      ${channelQuestions} is for questions on substances
      This is 'thread-only' mode so your question wont get lost!

      ${channelBotspam} is for spamming bot commands
      Our bot is entirely slash command based so use the prefix /

      ${channelIrc} can be used to ask questions/issues on the IRC
      This includes ban appeals and other issues

      ${channelGeneral} is for all other topics!`;

    await channelStart.send(message);

    const mindsetEmbed = template.embedTemplate()
      .setDescription(stripIndents`
        🍺 - Drunk
        ${weedEmoji} - High
        😍 - Rolling
        🤩 - Tripping
        👾 - Dissociating
        😬 - Stimming
        😴 - Chilling
        ❤️ - Clear mind
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
        await msg.react('🍺');
        await msg.react(weedEmoji);
        await msg.react('🤩');
        await msg.react('😍');
        await msg.react('👾');
        await msg.react('😬');
        await msg.react('😴');
        await msg.react('❤️');
      });
    reactionConfig.push(
      {
        messageId: mindsetMessage.id,
        reaction: '🍺',
        roleId: roleDrunkId,
      },
      {
        messageId: mindsetMessage.id,
        reaction: 'weed',
        roleId: roleHighId,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '🤩',
        roleId: roleTrippingId,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '😍',
        roleId: roleRollingId,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '👾',
        roleId: roleDissociatingId,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '😬',
        roleId: roleStimmingId,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '😴',
        roleId: roleNoddingId,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '❤️',
        roleId: roleSoberId,
      },
    );

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
        await msg.react('🤎');
        await msg.react('🖤');
        await msg.react('🤍');
      });

    logger.debug(`[${PREFIX}] colorMessage.id: ${colorMessage.id}`);

    reactionConfig.push(
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
    );

    const manager = new ReactionRole(interaction.client, reactionConfig);
    global.manager = manager;

    // Extract data
    const targetResults = await getGuildInfo(interaction.guild);
    const targetData = targetResults[0];

    // Transform data
    targetData.reactionRoles = reactionConfig;
    // logger.debug(`[${PREFIX}] target_data: ${JSON.stringify(targetData)}`);

    // Load data
    await setGuildInfo(targetResults[1], targetData);

    // channelStart.send(colorMessage);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
