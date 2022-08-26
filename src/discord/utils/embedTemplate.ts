const {
  EmbedBuilder,
  Colors,
} = require('discord.js');
import env from '../../env.config';

/**
 * Creates a template embed that can be used everywhere
 * @return {Discord.MessageEmbed}
 */
export function embedTemplate() {
  return new EmbedBuilder()
      .setAuthor({name: 'TripSit.Me', iconURL: env.TS_ICON_URL, url: 'http://www.tripsit.me'})
  // .setThumbnail(tsIconUrl)
  // .setTitle('TITLE)
  // .setURL('https://tripsit.me/')
      .setColor(Colors.Purple)
  // .setDescription('DESCRIPTION')
      .setFooter({text: env.DISCLAIMER, iconURL: env.FLAME_ICON_URL});
};
