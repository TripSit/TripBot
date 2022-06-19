'use strict';

const path = require('path');
const irc = require('irc-upd');
const discordIRC = require('discord-irc').default;
const logger = require('./logger');
const ircConfig = require('../assets/irc_config.json');
const ircBridgeConfig = require('../assets/irc_bridge_config.json');

const { verifyLink } = require('../commands/guild/link-accounts');

const PREFIX = path.parse(__filename).name;

const {
  ircServer,
  ircUsername,
  ircPassword,
  ircBridgeUsername,
  ircBridgePassword,
  discordToken,
  // channelAnnouncementsWebhook,
  // channelStartWebhook,
  // channelBotspamWebhook,
  // channelRulesWebhook,
  // channelIrcWebhook,
  // channelTripsitWebhook,
  // channelSanctuaryWebhook,
  channelTripsittersWebhook,
  // channelHowToTripsitWebhook,
  // channelDrugQuestionsWebhook,
  channelOpentripsitWebhook,
  // channelOpentripsit1Webhook,
  channelOpentripsit2Webhook,
  channelClosedtripsitWebhook,
  // channelGeneralWebhook,
  // channelPetsWebhook,
  // channelFoodWebhook,
  // channelMusicWebhook,
  // channelScienceWebhook,
  // channelGamingWebhook,
  // channelCreativeWebhook,
  // channelPsychedelicWebhook,
  // channelVipWelcomeWebhook,
  // channelViploungeWebhook,
  // channelGoldLoungeWebhook,
  // channelTalkToTSWebhook,
  // channelClearmindWebhook,
  // channelPsychonautWebhook,
  // channelDissonautWebhook,
  // channelHubWebhook,
  // channelTripradioWebhook,
  // channelMinecraftWebhook,
  // channelFastchatWebhook,
  // channelSlowchatWebhook,
  // channelDevonboardingWebhook,
  // channelDevofftopicWebhook,
  channelDevelopmentWebhook,
  channelWikicontentWebhook,
  // channelTripmobileWebhook,
  // channelTripcordWebhook,
  // channelTripbotWebhook,
  // channelTrippitWebhook,
  channelSandboxWebhook,
  // channelTripbotlogsWebhook,
  // channelModlogWebhook,
  channelModeratorsWebhook,
  channelMeetingroomWebhook,
  channelTeamtripsitWebhook,
  channelOperatorsWebhook,
  channelModhavenWebhook,
  channelTripsitmeWebhook,
  // channelAnnouncementsId,
  // channelStartId,
  // channelBotspamId,
  // channelRulesId,
  // channelIrcId,
  // channelTripsitId,
  // channelSanctuaryId,
  channelTripsittersId,
  // channelHowToTripsitId,
  // channelDrugQuestionsId,
  channelOpentripsitId,
  // channelOpentripsit1Id,
  channelOpentripsit2Id,
  channelClosedtripsitId,
  // channelGeneralId,
  // channelPetsId,
  // channelFoodId,
  // channelMusicId,
  // channelScienceId,
  // channelGamingId,
  // channelCreativeId,
  // channelPsychedelicId,
  // channelVipWelcomeId,
  // channelViploungeId,
  // channelGoldLoungeId,
  // channelTalkToTSId,
  // channelClearmindId,
  // channelPsychonautId,
  // channelDissonautId,
  // channelHubId,
  // channelTripradioId,
  // channelMinecraftId,
  // channelFastchatId,
  // channelSlowchatId,
  // channelDevonboardingId,
  // channelDevofftopicId,
  channelDevelopmentId,
  channelWikicontentId,
  // channelTripmobileId,
  // channelTripcordId,
  // channelTripbotId,
  // channelTrippitId,
  channelSandboxId,
  // channelTripbotlogsId,
  // channelModlogId,
  channelModeratorsId,
  channelMeetingroomId,
  channelTeamtripsitId,
  channelOperatorsId,
  channelModhavenId,
  channelTripsitmeId,
} = require('../../env');

