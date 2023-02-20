/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  TextChannel,
} from 'discord.js';
import Parser from 'rss-parser';
import { stripIndents } from 'common-tags';
import { loadImage } from '@napi-rs/canvas';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import {
  rssGet, rssSet,
} from './knex';

export default runRss;

type RedditItem = {
  title: string,
  link: string,
  pubDate: string,
  author: string,
  content: string,
  contentSnippet: string,
  id: string,
  isoDate: string,
};

type RedditFeed = {
  title: string;
  link: string;
  feedUrl: string;
  lastBuildDate: string;
  items: RedditItem[];
};

// Make the command
// Change the DB

const F = f(__filename);

// Value in miliseconds (1000 * 60 = 1 minute)
const interval = env.NODE_ENV === 'production' ? 1000 * 60 : 1000 * 10;

/**
 * This function is called on start.ts and runs the timers
 */
export async function runRss() {
  /**
   * This timer runs every (INTERVAL) to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish runing before the next loop
   */
  function checkTimers() {
    setTimeout(
      async () => {
        await checkRss();
        checkTimers();
      },
      interval,
    );
  }
  checkTimers();
}

const parser: Parser<RedditFeed, RedditItem> = new Parser();

async function checkRss() {
  // log.info(F, 'Checking rss...');
  (async () => {
    const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);

    // log.debug(F, `guild: ${JSON.stringify(guild, null, 2)}\n`);
    const rssData = await rssGet(guild.id);
    // log.debug(F, `rssData: ${JSON.stringify(rssData, null, 2)}\n`);

    rssData.forEach(async feed => {
      let mostRecentPost = {} as RedditItem & Parser.Item;
      try {
        [mostRecentPost] = (await parser.parseURL(feed.url)).items;
      } catch (error) {
        log.debug(F, `Error parsing ${feed.url}: ${error}`);
        return;
      }
      // log.debug(F, `mostRecentPost: ${JSON.stringify(mostRecentPost, null, 2)}`);

      if (feed.last_post_id === mostRecentPost.id) return;

      // log.debug(F, `New post: ${JSON.stringify(mostRecentPost, null, 2)}`);

      const channelBotlog = await guild.channels.fetch(feed.destination) as TextChannel;

      // Gets everything before "submitted by"
      const bigBody = mostRecentPost.contentSnippet.slice(
        0,
        mostRecentPost.contentSnippet.indexOf('submitted by'),
      );

      // Gets the first 2000 characters of the body
      const body = bigBody.slice(0, 2000);

      // Capitalizes the B in by and gets the username
      const submittedBy = `B${mostRecentPost.contentSnippet.slice(
        mostRecentPost.contentSnippet.indexOf('submitted by') + 11,
        mostRecentPost.contentSnippet.indexOf('[link]'),
      ).replaceAll('    ', ' ')}`;

      // log.debug(F, `submittedBy: ${submittedBy}`);

      const embed = embedTemplate()
        .setAuthor({ name: 'New /r/TripSit post', iconURL: env.TS_ICON_URL })
        .setTitle(`${mostRecentPost.title}`)
        .setURL(mostRecentPost.link)
        .setFooter({ text: submittedBy ?? '', iconURL: env.FLAME_ICON_URL })
        .setTimestamp(new Date(mostRecentPost.pubDate));

      if (body.length > 0) {
        embed.setDescription(stripIndents`
          ${body}
        `);
      }

      channelBotlog.send({ embeds: [embed] });

      const newFeed = feed;
      newFeed.last_post_id = mostRecentPost.id;

      await rssSet(newFeed);
    });
  })();
}
