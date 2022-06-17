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
  NODE_ENV,
  discordToken,
  channelModeratorsId,
  channelModeratorsWebhook,
  channelSandboxId,
  channelSandboxWebhook,
  channelMeetingroomId,
  channelMeetingroomWebhook,
  channelTeamtripsitId,
  channelTeamtripsitWebhook,
  channelOperatorsId,
  channelOperatorsWebhook,
  channelModhavenId,
  channelModhavenWebhook,
  channelDevelopmentId,
  channelDevelopmentWebhook,
  channelTripsitmeId,
  channelTripsitmeWebhook,
  ircServer,
  ircUsername,
  ircPassword,
  ircBridgeUsername,
  ircBridgePassword,
} = require('../../env');

module.exports = {
  async connectIRCBridge() {
    // If there is no password provided, dont even try to connect
    if (!ircPassword) { return; }

    // IRC Connection, this takes a while so do it first
    ircBridgeConfig[0].discordToken = discordToken;
    ircBridgeConfig[0].server = ircServer;

    ircBridgeConfig[0].ircOptions.userName = ircBridgeUsername;
    ircBridgeConfig[0].ircOptions.password = ircBridgePassword;
    ircBridgeConfig[0].nickname = ircBridgeUsername;
    ircBridgeConfig[0].channelMapping = {
      [channelMeetingroomId]: '#meeting-room',
      [channelModeratorsId]: '#moderators',
      [channelTeamtripsitId]: '#teamtripsit',
      [channelOperatorsId]: '#operators',
      [channelModhavenId]: '#modhaven',
      [channelDevelopmentId]: '#tripsit-dev',
      [channelTripsitmeId]: '#tripsit.me',
      [channelSandboxId]: '#sandbox',
    };
    logger.debug(`[${PREFIX}] channelModhavenId: ${channelModhavenId}`);
    logger.debug(`[${PREFIX}] channelSandboxWebhook: ${channelSandboxWebhook}`);
    const webhooks = {
      // [channelMeetingroomId]: channelMeetingroomWebhook,
      // [channelModeratorsId]: channelModeratorsWebhook,
      // [channelTeamtripsitId]: channelTeamtripsitWebhook,
      // [channelOperatorsId]: channelOperatorsWebhook,
      // [channelModhavenId]: channelModhavenWebhook,
      // [channelDevelopmentId]: channelDevelopmentWebhook,
      // [channelTripsitmeId]: channelTripsitmeWebhook,
      [channelSandboxId]: channelSandboxWebhook,
    };
    // logger.debug(JSON.stringify(webhooks, null, 2));
    ircBridgeConfig[0].webhooks = webhooks;

    // logger.debug(`[${PREFIX}] ircBridgeConfig: ${JSON.stringify(ircBridgeConfig, null, 2)}`);
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
