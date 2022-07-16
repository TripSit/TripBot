'use strict';

const { Composer } = require('telegraf');
const { stripIndents } = require('common-tags');

module.exports = Composer.command('irc', async ctx => {
  ctx.replyWithHTML(stripIndents`<b>Join us on the IRC! ❤️</b>

  Quick access: 👉 <a href="https://chat.tripsit.me">click here</a>

  Information on how to connect using a local client: 👉 <a href="https://wiki.tripsit.me/wiki/Connecting_to_TripSit">click here</a>

  👉 <a href="https://wiki.tripsit.me/wiki/IRC_User_Guide">Click here</a> for TripSit's IRC user guide!`);
});
