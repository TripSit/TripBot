/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  CategoryChannel,
  ChannelType,
  TextChannel,
} from 'discord.js';
import Parser from 'rss-parser';
import { stripIndents } from 'common-tags';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import {
  rssGet, rssSet,
} from './knex';

export default runVoiceCheck;

const F = f(__filename);

// Value in miliseconds (1000 * 60 = 1 minute)
const interval = env.NODE_ENV === 'production' ? 1000 * 60 : 1000 * 10;

type VoiceExp = {
  id: string,
  type: string,
  userId: string,
  voiceExp: number,
  lastVoiceExp: Date,
};

const tableVoiceExp = {
  id: 'id',
  type: 'type',
  userId: 'user_id',
  voiceExp: 0,
  lastVoiceExp: new Date(),
} as VoiceExp;

const expPoints = env.NODE_ENV === 'production'
  ? (Math.floor(Math.random() * (25 - 15 + 1)) + 15) / 2
  : 100;

async function checkVoice() {
  // This function will run every minute and check every voice channel on the guild
  // If someone satisifies the following conditions, they will be awarded voice exp
  // 1. They are not a bot
  // 2. They are in a voice channel
  // 3. They have been in the voice channel for at least 5 minutes
  // 4. They have not been awarded voice exp in the last 5 minutes
  // 5. Are not AFK
  // 6. Are not deafened
  // 7. Are not muted
  // 8. Are not streaming
  // 9. Are not in a stage channel
  // 10. With another human in the channel
  // 11. Dot not have the NeedsHelp role

  // The type of voice exp is determined by the category the voice channel is in
  // GENERAL = Campground and Backstage
  // TRIPSITTER = HR
  // TEAM = Team
  // DEVELOPER = Development

  // The amount of of voice gained is ((A random value between 15 and 25) / 2)
  (async () => {
    log.debug(F, 'Checking voice...');

    const categoryCampground = await client.channels.fetch(env.CATEGORY_CAMPGROUND) as CategoryChannel;
    // const categoryBackstage = await client.channels.fetch(env.CATEGORY_BACKSTAGE) as CategoryChannel;
    // const categoryTeam = await client.channels.fetch(env.CHANNEL_CATEGORY_TEAM) as CategoryChannel;
    // const categoryHr = await client.channels.fetch(env.CHANNEL_CATEGORY_HR) as CategoryChannel;
    // const categoryDeveloper = await client.channels.fetch(env.CHANNEL_CATEGORY_DEVELOPER) as CategoryChannel;

    categoryCampground.children.cache.forEach(channel => {
      if (channel.type === ChannelType.GuildVoice
        && channel.id !== env.CHANNEL_CAMPFIRE) {
        const humansInChat = channel.members.map(member => {
          log.debug(F, `${member.displayName} is in ${channel.name}`);
          if (member.user.bot) {
            return null;
          }
          if (member.voice.selfDeaf) {
            return null;
          }
          if (member.voice.selfMute) {
            return null;
          }
          if (member.voice.streaming) {
            return null;
          }
          // if (member.presence?.status === 'afk') {
          //   return null;
          // }
          if (channel.members.size === 1) {
            return null;
          }
          if (member.roles.cache.has(env.ROLE_NEEDS_HELP)) {
            return null;
          }
          return member;
        });
        log.debug(F, `Humans in ${channel.name}: ${humansInChat.length}`);
      }
    });
  })();
}

/**
 * This function is called on start.ts and runs the timers
 */
export async function runVoiceCheck() {
  /**
   * This timer runs every (INTERVAL) to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish runing before the next loop
   */
  function checkTimers() {
    setTimeout(
      async () => {
        await checkVoice();
        checkTimers();
      },
      interval,
    );
  }
  checkTimers();
}
