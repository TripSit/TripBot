'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../utils/logger');

const {
  channelDevonboardingId,
  channelDevofftopicId,
  channelDevelopmentId,
  channelTripcordId,
  channelTripbotId,
  channelTripmobileId,
  channelWikicontentId,
  channelTrippitId,
} = require('../../../env');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dev-onboarding')
    .setDescription('Re-creates the dev-onboarding information!'),
  async execute(interaction) {
    // await interaction.deferReply();
    // const finalEmbed = template.embedTemplate()
    //   .setTitle('Info created!');
    // interaction.reply({ embeds: [finalEmbed], ephemeral: true });
    logger.debug(`[${PREFIX}] Starting!`);

    const channelDevonboarding = interaction.client.channels.cache.get(channelDevonboardingId);
    const channelDevofftopic = interaction.client.channels.cache.get(channelDevofftopicId);
    const channelDevelopment = interaction.client.channels.cache.get(channelDevelopmentId);
    const channelTripcord = interaction.client.channels.cache.get(channelTripcordId);
    const channelTripbot = interaction.client.channels.cache.get(channelTripbotId);
    const channelTripmobile = interaction.client.channels.cache.get(channelTripmobileId);
    const channelWikicontent = interaction.client.channels.cache.get(channelWikicontentId);
    const channelTrippit = interaction.client.channels.cache.get(channelTrippitId);

    await channelDevonboarding.send(stripIndents`
      **Welcome Developers and Testers**
      Our development category holds the projects we're working on.

      > **We encourage you to make a new thread whenever possible!**
      > This allows us to organize our efforts and not lose track of our thoughts!

      TripSit is run by volunteers, so things may be a bit slower than your day job.
      Your ability to help is only limited by much you want to contribute!
      Almost all the code is open source and can be found on our GitHub: (http://github.com/tripsit)
      Discussion of changes happens mostly in the public channels in this category.
      If you have an idea or feedback, make a new thread: we're happy to hear all sorts of input and ideas!
    `);

    await channelDevonboarding.send(stripIndents`
      **We have a couple ongoing projects that can always use volunteers:**

      ${channelTripcord}
      > While this discord has existed for years, TS as only started focusing on it recently.
      > It is still an ongoing WIP, and this channel is where we coordinate changes to the discord server!
      > Ideas and suggestions are always welcome, and we're always looking to improve the experience!
      > No coding experience is necessary to help make the discord an awesome place to be =)

      ${channelTripbot}
      > Our ombi-bot Tripbot has made it's way into the discord server!
      > This is a somewhat complex bot that is continually growing to meet the needs of TripSit.
      > It also can be added to other servers to provide a subset of harm reduction features to the public
      > This channel receives updates from github, you can watch the development in progress.

      ${channelTripmobile}
      > Tripsit has a mobile application: (https://play.google.com/store/apps/details?id=me.tripsit.mobile)
      > This is built on Expo, a React Native framework.
      > **We would love react native developers to help out on this project!**
      > We're always looking to improve the mobile experience, and we need testers to help us
      > This channel receives updates from github, you can watch the development in progress.

      ${channelWikicontent}
      > We have a ton of drug information available online: (https://drugs.tripsit.me)
      > New drugs are coming out all the time, EG, Delta 8 THC has become a new thing.
      > We're always looking to improve our substance information, and we need researchers to help us!
      > Researchers (see #vip-welcome) use this room to discuss the content of the wiki.
      > If you want to make a change to the wiki, please make a new thread in this category.
      > *Changes to the wiki will only be made after given a credible source!*

      ${channelTrippit}
      > Development of the reddit bot, WIP.
      `);

    await channelDevonboarding.send(stripIndents`
      If you want to help out but the above projects don't fit, send a message in ${channelDevelopment}
      Or if you just want to chat, send a meme to ${channelDevofftopic}

      Thanks for reading, happy to have you here!
    `);

    // await channelDevonboarding.send(stripIndents`
    //   <:invisible:976824380564852768>
    //   > **What kind of skills do you have?**
    //   > Click below to show how you can contribute to the tripsit community!
    //   > This doesn't give you a role/access, just helps keep track of who knows what.
    //   `)
    //   .then(async msg => {
    //     const emoji = '🥼';
    //     await msg.react(emoji);
    //   });

    // const manager = new ReactionRole(interaction.client, reactionConfig);
    // global.manager = manager;

    // targetData.reactionRoles = reactionConfig;

    // await setGuildInfo(targetResults[1], targetData);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
