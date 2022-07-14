'use strict';

const { Composer } = require('telegraf');

module.exports = Composer.command('irc', async ctx => {
  ctx.replyWithHTML('<b>Join us on the IRC! ❤️</b>\nQuick access: 👉 <a href="https://chat.tripsit.me">click here</a>\nInformation on how to connect using a local client: 👉 <a href="https://wiki.tripsit.me/wiki/Connecting_to_TripSit">click here</a>\n👉 <a href="https://wiki.tripsit.me/wiki/IRC_User_Guide">Click here</a> for TripSit\'s IRC user guide ');
});
