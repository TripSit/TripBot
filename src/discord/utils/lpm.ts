import {
  // GuildAuditLogs,
  TextChannel,
} from 'discord.js';

export default runLpm;

const F = f(__filename); // eslint-disable-line

// const newRecordString = '🎈🎉🎊 New Record 🎊🎉🎈';

// Value in milliseconds (1000 * 60 = 1 minute)
// This needs to be 5 minutes for production, cuz discord has rate limits
const interval = env.NODE_ENV === 'production' ? 1000 * 10 : 1000 * 5;

const channels = [
  // env.CATEGORY_HARMREDUCTIONCENTRE,
  env.CHANNEL_TRIPSITMETA,
  env.CHANNEL_TRIPSIT,
  env.CHANNEL_OPENTRIPSIT1,
  env.CHANNEL_OPENTRIPSIT2,
  env.CHANNEL_WEBTRIPSIT1,
  env.CHANNEL_WEBTRIPSIT2,
  env.CHANNEL_CLOSEDTRIPSIT,
  env.CHANNEL_RTRIPSIT,
  // env.CATEGORY_BACKSTAGE,
  env.CHANNEL_PETS,
  env.CHANNEL_FOOD,
  env.CHANNEL_OCCULT,
  env.CHANNEL_MUSIC,
  env.CHANNEL_MEMES,
  env.CHANNEL_MOVIES,
  env.CHANNEL_GAMING,
  env.CHANNEL_SCIENCE,
  env.CHANNEL_CREATIVE,
  env.CHANNEL_COMPSCI,
  env.CHANNEL_REPLICATIONS,
  env.CHANNEL_PHOTOGRAPHY,
  // env.CHANNEL_RECOVERY,
  // env.CATEGORY_CAMPGROUND,
  env.CHANNEL_LOUNGE,
  env.CHANNEL_VIPLOUNGE,
  env.CHANNEL_GOLDLOUNGE,
  env.CHANNEL_SANCTUARY,
  env.CHANNEL_TREES,
  env.CHANNEL_OPIATES,
  env.CHANNEL_STIMULANTS,
  env.CHANNEL_DEPRESSANTS,
  env.CHANNEL_DISSOCIATIVES,
  env.CHANNEL_PSYCHEDELICS,
];

async function checkLpm() {
  const startTime = Date.now();
  // log.debug(F, 'Checking LPM...');

  if (!global.lpmDict) {
    global.lpmDict = {};
  }

  const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
  await guild.channels.fetch();

  async function getLpm(channelId:string, index:number) {
    // const channel = await guild.channels.fetch(channelId) as TextChannel; // eslint-disable-line no-await-in-loop, max-len
    const channel = guild.channels.cache.get(channelId) as TextChannel;
    const messages = await channel.messages.fetch({ limit: 100 }); // eslint-disable-line no-await-in-loop

    // Filter bots out of messages
    const filteredMessages = messages.filter(message => !message.author.bot);

    const lines1 = filteredMessages.reduce((acc, cur) => {
      if (Date.now() - cur.createdTimestamp > 1000 * 60) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);

    const lines5 = filteredMessages.reduce((acc, cur) => {
      if (Date.now() - cur.createdTimestamp > 1000 * 60 * 5) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);

    const lines10 = filteredMessages.reduce((acc, cur) => {
      if (Date.now() - cur.createdTimestamp > 1000 * 60 * 10) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);

    const lines30 = filteredMessages.reduce((acc, cur) => {
      if (Date.now() - cur.createdTimestamp > 1000 * 60 * 30) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);

    const lines60 = filteredMessages.reduce((acc, cur) => {
      if (Date.now() - cur.createdTimestamp > 1000 * 60 * 60) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);

    if (lines5) {
      if (global.lpmDict[channelId]) {
        // log.debug(F, `lpmdict: ${JSON.stringify(global.lpmDict[channelId])}`);
        if (global.lpmDict[channelId].lp1 === lines1 && global.lpmDict[channelId].lp60 === lines60) {
          return;
        }
        if (global.lpmDict[channelId].lp1Max < lines1) {
          global.lpmDict[channelId].lp1Max = lines1;
        }
        if (global.lpmDict[channelId].lp5Max < lines5) {
          global.lpmDict[channelId].lp5Max = lines5;
        }
        if (global.lpmDict[channelId].lp10Max < lines10) {
          global.lpmDict[channelId].lp10Max = lines10;
        }
        if (global.lpmDict[channelId].lp30Max < lines30) {
          global.lpmDict[channelId].lp30Max = lines30;
        }
        if (global.lpmDict[channelId].lp60Max < lines60) {
          global.lpmDict[channelId].lp60Max = lines60;
        }
        global.lpmDict[channelId].position = index;
        global.lpmDict[channelId].name = channel.name;
        global.lpmDict[channelId].lp1 = lines1;
        global.lpmDict[channelId].lp5 = lines5;
        global.lpmDict[channelId].lp10 = lines10;
        global.lpmDict[channelId].lp30 = lines30;
        global.lpmDict[channelId].lp60 = lines60;
      } else {
        global.lpmDict[channelId] = {
          position: index,
          name: channel.name,
          alert: 0,
          lp1: lines1,
          lp1Max: lines1,
          lp5: lines5,
          lp5Max: lines5,
          lp10: lines10,
          lp10Max: lines10,
          lp30: lines30,
          lp30Max: lines30,
          lp60: lines60,
          lp60Max: lines60,
        };
      }
    }
  }

  await Promise.all(channels.map(async (channelId, index) => {
    await getLpm(channelId, index + 1);
  }));
  if (global.lpmTime) {
    global.lpmTime.push(Date.now() - startTime);
  } else {
    global.lpmTime = [Date.now() - startTime];
  }
  // log.debug(F, `LPM check took ${Date.now() - startTime}ms`);
}

/**
 * This function is called on start.ts and runs the timers
 */
export async function runLpm() {
  /**
   * This timer runs every (INTERVAL) to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish running before the next loop
   */
  function checkTimers() {
    setTimeout(
      async () => {
        await checkLpm();
        checkTimers();
      },
      interval,
    );
  }
  checkTimers();
}