module.exports = {
  async connectIRCBridge() {
    // If there is no password provided, dont even try to connect
    if (!ircPassword) { return; }

    // IRC Connection, this takes a while so do it first
    ircBridgeConfig[0].discordToken = discordToken;
    ircBridgeConfig[0].server = ircServer;

    ircBridgeConfig[0].ircOptions.username = ircBridgeUsername;
    ircBridgeConfig[0].ircOptions.password = ircBridgePassword;
    ircBridgeConfig[0].nickname = ircBridgeUsername;
    ircBridgeConfig[0].channelMapping = {
      // [channelAnnouncementsId]: '#', // Static channel
      // [channelStartId]: '#', // Static channel
      // [channelBotspamId]: '#', // No need to bridge
      // [channelRulesId]: '#', // Static channel
      // [channelIrcId]: '#', // Static channel

      // [channelTripsitId]: '#', // Static channel
      // [channelSanctuaryId]: '#sanctuary', // Potato currently bridges
      [channelTripsittersId]: '#tripsitters',
      // [channelHowToTripsitId]: '#', // Static channel
      // [channelDrugQuestionsId]: '#', // Static channel
      [channelOpentripsitId]: '#tripsit',
      // [channelOpentripsit1Id]: '#tripsit1', // Potato currently bridges
      [channelOpentripsit2Id]: '#tripsit2',
      [channelClosedtripsitId]: '#tripsit3',

      // [channelGeneralId]: '#lounge', // Phase2
      // [channelPetsId]: '#pets', // Phase2
      // [channelFoodId]: '#cooking', // Phase2
      // [channelMusicId]: '#music', // Phase2
      // [channelScienceId]: '#science', // Phase2
      // [channelGamingId]: '#gaming', // Phase2
      // [channelCreativeId]: '#creative', // Phase2
      // [channelPsychedelicId]: '#psychedelic', // Phase2

      // [channelVipWelcomeId]: '#', // Static channel
      // [channelViploungeId]: '#tripsitvip', // Phase2
      // [channelGoldLoungeId]: '#gold-lounge', // Phase2
      // [channelTalkToTSId]: '#', // Static channel
      // [channelClearmindId]: '#recovery', // Phase2
      // [channelPsychonautId]: '#psychonaut', // Phase2
      // [channelDissonautId]: '#dissonaut', // Phase2
      // [channelHubId]: '#', // Voice channel
      // [channelTripradioId]: '#', // Voice channel
      // [channelMinecraftId]: '#minecraft',
      // [channelFastchatId]: '#stims', // Phase2
      // [channelSlowchatId]: '#opiates', // Talk with phusion

      // [channelDevonboardingId]: '#', // Static channel
      // [channelDevofftopicId]: '#', // No plans to bridge
      [channelDevelopmentId]: '#tripsit-dev',
      [channelWikicontentId]: '#content',
      // [channelTripmobileId]: '#', // No plans to bridge
      // [channelTripcordId]: '#', // No plans to bridge
      // [channelTripbotId]: '#', // No plans to bridge
      // [channelTrippitId]: '#', // No plans to bridge
      [channelSandboxId]: '#sandbox',
      // [channelTripbotlogsId]: '#', // No plans to bridge

      // [channelModlogId]: '#', // No plans to bridge
      [channelModeratorsId]: '#moderators',
      [channelMeetingroomId]: '#meeting-room',
      [channelTeamtripsitId]: '#teamtripsit',
      [channelOperatorsId]: '#operations',
      [channelModhavenId]: '#modhaven',
      [channelTripsitmeId]: '#tripsit.me',
    };
    const webhooks = {
      // [channelAnnouncementsWebhook]: channelAnnouncementsWebhook,
      // [channelStartWebhook]: channelStartWebhook,
      // [channelBotspamWebhook]: channelBotspamWebhook,
      // [channelRulesWebhook]: channelRulesWebhook,
      // [channelIrcWebhook]: channelIrcWebhook,
      // [channelTripsitWebhook]: channelTripsitWebhook,
      // [channelSanctuaryWebhook]: channelSanctuaryWebhook,
      // !!![channelTripsittersId]: channelTripsittersWebhook,
      // [channelHowToTripsitWebhook]: channelHowToTripsitWebhook,
      // [channelDrugQuestionsWebhook]: channelDrugQuestionsWebhook,
      // !!![channelOpentripsitId]: channelOpentripsitWebhook,
      // [channelOpentripsit1Webhook]: channelOpentripsit1Webhook,
      // !!![channelOpentripsit2Id]: channelOpentripsit2Webhook,
      // !!![channelClosedtripsitId]: channelClosedtripsitWebhook,
      // [channelGeneralWebhook]: channelGeneralWebhook,
      // [channelPetsWebhook]: channelPetsWebhook,
      // [channelFoodWebhook]: channelFoodWebhook,
      // [channelMusicWebhook]: channelMusicWebhook,
      // [channelScienceWebhook]: channelScienceWebhook,
      // [channelGamingWebhook]: channelGamingWebhook,
      // [channelCreativeWebhook]: channelCreativeWebhook,
      // [channelPsychedelicWebhook]: channelPsychedelicWebhook,
      // [channelVipWelcomeWebhook]: channelVipWelcomeWebhook,
      // [channelViploungeWebhook]: channelViploungeWebhook,
      // [channelGoldLoungeWebhook]: channelGoldLoungeWebhook,
      // [channelTalkToTSWebhook]: channelTalkToTSWebhook,
      // [channelClearmindWebhook]: channelClearmindWebhook,
      // [channelPsychonautWebhook]: channelPsychonautWebhook,
      // [channelDissonautWebhook]: channelDissonautWebhook,
      // [channelHubWebhook]: channelHubWebhook,
      // [channelTripradioWebhook]: channelTripradioWebhook,
      // [channelMinecraftWebhook]: channelMinecraftWebhook,
      // [channelFastchatWebhook]: channelFastchatWebhook,
      // [channelSlowchatWebhook]: channelSlowchatWebhook,
      // [channelDevonboardingWebhook]: channelDevonboardingWebhook,
      // [channelDevofftopicWebhook]: channelDevofftopicWebhook,
      [channelDevelopmentId]: channelDevelopmentWebhook,
      // !!![channelWikicontentId]: channelWikicontentWebhook,
      // [channelTripmobileWebhook]: channelTripmobileWebhook,
      // [channelTripcordWebhook]: channelTripcordWebhook,
      // [channelTripbotWebhook]: channelTripbotWebhook,
      // [channelTrippitWebhook]: channelTrippitWebhook,
      [channelSandboxId]: channelSandboxWebhook,
      // [channelTripbotlogsWebhook]: channelTripbotlogsWebhook,
      // [channelModlogWebhook]: channelModlogWebhook,
      [channelModeratorsId]: channelModeratorsWebhook,
      [channelMeetingroomId]: channelMeetingroomWebhook,
      [channelTeamtripsitId]: channelTeamtripsitWebhook,
      [channelOperatorsId]: channelOperatorsWebhook,
      [channelModhavenId]: channelModhavenWebhook,
      [channelTripsitmeId]: channelTripsitmeWebhook,
    };
    // logger.debug(JSON.stringify(webhooks, null, 2));
    ircBridgeConfig[0].webhooks = webhooks;

    logger.debug(`[${PREFIX}] ircBridgeConfig: ${JSON.stringify(ircBridgeConfig, null, 2)}`);
    discordIRC(ircBridgeConfig);
  },
  async connectIRC(client) {
    // If there is no password provided, dont even try to connect
    if (!ircPassword) { return; }

    ircConfig.userName = ircUsername;
    ircConfig.password = ircPassword;

    // logger.debug(`[${PREFIX}] ircConfig: ${JSON.stringify(ircConfig, null, 2)}`);
    global.ircClient = new irc.Client(ircServer, ircUsername, ircConfig);
    global.ircClient.addListener('registered', () => {
      logger.debug(`[${PREFIX}] Registered!`);
      // global.ircClient.say('Moonbear', 'Hello world!');
    });
    global.ircClient.addListener('pm', async (from, message) => {
      logger.debug(`[${PREFIX}] PM from ${from}: ${message}`);

      const tokenRegex = /\S{6}-\S{6}-\S{6}/;

      const token = message.match(tokenRegex);

      if (token !== null) {
        logger.debug(`[${PREFIX}] PM token: ${token}`);
        // global.ircClient.say(from, `Your token is ${token}`);
        await global.ircClient.whois(from, info => {
          if (!info.account) {
            global.ircClient.say(from, `${from} is not registered on IRC, please go ~register on IRC!`);
          }
          // logger.debug(`[${PREFIX}] PM info: ${JSON.stringify(info, null, 2)}`);
          verifyLink(client, 'irc', info, token);
        });
      }
    });
    global.ircClient.addListener('error', message => {
      logger.error(`[${PREFIX}] Error - ${JSON.stringify(message, null, 2)}`);
      // global.ircClient.say('Moonbear', 'Hello world!');
    });
  },
};
