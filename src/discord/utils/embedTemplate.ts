import {
  EmbedBuilder,
  Colors,
  APIEmbed,
} from 'discord.js';

export default embedTemplate;

/**
 * Creates a template embed that can be used everywhere
 * @return {EmbedBuilder}
 */
export function embedTemplate(
  data?:APIEmbed,
):EmbedBuilder {
  if (data) {
    return new EmbedBuilder(data)
      .setAuthor({ name: 'TripSit.Me', iconURL: env.TS_ICON_URL, url: 'http://www.tripsit.me' })
      .setColor(Colors.Purple)
      .setFooter({ text: env.DISCLAIMER, iconURL: env.FLAME_ICON_URL });
  }
  return new EmbedBuilder()
    .setAuthor({ name: 'TripSit.Me', iconURL: env.TS_ICON_URL, url: 'http://www.tripsit.me' })
    .setColor(Colors.Purple)
    .setFooter({ text: env.DISCLAIMER, iconURL: env.FLAME_ICON_URL });
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
