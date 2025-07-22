import type { APIEmbed } from 'discord.js';

import { Colors, EmbedBuilder } from 'discord.js';

export default embedTemplate;

/**
 * Creates a template embed that can be used everywhere
 * @return {EmbedBuilder}
 */
export function embedTemplate(data?: APIEmbed): EmbedBuilder {
  if (data) {
    return new EmbedBuilder(data)
      .setAuthor({ iconURL: env.TS_ICON_URL, name: 'TripSit.Me', url: 'http://www.tripsit.me' })
      .setColor(Colors.Purple)
      .setFooter({ iconURL: env.FLAME_ICON_URL, text: env.DISCLAIMER });
  }
  return new EmbedBuilder()
    .setAuthor({ iconURL: env.TS_ICON_URL, name: 'TripSit.Me', url: 'http://www.tripsit.me' })
    .setColor(Colors.Purple)
    .setFooter({ iconURL: env.FLAME_ICON_URL, text: env.DISCLAIMER });
  // .setThumbnail(tsIconUrl)
  // .setTitle('TITLE)
  // .setURL('https://tripsit.me/')
  // .setDescription('DESCRIPTION')
  // .addFields(
  //     {name: 'Regular field title', value: 'Some value here'},
  //     {name: '\u200B', value: '\u200B', inline: true},
  //     {name: 'Inline field title', value: 'Some value here', inline: true},
  //     {name: 'Inline field title', value: 'Some value here', inline: true},
  // )
  // .setImage('https://i.imgur.com/AfFp7pu.png')
  // .setTimestamp();
}
