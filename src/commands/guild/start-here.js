'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const { ReactionRole } = require('discordjs-reaction-role');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getGuildInfo, setGuildInfo } = require('../../utils/firebase');

const { NODE_ENV } = require('../../../env');

let pinkHeart = '';
let weedEmoji = '';
if (NODE_ENV === 'production') {
  pinkHeart = '<:pink_heart:958072815884582922>';
  weedEmoji = '<:weed:960163220268671006>';
} else {
  pinkHeart = '😀';
  weedEmoji = '🌿';
}

const channelRulesId = process.env.channel_rules;
const channelIrcId = process.env.channel_irc;
const channelStartId = process.env.channel_start;
const channelBotspamId = process.env.channel_botspam;
const channelTripsitId = process.env.channel_tripsit;
const channelDrugQuestionsId = process.env.channel_drugquestions;
const channelSanctuaryId = process.env.channel_sanctuary;
const channelGeneralId = process.env.channel_general;

const roleRed = process.env.roleRed;
const roleOrange = process.env.roleOrange;
const roleYellow = process.env.roleYellow;
const roleGreen = process.env.roleGreen;
const roleBlue = process.env.roleBlue;
const rolePurple = process.env.rolePurple;
const rolePink = process.env.rolePink;
const roleBrown = process.env.roleBrown;
const roleBlack = process.env.roleBlack;
const roleWhite = process.env.roleWhite;

const roleDrunk = process.env.roleDrunk;
const roleHigh = process.env.roleHigh;
const roleRolling = process.env.roleRolling;
const roleTripping = process.env.roleTripping;
const roleDissociating = process.env.roleDissociating;
const roleStimming = process.env.roleStimming;
const roleNodding = process.env.roleNodding;
const roleSober = process.env.roleSober;

const PREFIX = path.parse(__filename).name;

// const {
// } = process.env;

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
      > If somone is disturbing chat, react with <:ts_down:960161563849932892>.
      > Three <:ts_down:960161563849932892> on a message activates a timeout!
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
        roleId: roleDrunk,
      },
      {
        messageId: mindsetMessage.id,
        reaction: weedEmoji,
        roleId: roleHigh,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '🤩',
        roleId: roleRolling,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '😍',
        roleId: roleTripping,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '👾',
        roleId: roleDissociating,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '😬',
        roleId: roleStimming,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '😴',
        roleId: roleNodding,
      },
      {
        messageId: mindsetMessage.id,
        reaction: '❤️',
        roleId: roleSober,
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
        roleId: roleRed,
      },
      {
        messageId: colorMessage.id,
        reaction: '🧡',
        roleId: roleOrange,
      },
      {
        messageId: colorMessage.id,
        reaction: '💛',
        roleId: roleYellow,
      },
      {
        messageId: colorMessage.id,
        reaction: '💚',
        roleId: roleGreen,
      },
      {
        messageId: colorMessage.id,
        reaction: '💙',
        roleId: roleBlue,
      },
      {
        messageId: colorMessage.id,
        reaction: '💜',
        roleId: rolePurple,
      },
      {
        messageId: colorMessage.id,
        reaction: pinkHeart,
        roleId: rolePink,
      },
      {
        messageId: colorMessage.id,
        reaction: '🤎',
        roleId: roleBrown,
      },
      {
        messageId: colorMessage.id,
        reaction: '🖤',
        roleId: roleBlack,
      },
      {
        messageId: colorMessage.id,
        reaction: '🤍',
        roleId: roleWhite,
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
