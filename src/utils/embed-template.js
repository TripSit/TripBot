'use strict';

const { MessageEmbed } = require('discord.js');
const { TS_ICON_URL, TS_FLAME_URL, DISCLAIMER } = require('../../env');

exports.embedTemplate = function embedTemplate() {
  return new MessageEmbed()
    .setAuthor({ name: 'TripSit.Me', iconURL: TS_ICON_URL, url: 'http://www.tripsit.me' })
  // .setThumbnail(ts_icon_url)
  // .setTitle('TITLE)
  // .setURL('https://tripsit.me/')
    .setColor('RANDOM')
  // .setDescription('DESCRIPTION')
    .setFooter({ text: DISCLAIMER, iconURL: TS_FLAME_URL });
};
