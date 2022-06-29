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
exports.discordClientSecret = process.env.discordClientSecret;
exports.discordOauthUrl = process.env.discordOauthUrl;
exports.discordIrcAdminId = process.env.discordIrcAdminId;

exports.PORT = process.env.PORT;

exports.ircServer = process.env.ircServer;
exports.ircUsername = process.env.ircUsername;
exports.ircPassword = process.env.ircPassword;
exports.ircBridgeUsername = process.env.ircBridgeUsername;
exports.ircBridgePassword = process.env.ircBridgePassword;

exports.firebasePrivateKeyId = process.env.firebasePrivateKeyId;
exports.firebasePrivateKey = process.env.firebasePrivateKey;
exports.firebaseClientId = process.env.firebaseClientId;
exports.firebaseClientEmail = process.env.firebaseClientEmail;
exports.firebaseGuildDbName = process.env.firebaseGuildDbName;
exports.firebaseUserDbName = process.env.firebaseUserDbName;
exports.firebaseTicketDbName = process.env.firebaseTicketDbName;

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
exports.channelHowToTripsitId = process.env.channelHowToTripsitId;
exports.channelDrugQuestionsId = process.env.channelDrugQuestionsId;
exports.channelOpentripsitId = process.env.channelOpentripsitId;
exports.channelOpentripsit1Id = process.env.channelOpentripsit1Id;
exports.channelOpentripsit2Id = process.env.channelOpentripsit2Id;
exports.channelClosedtripsitId = process.env.channelClosedtripsitId;

exports.channelGeneralId = process.env.channelGeneralId;
exports.channelPetsId = process.env.channelPetsId;
exports.channelFoodId = process.env.channelFoodId;
exports.channelMusicId = process.env.channelMusicId;
exports.channelScienceId = process.env.channelScienceId;
exports.channelGamingId = process.env.channelGamingId;
exports.channelCreativeId = process.env.channelCreativeId;
exports.channelPsychedelicId = process.env.channelPsychedelicId;

exports.channelVipWelcomeId = process.env.channelVipWelcomeId;
exports.channelFlameboardId = process.env.channelFlameboardId;
exports.channelViploungeId = process.env.channelViploungeId;
exports.channelGoldLoungeId = process.env.channelGoldLoungeId;
exports.channelTalkToTSId = process.env.channelTalkToTSId;
exports.channelClearmindId = process.env.channelClearmindId;
exports.channelPsychonautId = process.env.channelPsychonautId;
exports.channelDissonautId = process.env.channelDissonautId;
exports.channelHubId = process.env.channelHubId;
exports.channelTripradioId = process.env.channelTripradioId;
exports.channelMinecraftId = process.env.channelMinecraftId;
exports.channelFastchatId = process.env.channelFastchatId;
exports.channelSlowchatId = process.env.channelSlowchatId;

exports.channelDevonboardingId = process.env.channelDevonboardingId;
exports.channelDevofftopicId = process.env.channelDevofftopicId;
exports.channelDevelopmentId = process.env.channelDevelopmentId;
exports.channelWikicontentId = process.env.channelWikicontentId;
exports.channelTripmobileId = process.env.channelTripmobileId;
exports.channelTripcordId = process.env.channelTripcordId;
exports.channelTripbotId = process.env.channelTripbotId;
exports.channelTrippitId = process.env.channelTrippitId;
exports.channelSandboxId = process.env.channelSandboxId;
exports.channelTripbotlogsId = process.env.channelTripbotlogsId;

exports.channelModlogId = process.env.channelModlogId;
exports.channelModeratorsId = process.env.channelModeratorsId;
exports.channelMeetingroomId = process.env.channelMeetingroomId;
exports.channelTeamtripsitId = process.env.channelTeamtripsitId;
exports.channelOperatorsId = process.env.channelOperatorsId;
exports.channelModhavenId = process.env.channelModhavenId;
exports.channelTripsitmeId = process.env.channelTripsitmeId;

exports.roleDirectorId = process.env.roleDirectorId;
exports.roleSuccessorId = process.env.roleSuccessorId;
exports.roleSysadminId = process.env.roleSysadminId;
exports.roleLeaddevId = process.env.roleLeaddevId;
exports.roleIrcadminId = process.env.roleIrcadminId;
exports.roleDiscordadminId = process.env.roleDiscordadminId;
exports.roleIrcopId = process.env.roleIrcopId;
exports.roleModeratorId = process.env.roleModeratorId;
exports.roleTripsitterId = process.env.roleTripsitterId;
exports.roleTeamtripsitId = process.env.roleTeamtripsitId;
exports.roleTripbotId = process.env.roleTripbotId;
exports.roleTripbot2Id = process.env.roleTripbot2Id;
exports.roleBotId = process.env.roleBotId;
exports.roleDeveloperId = process.env.roleDeveloperId;

exports.roleDrunkId = process.env.roleDrunkId;
exports.roleHighId = process.env.roleHighId;
exports.roleRollingId = process.env.roleRollingId;
exports.roleTrippingId = process.env.roleTrippingId;
exports.roleDissociatingId = process.env.roleDissociatingId;
exports.roleStimmingId = process.env.roleStimmingId;
exports.roleNoddingId = process.env.roleNoddingId;
exports.roleSoberId = process.env.roleSoberId;
exports.roleWorkingId = process.env.roleWorkingId;
exports.roleTalkativeId = process.env.roleTalkativeId;

