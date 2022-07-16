'use strict';

const { Composer } = require('telegraf');
const { stripIndents } = require('common-tags');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = Composer.command('start', async ctx => {
  logger.debug(`[${PREFIX}] started!`);
  // logger.log(ctx.update.message.text.split(' '));
  ctx.replyWithHTML(stripIndents`<b>Welcome to TripBot</b>!👋

  This bot is created by https://tripsit.me, an online harm reduction community offering 24/7 life chat assistance and information about various substances and safer use practices.

  Have a look at the <a href='https://wiki.tripsit.me/'>Wiki</a>, if you want :)

  With this bot you can <b>[...]</b>.💞 <b>

  If you're in need of assistance right now, issue /tripsit.</b>

  For a list of all commands, execute /help.

  If you want, <a href='https://discord.gg/TripSit'>Join our Discord</a>!

  Stay safe! ❤️`);
});
