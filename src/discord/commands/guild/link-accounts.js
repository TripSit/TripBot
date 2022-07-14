'use strict';

const PREFIX = require('path').parse(__filename).name;
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../../global/utils/logger');
const { getUserInfo, setUserInfo } = require('../../../global/services/firebaseAPI');
const template = require('../../utils/embed-template');

const {
  discordGuildId,
  roleIrcVerifiedId,
} = require('../../../../env');

// {
//   "nick": "unauthed_user",
//   "user": "~username",
//   "host": "192.168.0.0",
//   "realname": "user @ Webchat",
//   "channels": [
//   ],
//   "server": "innsbruck.tripsit.me",
//   "serverinfo": "TripSit IRC Private Jet Receipt Server",
//   "idle": "0"
// }
// {
//   "nick": "authed_user",
//   "user": "~username",
//   "host": "tripsit/user/username",
//   "realname": "realname",
//   "channels": [
//   ],
//   "server": "innsbruck.tripsit.me",
//   "serverinfo": "TripSit IRC Private Jet Receipt Server",
//   "idle": "0",
//   "account": "AccountName",
//   "accountinfo": "is logged in as"
// }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link-account')
    .setDescription('Link your discord account across various services!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Link your account to IRC')
      .addStringOption(option => option
        .setName('nickname')
        .setDescription('What is your IRC nickname?')
        .setRequired(true))
      .setName('irc')),
  // .addSubcommand(subcommand => subcommand
  //   .setDescription('Link your account to Telegram')
  //   .addStringOption(option => option
  //     .setName('nickname')
  //     .setDescription('What is your Telegram username?')
  //     .setRequired(true))
  //   .setName('telegram')),
  async execute(interaction) {
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] Actor: ${actor}`);
    const service = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] service: ${service}`);
    const nickname = interaction.options.getString('nickname');
    logger.debug(`[${PREFIX}] target: ${nickname}`);
    // Create an authentication token to use for the link
    const token = `${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 8)}`;

    if (service === 'irc') {
      const embed = template.embedTemplate();
      embed.setTitle('Link your account to IRC');
      await global.ircClient.whois(nickname, async data => {
        // Check if the user is authorized in IRC
        if (!data.account) {
          embed.setDescription(stripIndents`${nickname} is not registered on IRC, please go ~register on IRC!`);
          interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
        logger.debug(`[${PREFIX}] ${actor} ${data.accountinfo} ${data.account}`);
        const [actorData, actorFbid] = await getUserInfo(actor);
        if (actorData.irc && actorData.irc.verified) {
          logger.debug(`[${PREFIX}] actorData.irc: ${actorData.irc}`);
          logger.debug(`[${PREFIX}] actorData.irc.nickname: ${actorData.irc.nickname}`);
          embed.setDescription(stripIndents`Your account is already linked to '${actorData.irc.nickname}'`);
          interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }

        if (interaction.replied) {
          return;
        }

        embed.setDescription(stripIndents`
        Your auth token is:

        ${token}

        Please copy this token and send it to the "TS" bot on IRC next time you're online!

        If you forget or otherwise lose this token you can rerun this command to generate a new one.`);
        interaction.reply({ embeds: [embed], ephemeral: true });

        // logger.debug(`[${PREFIX}] user whois: ${JSON.stringify(data, null, 2)}`);
        actorData.irc = {
          accountName: data.account,
          vhost: data.host,
          nickname: data.nick,
          verified: false,
        };
        actorData.authToken = token;

        // logger.debug(`[${PREFIX}] actorData: ${JSON.stringify(actorData, null, 2)}`);
        logger.debug(`[${PREFIX}] actorFbid: ${actorFbid}`);

        await setUserInfo(actorFbid, actorData);

        global.ircClient.say(nickname, stripIndents`
        ${actor.displayName} has requested to link accounts.

        If this is expected, please respond with the auth token given in discord.

        If this is not expected, please contact Moonbear#1024 on discord, but don't worry: your account is safe!`);

        return logger.debug(`[${PREFIX}] finished!`);
      });
    }
  },
  async verifyLink(client, service, accountInfo, token) {
    logger.debug(`[${PREFIX}] Actor: ${accountInfo.account}`);
    logger.debug(`[${PREFIX}] givnToken: ${token}`);

    const [actorData, actorFbid] = await getUserInfo(accountInfo);

    // logger.debug(`[${PREFIX}] user: ${JSON.stringify(actorData, null, 2)}`);
    logger.debug(`[${PREFIX}] authToken: ${actorData.authToken}`);
    logger.debug(`[${PREFIX}] typeof authToken: ${typeof actorData.authToken}`);
    logger.debug(`[${PREFIX}] typeof givnToken: ${typeof token}`);

    if (actorData.authToken.toString() === token.toString()) {
      logger.debug(`[${PREFIX}] actorData.authToken matches!`);
      const embed = template.embedTemplate();
      embed.setTitle('Link your account to IRC - Success!');
      if (service === 'irc') {
        actorData.irc.verified = true;
        await setUserInfo(actorFbid, actorData);
        global.ircClient.say(accountInfo.nick, 'Your account has been linked!');
        const tripsitGuild = await client.guilds.cache.get(discordGuildId);
        const roleIrcVerified = tripsitGuild.roles.cache.find(
          role => role.id === roleIrcVerifiedId,
        );
        logger.debug(`[${PREFIX}] discord ID: ${actorData.discord.id}`);
        const target = await tripsitGuild.members.fetch(actorData.discord.id);
        logger.debug(`[${PREFIX}] target: ${target}`);
        await target.roles.add(roleIrcVerified);
        embed.setDescription(stripIndents`You have successfully linked your Discord account to the ${accountInfo.nick} IRC account!
        If this is not expected please contact Moonbear#1024 on discord, but don't worry: your account is safe!`);
        target.send({ embeds: [embed] });
      }
    } else {
      global.ircClient.say(accountInfo.nick, 'Invalid auth token!');
    }
  },
};
