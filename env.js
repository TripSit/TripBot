/* eslint-disable global-require */

'use strict';

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

exports.NODE_ENV = process.env.NODE_ENV;

exports.tsIconUrl = process.env.tsIconUrl;
exports.tsFlameUrl = process.env.tsFlameUrl;
exports.disclaimer = process.env.disclaimer; // TODO: Should this really be an environment variable?

exports.discordToken = process.env.discordToken;
exports.discordOwnerId = process.env.discordOwnerId;
exports.discordClientId = process.env.discordClientId;
exports.discordGuildId = process.env.discordGuildId;

exports.PORT = process.env.PORT;

exports.ircServer = process.env.ircServer;
exports.ircUsername = process.env.ircUsername;
exports.ircPassword = process.env.ircPassword;

exports.firebasePrivateKeyId = process.env.firebasePrivateKeyId;
exports.firebasePrivateKey = process.env.firebasePrivateKey;
exports.firebaseClientId = process.env.firebaseClientId;
exports.firebaseClientEmail = process.env.firebaseClientEmail;
exports.firebaseGuildDbName = process.env.firebaseGuildDbName;
exports.firebaseUserDbName = process.env.firebaseUserDbName;

exports.githubToken = process.env.githubToken;

exports.rapidApiKey = process.env.rapidApiKey;
exports.wolframApiKey = process.env.wolframApiKey;
exports.imgurId = process.env.imgurId;
exports.imgurSecret = process.env.imgurSecret;

exports.channelAnnouncementsId = process.env.channelAnnouncementsId;
exports.channelStartId = process.env.channelStartId;
exports.channelBotspamId = process.env.channelBotspamId;
exports.channelRulesId = process.env.channelRulesId;
exports.channelIrcId = process.env.channelIrcId;

exports.channelTripsitId = process.env.channelTripsitId;
exports.channelSanctuaryId = process.env.channelSanctuaryId;
exports.channelTripsittersId = process.env.channelTripsittersId;
exports.channelTripsitInfoId = process.env.channelTripsitInfoId;
exports.channelDrugQuestionsId = process.env.channelDrugQuestionsId;

exports.channelGeneralId = process.env.channelGeneralId;

exports.channelVipWelcomeId = process.env.channelVipWelcomeId;
exports.channelLoungeId = process.env.channelLoungeId;
exports.channelGoldLoungeId = process.env.channelGoldLoungeId;
exports.channelTalkToTSId = process.env.channelTalkToTSId;
exports.channelClearmindId = process.env.channelClearmindId;
exports.channelPsychonautId = process.env.channelPsychonautId;
exports.channelDissonautId = process.env.channelDissonautId;
exports.channelHubId = process.env.channelHubId;

exports.channelDevonboardingId = process.env.channelDevonboardingId;
exports.channelDevofftopicId = process.env.channelDevofftopicId;
exports.channelDevelopmentId = process.env.channelDevelopmentId;
exports.channelWikicontentId = process.env.channelWikicontentId;
exports.channelTripmobileId = process.env.channelTripmobileId;
exports.channelTripcordId = process.env.channelTripcordId;
exports.channelTripbotId = process.env.channelTripbotId;
exports.channelTrippitId = process.env.channelTrippitId;
exports.channelSandboxId = process.env.channelSandboxId;

exports.channelModlogId = process.env.channelModlogId;
exports.channelModeratorsId = process.env.channelModeratorsId;

exports.roleNeedshelpId = process.env.roleNeedshelpId;
exports.roleTripsitterId = process.env.roleTripsitterId;
exports.roleHelperId = process.env.roleHelperId;
exports.roleModeratorId = process.env.roleModeratorId;
exports.roleDeveloperId = process.env.roleDeveloperId;
exports.roleVipId = process.env.roleVipId;
exports.roleCoderId = process.env.roleCoderId;
exports.roleClearmindId = process.env.roleClearmindId;
exports.roleResearcherId = process.env.roleResearcherId;

exports.roleRedId = process.env.roleRedId;
exports.roleOrangeId = process.env.roleOrangeId;
exports.roleYellowId = process.env.roleYellowId;
exports.roleGreenId = process.env.roleGreenId;
exports.roleBlueId = process.env.roleBlueId;
exports.rolePurpleId = process.env.rolePurpleId;
exports.rolePinkId = process.env.rolePinkId;
exports.roleBrownId = process.env.roleBrownId;
exports.roleBlackId = process.env.roleBlackId;
exports.roleWhiteId = process.env.roleWhiteId;

exports.roleDrunkId = process.env.roleDrunkId;
exports.roleHighId = process.env.roleHighId;
exports.roleRollingId = process.env.roleRollingId;
exports.roleTrippingId = process.env.roleTrippingId;
exports.roleDissociatingId = process.env.roleDissociatingId;
exports.roleStimmingId = process.env.roleStimmingId;
exports.roleNoddingId = process.env.roleNoddingId;
exports.roleSoberId = process.env.roleSoberId;

exports.channelModeratorsWebhook = process.env.channelModeratorsWebhook;
exports.channelSandboxWebhook = process.env.channelSandboxWebhook;
