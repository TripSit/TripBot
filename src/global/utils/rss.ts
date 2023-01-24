/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  TextChannel,
} from 'discord.js';
import FeedParser from 'feedparser';
import Parser from 'rss-parser';
import fetch from 'node-fetch';
import { stripIndents } from 'common-tags';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import { db, getGuild, getUser } from './knex';
import {
  DiscordGuilds,
} from '../@types/pgdb';

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
const interval = env.NODE_ENV === 'production' ? 1000 * 30 : 1000 * 10000;

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
  log.info(F, 'Checking rss...');
  (async () => {
    const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);

    const guildData = {
      name: 'TripSit',
      id: '123',
      rss: [
        {
          url: 'https://www.reddit.com/r/TripSit/new.rss',
          last_post_id: '',
          destination: '1052634233711108169',
        },
        // {
        //   url: 'https://www.reddit.com/r/Herbalism/new.rss',
        //   last_post_id: '',
        //   destination: '1052634232817733662',
        // },
      ],
    };

    if (!guildData.rss) return;

    guildData.rss.forEach(async feed => {
      const mostRecentPost = (await parser.parseURL(feed.url)).items[0];
      // log.debug(F, `mostRecentPost: ${JSON.stringify(mostRecentPost, null, 2)}`);

      if (feed.last_post_id === mostRecentPost.id) return;

      const channelBotlog = await guild.channels.fetch(feed.destination) as TextChannel;

      // Gets everything before "submitted by"
      const body = mostRecentPost.contentSnippet.slice(
        0,
        mostRecentPost.contentSnippet.indexOf('submitted'),
      );

      // Capitalizes the B in by and gets the username
      const submittedBy = `B${mostRecentPost.contentSnippet.slice(
        mostRecentPost.contentSnippet.indexOf('by') + 1,
        mostRecentPost.contentSnippet.indexOf('[link]'),
      ).replaceAll('    ', ' ')}`;

      const embed = embedTemplate()
        .setAuthor({ name: 'New /r/TripSit post', iconURL: env.TS_ICON_URL })
        .setTitle(`${mostRecentPost.title}`)
        .setURL(mostRecentPost.link)
        .setDescription(stripIndents`${body}`)
        .setFooter({ text: submittedBy, iconURL: env.FLAME_ICON_URL })
        .setTimestamp(new Date(mostRecentPost.pubDate));

      channelBotlog.send({ embeds: [embed] });
    });
  })();
}