exports.roleNeedshelpId = process.env.roleNeedshelpId;
exports.roleHelperId = process.env.roleHelperId;

exports.rolePatronId = process.env.rolePatronId;

exports.roleVipId = process.env.roleVipId;
exports.roleDjId = process.env.roleDjId;
exports.roleIrcVerifiedId = process.env.roleIrcVerifiedId;

exports.roleResearcherId = process.env.roleResearcherId;
exports.roleClearmindId = process.env.roleClearmindId;
exports.roleCoderId = process.env.roleCoderId;

exports.roleTempvoiceId = process.env.roleTempvoiceId;
exports.roleMutedId = process.env.roleMutedId;

exports.roleSproutId = process.env.roleSproutId;
exports.roleSeedlingId = process.env.roleSeedlingId;
exports.roleBoosterId = process.env.roleBoosterId;

exports.roleHrpresenterId = process.env.roleHrpresenterId;
exports.roleHrlistenerId = process.env.roleHrlistenerId;
exports.roleHrModeratoreId = process.env.roleHrModeratoreId;

exports.roleNewbie = process.env.roleNewbie;

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

exports.roleVotebannedId = process.env.roleVotebannedId;
exports.roleVotekickedId = process.env.roleVotekickedId;
exports.roleVotetimeoutId = process.env.roleVotetimeoutId;
exports.roleVoteunderbanId = process.env.roleVoteunderbanId;

exports.channelAnnouncementsWebhook = process.env.channelAnnouncementsWebhook;
exports.channelStartWebhook = process.env.channelStartWebhook;
exports.channelBotspamWebhook = process.env.channelBotspamWebhook;
exports.channelRulesWebhook = process.env.channelRulesWebhook;
exports.channelIrcWebhook = process.env.channelIrcWebhook;

exports.channelTripsitWebhook = process.env.channelTripsitWebhook;
exports.channelSanctuaryWebhook = process.env.channelSanctuaryWebhook;
exports.channelTripsittersWebhook = process.env.channelTripsittersWebhook;
exports.channelHowToTripsitWebhook = process.env.channelHowToTripsitWebhook;
exports.channelDrugQuestionsWebhook = process.env.channelDrugQuestionsWebhook;
exports.channelOpentripsitWebhook = process.env.channelOpentripsitWebhook;
exports.channelOpentripsit1Webhook = process.env.channelOpentripsit1Webhook;
exports.channelOpentripsit2Webhook = process.env.channelOpentripsit2Webhook;
exports.channelClosedtripsitWebhook = process.env.channelClosedtripsitWebhook;

exports.channelGeneralWebhook = process.env.channelGeneralWebhook;
exports.channelPetsWebhook = process.env.channelPetsWebhook;
exports.channelFoodWebhook = process.env.channelFoodWebhook;
exports.channelMusicWebhook = process.env.channelMusicWebhook;
exports.channelScienceWebhook = process.env.channelScienceWebhook;
exports.channelGamingWebhook = process.env.channelGamingWebhook;
exports.channelCreativeWebhook = process.env.channelCreativeWebhook;
exports.channelPsychedelicWebhook = process.env.channelPsychedelicWebhook;

exports.channelVipWelcomeWebhook = process.env.channelVipWelcomeWebhook;
exports.channelViploungeWebhook = process.env.channelViploungeWebhook;
exports.channelGoldLoungeWebhook = process.env.channelGoldLoungeWebhook;
exports.channelTalkToTSWebhook = process.env.channelTalkToTSWebhook;
exports.channelClearmindWebhook = process.env.channelClearmindWebhook;
exports.channelPsychonautWebhook = process.env.channelPsychonautWebhook;
exports.channelDissonautWebhook = process.env.channelDissonautWebhook;
exports.channelHubWebhook = process.env.channelHubWebhook;
exports.channelTripradioWebhook = process.env.channelTripradioWebhook;
exports.channelMinecraftWebhook = process.env.channelMinecraftWebhook;
exports.channelFastchatWebhook = process.env.channelFastchatWebhook;
exports.channelSlowchatWebhook = process.env.channelSlowchatWebhook;

exports.channelDevonboardingWebhook = process.env.channelDevonboardingWebhook;
exports.channelDevofftopicWebhook = process.env.channelDevofftopicWebhook;
exports.channelDevelopmentWebhook = process.env.channelDevelopmentWebhook;
exports.channelWikicontentWebhook = process.env.channelWikicontentWebhook;
exports.channelTripmobileWebhook = process.env.channelTripmobileWebhook;
exports.channelTripcordWebhook = process.env.channelTripcordWebhook;
exports.channelTripbotWebhook = process.env.channelTripbotWebhook;
exports.channelTrippitWebhook = process.env.channelTrippitWebhook;
exports.channelSandboxWebhook = process.env.channelSandboxWebhook;
exports.channelTripbotlogsWebhook = process.env.channelTripbotlogsWebhook;

exports.channelModlogWebhook = process.env.channelModlogWebhook;
exports.channelModeratorsWebhook = process.env.channelModeratorsWebhook;
exports.channelMeetingroomWebhook = process.env.channelMeetingroomWebhook;
exports.channelTeamtripsitWebhook = process.env.channelTeamtripsitWebhook;
exports.channelOperatorsWebhook = process.env.channelOperatorsWebhook;
exports.channelModhavenWebhook = process.env.channelModhavenWebhook;
exports.channelTripsitmeWebhook = process.env.channelTripsitmeWebhook;
