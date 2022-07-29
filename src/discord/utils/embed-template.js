'use strict';

const { EmbedBuilder, Colors } = require('discord.js');
const {
  tsIconUrl,
  tsFlameUrl,
  disclaimer,
} = require('../../../env');

exports.embedTemplate = function embedTemplate() {
  return new EmbedBuilder()
    .setAuthor({ name: 'TripSit.Me', iconURL: tsIconUrl, url: 'http://www.tripsit.me' })
  // .setThumbnail(tsIconUrl)
  // .setTitle('TITLE)
  // .setURL('https://tripsit.me/')
    .setColor(Colors.Purple)
  // .setDescription('DESCRIPTION')
    .setFooter({ text: disclaimer, iconURL: tsFlameUrl });
};
