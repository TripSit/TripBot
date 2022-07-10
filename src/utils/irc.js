'use strict';

const path = require('path');
const irc = require('irc-upd');
const discordIRC = require('discord-irc').default;
const logger = require('./logger');
const ircConfig = require('../assets/irc_config.json');
const ircBridgeConfig = require('../assets/irc_bridge_config.json');
const { watcher } = require('./uatu');
const { experience } = require('./experience');
const { verifyLink } = require('../commands/guild/link-accounts');

const PREFIX = path.parse(__filename).name;

const {
  NODE_ENV,
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
  // channelTripsittersWebhook,
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
  // channelMoviesWebhook,
  // channelGamingWebhook,
  // channelScienceWebhook,
  // channelCreativeWebhook,

  channelLoungeWebhook,
  channelOpiatesWebhook,
  channelDeleriantsWebhook,
  channelStimulantsWebhook,
  channelDepressantsWebhook,
  channelDissociativesWebhook,
  channelPsychedelicsWebhook,

  // channelVipWelcomeWebhook,
  // channelTalkToTSWebhook,
  // channelViploungeWebhook,
  // channelDissonautWebhook,
  // channelPsychonautWebhook,
  // channelAdultswimWebhook,
  // channelGoldLoungeWebhook,
  // channelClearmindWebhook,
  // channelMinecraftWebhook,
  // channelHubWebhook,

  // channelTripradioWebhook,

  // channelDevonboardingWebhook,
  channelDevofftopicWebhook,
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
  // channelModhavenWebhook,
  channelTripsitmeWebhook,

  // channelAnnouncementsId,
  // channelStartId,
  // channelBotspamId,
  // channelRulesId,
  // channelIrcId,

  // channelTripsitId,
  // channelSanctuaryId,
  // channelTripsittersId,
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
  // channelMoviesId,
  // channelGamingId,
  // channelScienceId,
  // channelCreativeId,

  channelLoungeId,
  channelOpiatesId,
  channelDeleriantsId,
  channelStimulantsId,
  channelDepressantsId,
  channelDissociativesId,
  channelPsychedelicsId,

  // channelVipWelcomeId,
  // channelBestOfTripsitId
  // channelTalkToTSId,
  // channelViploungeId,
  // channelDissonautId,
  // channelPsychonautId,
  // channelAdultswimId,
  // channelGoldLoungeId,
  // channelClearmindId,
  // channelMinecraftId,
  // channelHubId,

  // channelTripradioId,

  // channelDevonboardingId,
  channelDevofftopicId,
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
  // channelModhavenId,
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
    let webhooks = [];
    if (NODE_ENV === 'production') {
      ircBridgeConfig[0].channelMapping = {
        // [channelAnnouncementsId]: '#', // Static channel
        // [channelStartId]: '#', // Static channel
        // [channelBotspamId]: '#', // No need to bridge
        // [channelRulesId]: '#', // Static channel
        // [channelIrcId]: '#', // Static channel

        // [channelTripsitId]: '#', // Static channel
        // [channelSanctuaryId]: '#sanctuary', // Potato currently bridges
        // [channelTripsittersId]: '#tripsitters',
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
        // [channelMoviesId]: '#movies', // Phase2
        // [channelGamingId]: '#gaming', // Phase2
        // [channelScienceId]: '#science', // Phase2
        // [channelCreativeId]: '#creative', // Phase2

        [channelLoungeId]: '#lounge', // Phusion agreed
        [channelOpiatesId]: '#opiates', // Phusion agreed
        [channelStimulantsId]: '#stims', // Phase2
        [channelDepressantsId]: '#depressants', // Phase2
        [channelDissociativesId]: '#dissociatives', // Phase2
        [channelPsychedelicsId]: '#psychedelics', // Phase2

        // [channelVipWelcomeId]: '#', // Static channel
        // [channelBestoftripsitId]: '#', // Not bridged
        // [channelTalkToTSId]: '#', // Static channel
        // [channelViploungeId]: '#tripsitvip', // Phase2
        // [channelDissonautId]: '#dissonaut', // Phase2
        // [channelPsychonautId]: '#psychonaut', // Phase2
        // [channelAdultswimId]: '#psychonaut', // Phase2
        // [channelGoldLoungeId]: '#gold-lounge', // Phase2
        // [channelClearmindId]: '#recovery', // Phase2
        // [channelMinecraftId]: '#minecraft',
        // [channelHubId]: '#', // Voice channel

        // [channelTripradioId]: '#', // Voice channel

        // [channelDevannounceId]: '#', // Static channel
        // [channelDevonboardingId]: '#', // Static channel
        [channelDevofftopicId]: '#compsci',
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
        // [channelModhavenId]: '#modhaven',
        [channelTripsitmeId]: '#tripsit.me',
      };
      webhooks = {
        // [channelAnnouncementsId]: channelAnnouncementsWebhook,
        // [channelStartId]: channelStartWebhook,
        // [channelBotspamId]: channelBotspamWebhook,
        // [channelRulesId]: channelRulesWebhook,
        // [channelIrcId]: channelIrcWebhook,

        // [channelTripsitId]: channelTripsitWebhook,
        // [channelSanctuaryId]: channelSanctuaryWebhook,
        // [channelTripsittersId]: channelTripsittersWebhook,
        // [channelHowToTripsitId]: channelHowToTripsitWebhook,
        // [channelDrugQuestionsId]: channelDrugQuestionsWebhook,
        [channelOpentripsitId]: channelOpentripsitWebhook,
        // [channelOpentripsit1Id]: channelOpentripsit1Webhook,
        [channelOpentripsit2Id]: channelOpentripsit2Webhook,
        [channelClosedtripsitId]: channelClosedtripsitWebhook,

        // [channelGeneralId]: channelGeneralWebhook,
        // [channelPetsId]: channelPetsWebhook,
        // [channelFoodId]: channelFoodWebhook,
        // [channelMusicId]: channelMusicWebhook,
        // [channelMoviesId]: channelMoviesWebhook,
        // [channelGamingId]: channelGamingWebhook,
        // [channelScienceId]: channelScienceWebhook,
        // [channelCreativeId]: channelCreativeWebhook,

        [channelLoungeId]: channelLoungeWebhook,
        [channelOpiatesId]: channelOpiatesWebhook,
        [channelDeleriantsId]: channelDeleriantsWebhook,
        [channelStimulantsId]: channelStimulantsWebhook,
        [channelDepressantsId]: channelDepressantsWebhook,
        [channelDissociativesId]: channelDissociativesWebhook,
        [channelPsychedelicsId]: channelPsychedelicsWebhook,

        // [channelVipWelcomeId]: channelVipWelcomeWebhook,
        // [channelTalkToTSId]: channelTalkToTSWebhook,
        // [channelViploungeId]: channelViploungeWebhook,
        // [channelDissonautId]: channelDissonautWebhook,
        // [channelPsychonautId]: channelPsychonautWebhook,
        // [channelAdultswimId]: channelAdultswimWebhook,
        // [channelGoldLoungeId]: channelGoldLoungeWebhook,
        // [channelClearmindId]: channelClearmindWebhook,
        // [channelMinecraftId]: channelMinecraftWebhook,
        // [channelHubId]: channelHubWebhook,

        // [channelTripradioId]: channelTripradioWebhook,

        // [channelDevonboardingId]: channelDevonboardingWebhook,
        [channelDevofftopicId]: channelDevofftopicWebhook,
        [channelDevelopmentId]: channelDevelopmentWebhook,
        [channelWikicontentId]: channelWikicontentWebhook,
        // [channelTripmobileId]: channelTripmobileWebhook,
        // [channelTripcordId]: channelTripcordWebhook,
        // [channelTripbotId]: channelTripbotWebhook,
        // [channelTrippitId]: channelTrippitWebhook,
        [channelSandboxId]: channelSandboxWebhook,
        // [channelTripbotlogsId]: channelTripbotlogsWebhook,
        // [channelModlogId]: channelModlogWebhook,
        [channelModeratorsId]: channelModeratorsWebhook,
        [channelMeetingroomId]: channelMeetingroomWebhook,
        [channelTeamtripsitId]: channelTeamtripsitWebhook,
        [channelOperatorsId]: channelOperatorsWebhook,
        // [channelModhavenId]: channelModhavenWebhook,
        [channelTripsitmeId]: channelTripsitmeWebhook,
      };
    }
    // const channelTripsitId = '960606558373441559';
    if (NODE_ENV === 'development') {
      ircBridgeConfig[0].channelMapping = {
        [channelSandboxId]: '#sandbox-dev',
        // [channelTripsitId]: '#sandbox-dev',
      };
      webhooks = {
        [channelSandboxId]: channelSandboxWebhook,
        // [channelTripsitId]: '',
      };
    }

    // logger.debug(JSON.stringify(webhooks, null, 2));
    ircBridgeConfig[0].webhooks = webhooks;

    // logger.debug(`[${PREFIX}] ircBridgeConfig: ${JSON.stringify(ircBridgeConfig, null, 2)}`);
    discordIRC(ircBridgeConfig);
  },
  async connectIRC(client) {
    // If there is no password provided, dont even try to connect
    if (!ircPassword) { return; }

    let ircChannels = [];
    if (NODE_ENV === 'production') {
      ircChannels = [
        '#sanctuary',
        '#tripsit',
        '#tripsit1',
        '#tripsit2',
        '#tripsit3',
        '#tripsit-dev',
        '#content',
        '#sandbox',
        '#lounge',
        '#opiates',
        '#stims',
        '#depressants',
        '#dissociatives',
        '#psychedelics',
        '#moderators',
        '#meeting-room',
        '#teamtripsit',
        '#operations',
        '#modhaven',
        '#tripsit.me',
      ];
    } else {
      ircChannels = [
        '#sandbox-dev',
      ];
    }

    ircConfig.userName = ircUsername;
    ircConfig.password = ircPassword;
    ircConfig.channels = ircChannels;

    // logger.debug(`[${PREFIX}] ircConfig: ${JSON.stringify(ircConfig, null, 2)}`);
    global.ircClient = new irc.Client(ircServer, ircUsername, ircConfig);
    global.ircClient.addListener('registered', () => {
      logger.debug(`[${PREFIX}] Registered!`);
      // global.ircClient.say('Moonbear', 'Hello world!');
    });
    global.ircClient.addListener('error', message => {
      const errorObj = message;
      errorObj.stackTraceLimit = Infinity;
      logger.error(`[${PREFIX}] error.name: ${errorObj.name} on line ${errorObj.stack.split('\n')[4]}`);
      logger.error(`[${PREFIX}] error.message: ${errorObj.message}`);
      logger.error(`[${PREFIX}] error.stack: ${errorObj.stack}`);
      logger.error(`[${PREFIX}] error.code: ${errorObj.code}`);
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
    global.ircClient.addListener('message#', (nick, to, text, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      // {
      //   "prefix": "Moonbear!~teknos@tripsit/founder/Teknos",
      //   "nick": "Moonbear",
      //   "user": "~teknos",
      //   "host": "tripsit/founder/Teknos",
      //   "command": "PRIVMSG",
      //   "rawCommand": "PRIVMSG",
      //   "commandType": "normal",
      //   "args": [
      //     "#sandbox-dev",
      //     "test"
      //   ]
      // }
      experience(message, client);
    });
    global.ircClient.addListener('join', (channel, nick, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('part', (channel, nick, reason, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('kick', (channel, nick, by, reason, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('quit', (nick, reason, channels, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('kill', (nick, reason, channels, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('nick', (oldnick, newnick, channels, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message, newnick);
    });
  },
};
