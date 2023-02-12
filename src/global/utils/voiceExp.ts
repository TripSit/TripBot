/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  CategoryChannel,
  ChannelType,
} from 'discord.js';
import { ExperienceCategory, ExperienceType } from '../@types/pgdb';
import { experience } from './experience';

export default runVoiceCheck;

const F = f(__filename);

// Value in miliseconds (1000 * 60 = 1 minute)
const timerInterval = env.NODE_ENV === 'production' ? 1000 * 60 : 1000 * 10;

// Value in miliseconds (1000 * 60 = 1 minute)
const expInterval = env.NODE_ENV === 'production' ? 1000 * 60 * 2 : 1000 * 5;

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
    // Define each category type and the category channel id
    const categoryDefs = [
      { category: 'GENERAL' as ExperienceCategory, id: env.CATEGORY_CAMPGROUND },
      { category: 'GENERAL' as ExperienceCategory, id: env.CATEGORY_BACKSTAGE },
      { category: 'TEAM' as ExperienceCategory, id: env.CATEGORY_TEAMTRIPSIT },
      { category: 'TRIPSITTER' as ExperienceCategory, id: env.CATEGROY_HARMREDUCTIONCENTRE },
      { category: 'DEVELOPER' as ExperienceCategory, id: env.CATEGORY_DEVELOPMENT },
    ];

    // For each of the above types, check each voice channel in the category
    categoryDefs.forEach(async categoryDef => {
      // log.debug(F, `Checking ${categoryDef.type} voice channels...`);
      const category = await client.channels.fetch(categoryDef.id) as CategoryChannel;
      category.children.cache.forEach(async channel => {
        // log.debug(F, `Checking ${channel.name}...`);
        if (channel.type === ChannelType.GuildVoice
        && channel.id !== env.CHANNEL_CAMPFIRE
        /* && channel.members.size > 1 */) { // For testing
          // Check to see if the people in the channel meet the right requirements
          const humansInChat = channel.members.filter(member => (
            !(member.user.bot
            || member.voice.selfDeaf
            || member.voice.serverDeaf
            || member.voice.selfMute
            || member.voice.serverMute
            || member.voice.streaming
            || member.voice.suppress
            || member.roles.cache.has(env.ROLE_NEEDS_HELP)
            )
          ));
          if ((env.NODE_ENV === 'production' && humansInChat && humansInChat.size > 1)
          || (env.NODE_ENV !== 'production' && humansInChat && humansInChat.size > 0)) {
            log.debug(F, `There are ${humansInChat.size} humans in ${channel.name}`);
            // For each human in chat, check if they have been awarded voice exp in the last 5 minutes
            // If they have not, award them voice exp
            humansInChat.forEach(async member => {
              await experience(member, categoryDef.category, 'VOICE' as ExperienceType, channel);
            });
          }
        }
      });
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
      timerInterval,
    );
  }
  checkTimers();
}
