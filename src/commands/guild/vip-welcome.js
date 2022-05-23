'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ReactionRole } = require('discordjs-reaction-role');
const { stripIndents } = require('common-tags');
const { getGuildInfo, setGuildInfo } = require('../../utils/firebase');
const logger = require('../../utils/logger');

const PREFIX = path.parse(__filename).name;

const {
  channelVipWelcomeId,
  channelLoungeId,
  channelTalkToTSId,
  channelClearmindId,
  channelPsychonautId,
  channelDissonautId,
  channelGoldLoungeId,
  channelHubId,
  roleResearcherId,
  roleClearmindId,
  roleCoderId,
} = require('../../../env');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vip-welcome')
    .setDescription('Re-creates the vip-welcome information!'),
  async execute(interaction) {
    // await interaction.deferReply();
    // const finalEmbed = template.embedTemplate()
    //   .setTitle('Info created!');
    // interaction.reply({ embeds: [finalEmbed], ephemeral: true });
    logger.debug(`[${PREFIX}] Starting!`);

    const channelVipWelcome = interaction.client.channels.cache.get(channelVipWelcomeId);
    const channelTalkToTS = interaction.client.channels.cache.get(channelTalkToTSId);
    const channelHub = interaction.client.channels.cache.get(channelHubId);
    const channelClearmind = interaction.client.channels.cache.get(channelClearmindId);
    const channelLounge = interaction.client.channels.cache.get(channelLoungeId);
    const channelPsychonaut = interaction.client.channels.cache.get(channelPsychonautId);
    const channelDissonaut = interaction.client.channels.cache.get(channelDissonautId);
    const channelGoldLounge = interaction.client.channels.cache.get(channelGoldLoungeId);

    // Extract data
    const targetResults = await getGuildInfo(interaction.guild);
    const targetData = targetResults[0];
    const reactionConfig = targetData.reactionRoles;

    await channelVipWelcome.send(stripIndents`
      > **Welcome to the VIP section**
      > Once you've been on the network long enough you're given VIP access.
      > This gives you some access that is only available to VIPs:
      > You can talk to the TripSit team in ${channelTalkToTS}: give us feedback or suggest a new idea!
      > Join ${channelHub} to spin up your own voice channel!
      > You've gained access to some higher-level channels like ${channelLounge}, ${channelPsychonaut} and ${channelDissonaut}
      > Access to the notorious ${channelGoldLounge} can be yours by subscribing to our patreon! (https://www.patreon.com/tripsit)
      > Finally, react to the messages below to opt-in to other channels!
      `);

    await channelVipWelcome.send(stripIndents`
        <:invisible:976824380564852768>
        > **Are you interested in TripSit projects?**
        > By reacting to this message you will be given the **Coder** role, and you'll be able to access the Development channels.
        > You don't need to know how to code to pick up this role: all sorts of input is valuable:
        > You can follow along and see the progress being made, and feel free to give your input!
        `)
      .then(async msg => {
        const emoji = '💻';
        await msg.react(emoji);
        reactionConfig.push(
          {
            messageId: msg.id,
            reaction: emoji,
            roleId: roleCoderId,
          },
        );
      });

    await channelVipWelcome.send(stripIndents`
          <:invisible:976824380564852768>
          > **Are you not interested in drug-talk and/or in recovery?**
          > Opt-in to ${channelClearmind} with this role.
          > Any drug talk in this room is strictly forbidden.
          > This is very much WIP, we appreciate your patience!
          `)
      .then(async msg => {
        const emoji = '💠';
        await msg.react(emoji);
        reactionConfig.push(
          {
            messageId: msg.id,
            reaction: emoji,
            roleId: roleClearmindId,
          },
        );
      });

    await channelVipWelcome.send(stripIndents`
          <:invisible:976824380564852768>
          > **Are you a researcher and/or want to help with wiki information?**
          > Click below to be open up #content where we talk about and discuss wiki updates.
          `)
      .then(async msg => {
        const emoji = '🥼';
        await msg.react(emoji);
        reactionConfig.push(
          {
            messageId: msg.id,
            reaction: emoji,
            roleId: roleResearcherId,
          },
        );
      });

    const manager = new ReactionRole(interaction.client, reactionConfig);
    global.manager = manager;

    targetData.reactionRoles = reactionConfig;
    // logger.debug(`[${PREFIX}] target_data: ${JSON.stringify(targetData)}`);

    // Load data
    await setGuildInfo(targetResults[1], targetData);
    // });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
