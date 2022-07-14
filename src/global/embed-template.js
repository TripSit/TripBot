'use strict';

const { MessageEmbed } = require('discord.js');
const {
  tsIconUrl,
  tsFlameUrl,
  disclaimer,
} = require('../../env');

exports.embedTemplate = function embedTemplate() {
  return new MessageEmbed()
    .setAuthor({ name: 'TripSit.Me', iconURL: tsIconUrl, url: 'http://www.tripsit.me' })
  // .setThumbnail(tsIconUrl)
  // .setTitle('TITLE)
  // .setURL('https://tripsit.me/')
    .setColor('RANDOM')
  // .setDescription('DESCRIPTION')
    .setFooter({ text: disclaimer, iconURL: tsFlameUrl });
};
