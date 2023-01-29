/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  CategoryChannel,
  ChannelType,
  GuildMember,
  TextChannel,
} from 'discord.js';
import Parser from 'rss-parser';
import { stripIndents } from 'common-tags';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import {
  experienceGet,
  experienceUpdate,
  getUser,
  rssGet, rssSet,
} from './knex';
import { ExperienceCategory, ExperienceType, UserExperience } from '../@types/pgdb';
import { expForNextLevel } from './experience';

export default runVoiceCheck;

const F = f(__filename);

// Value in miliseconds (1000 * 60 = 1 minute)
const timerInterval = env.NODE_ENV === 'production' ? 1000 * 60 : 1000 * 10;

// Value in miliseconds (1000 * 60 = 1 minute)
const expInterval = env.NODE_ENV === 'production' ? 1000 * 60 * 2 : 1000 * 5;

type VoiceExpType = 'GENERAL_VOICE' | 'TRIPSITTER_VOICE' | 'TEAM_VOICE' | 'DEVELOPER_VOICE' | 'IGNORED_VOICE';

export interface VoiceExp extends Omit<UserExperience, 'type'> {
  type: VoiceExpType,
}

const tableVoiceExp = [{}] as VoiceExp[];

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
      { category: 'GENERAL' as ExperienceType, id: env.CATEGORY_CAMPGROUND },
      { category: 'GENERAL' as ExperienceType, id: env.CATEGORY_BACKSTAGE },
      { category: 'TEAM' as ExperienceType, id: env.CATEGORY_TEAMTRIPSIT },
      { category: 'TRIPSITTER' as ExperienceType, id: env.CATEGROY_HARMREDUCTIONCENTRE },
      { category: 'DEVELOPER' as ExperienceType, id: env.CATEGORY_DEVELOPMENT },
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
            // || member.voice.selfMute // For testing
            || member.voice.serverMute
            || member.voice.streaming
            || member.voice.suppress
            || member.roles.cache.has(env.ROLE_NEEDS_HELP)
            )
          ));
          if (humansInChat) {
            // For each human in chat, check if they have been awarded voice exp in the last 5 minutes
            // If they have not, award them voice exp
            humansInChat.forEach(async member => {
              // Find the user in the db
              const userData = await getUser(member.id, null);
              const [experienceData] = await experienceGet(1, categoryDef.category, 'VOICE', userData.id);

              if (experienceData) {
                const origPoints = experienceData.level_points;
                const expToLevel = await expForNextLevel(experienceData.level);
                // If the user has been awarded voice exp in the last 5 minutes, do nothing
                if (experienceData.last_message_at.getTime() + expInterval > new Date().getTime()) {
                  log.debug(
                    F,
                    `[${channel.name}] ${member.displayName}: ${origPoints} + 0 = ${experienceData.level_points} / ${expToLevel} > ${experienceData.level + 1})`, // eslint-disable-line max-len
                  );
                } else {
                  // If the user has not been awarded voice exp in the last 5 minutes, award them voice exp
                  experienceData.level_points += expPoints;
                  experienceData.total_points += expPoints;

                  if (expToLevel < experienceData.level_points) {
                    experienceData.level += 1;
                    const channelTripbotlogs = await channel.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
                    // Lowercase everything but the first letter in the categoryDef.category
                    const categoryName = categoryDef.category.charAt(0).toUpperCase() + categoryDef.category.slice(1).toLowerCase(); // eslint-disable-line max-len
                    await channelTripbotlogs.send(stripIndents`${member.displayName} has leveled up to ${categoryDef.category} Voice level ${experienceData.level}!`); // eslint-disable-line max-len
                    log.debug(F, `${member.displayName} has leveled up to ${categoryName} Voice level ${experienceData.level}!`); // eslint-disable-line max-len
                    experienceData.level_points -= expToLevel;
                  }
                  experienceData.last_message_at = new Date();
                  experienceData.last_message_channel = channel.id;

                  log.debug(
                    F,
                    `[${channel.name}] ${member.displayName}: ${origPoints} + ${expPoints} = ${experienceData.level_points} / ${expToLevel} > ${experienceData.level + 1})`, // eslint-disable-line max-len
                  );
                  await experienceUpdate(experienceData);
                }
              } else {
                const newUser = {
                  user_id: userData.id,
                  category: `${categoryDef.category}`,
                  type: 'VOICE',
                  level: 0,
                  level_points: expPoints,
                  total_points: expPoints,
                  last_message_at: new Date(),
                  last_message_channel: channel.id,
                } as UserExperience;
                // log.debug(F, `Adding new user to voice exp table: ${JSON.stringify(newUser)}`);
                log.debug(
                  F,
                  `[${channel.name}] ${member.displayName}: 0 + ${expPoints} = ${expPoints} / ?? > 1`, // eslint-disable-line max-len
                );
                await experienceUpdate(newUser);
              }
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
