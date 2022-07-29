'use strict';

const PREFIX = require('path').parse(__filename).name;
const { SlashCommandBuilder } = require('discord.js');
const { stripIndents } = require('common-tags');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const {
  NODE_ENV,
  channelStartId,
  channelRulesId,
  channelBotspamId,
  channelTripsitId,
} = require('../../../../env');

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
// const soberEmoji = NODE_ENV === 'production'
//   ? '<:ts_sober:979362237695295508>'
//   : '<:ts_sober:980917339728007188>';
const talkativeEmoji = NODE_ENV === 'production'
  ? '<:ts_talkative:981799227141259304>'
  : '<:ts_talkative:981910870567309312>';
const workingEmoji = NODE_ENV === 'production'
  ? '<:ts_working:979362237691093022>'
  : '<:ts_working:981925646953504869>';
const upvoteEmoji = NODE_ENV === 'production'
  ? '<:ts_voteup:958721361587630210>'
  : '<:ts_voteup:980917845472985189>';
const downvoteEmoji = NODE_ENV === 'production'
  ? '<:ts_votedown:960161563849932892>'
  : '<:ts_votedown:980917845015818251>';
// const thumbupEmoji = NODE_ENV === 'production'
//   ? '<:ts_thumbup:979721167332052992>'
//   : '<:ts_thumbup:980917845640773653>';
// const thumbdownEmoji = NODE_ENV === 'production'
//   ? '<:ts_thumbdown:979721915390369822>'
//   : '<:ts_thumbdown:980917845527519312>';
const pinkHeart = NODE_ENV === 'production'
  ? '<:pink_heart:958072815884582922>'
  : '<:pink_heart:977926946656763904>';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start-here')
    .setDescription('Re-creates the start-here information!'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] Starting!`);

    const finalEmbed = template.embedTemplate()
      .setTitle('Start here started!');
    interaction.reply({ embeds: [finalEmbed], ephemeral: true });

    const channelStart = interaction.client.channels.cache.get(channelStartId);
    // const channelIrc = interaction.member.client.channels.cache.get(channelIrcId);
    // const channelQuestions = interaction.client.channels.cache.get(channelDrugQuestionsId);
    const channelBotspam = interaction.client.channels.cache.get(channelBotspamId);
    // const channelSanctuary = interaction.client.channels.cache.get(channelSanctuaryId);
    // const channelGeneral = interaction.client.channels.cache.get(channelGeneralId);
    const channelTripsit = interaction.client.channels.cache.get(channelTripsitId);
    const channelRules = interaction.client.channels.cache.get(channelRulesId);

    const message = stripIndents`
      **Welcome to the TripSit Discord!**
      > Our discord is a bit different from others, please read this info!

      **If you need help, join the ${channelTripsit} room and click the "I need assistance" button**
      > This will create a new thread for you to talk with people who want to help you =)

      **By chatting here you agree to abide the ${channelRules}**
      > Many of our users are currently on a substance and appreciate a more gentle chat.
      > We want this place to be inclusive and welcoming, if there is anything disrupting your stay here:
      ***1*** Use ${downvoteEmoji} on offensive comments, three of them will activate a timeout and mod review!
      ***2*** Use the /report interface to report someone to the mod team! Also use Right Click > Apps > Report!
      ***3*** Mention the @moderators to get attention from the mod team!
      ***4*** Message TripBot and click the "I have a discord issue" button to start a thread with the team!

      **If someone has the "bot" tag they are talking from IRC!**
      > IRC is an older chat system where TripSit started: chat.tripsit.me
      > The 🔗 icon in the channel name means the channel is linked with IRC.

      **We have a karma system!**
      > Use /profile to see your karma!
      > React with ${upvoteEmoji} or ${downvoteEmoji} to give or take karma!
      > *Remember: Three ${downvoteEmoji} on a message activates a timeout!*

      **We have our own custom bot!**
      > Go crazy in ${channelBotspam} exploring the bot commands!
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
        ${talkativeEmoji} - I'm just happy to chat!
        ${workingEmoji} - I'm busy and may be slow to respond!
      `)
      .setAuthor({
        name: 'React to this to show your mindset!',
        iconURL: '',
        url: '',
      })
      .setFooter('These roles reset after 8 hours to accurately show your mindset!')
      .setColor('PURPLE');
    await channelStart.send({ embeds: [mindsetEmbed], ephemeral: false })
      .then(async msg => {
        await msg.react(`${drunkEmoji}`);
        await msg.react(`${highEmoji}`);
        await msg.react(`${rollingEmoji}`);
        await msg.react(`${trippingEmoji}`);
        await msg.react(`${dissociatingEmoji}`);
        await msg.react(`${stimmingEmoji}`);
        await msg.react(`${noddingEmoji}`);
        // await msg.react(`${soberEmoji}`);
        await msg.react(`${talkativeEmoji}`);
        await msg.react(`${workingEmoji}`);
      });

    const colorEmbed = template.embedTemplate()
      .setAuthor({ name: 'React to this message to set the color of your nickname!', iconURL: '', url: '' })
      .setFooter(null)
      .setColor('BLUE');

    await channelStart.send({ embeds: [colorEmbed], ephemeral: false })
      .then(async msg => {
        await msg.react('❤');
        await msg.react('🧡');
        await msg.react('💛');
        await msg.react('💚');
        await msg.react('💙');
        await msg.react('💜');
        await msg.react(pinkHeart);
        await msg.react('🖤');
        await msg.react('🤍');
      });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
