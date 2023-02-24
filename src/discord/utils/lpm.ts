import {
  // GuildAuditLogs,
  TextChannel,
} from 'discord.js';

export default runLpm;

// const F = f(__filename);

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
  // await guild.channels.fetch();

  async function getLpm(channelId:string, index:number) {
    const channel = guild.channels.cache.get(channelId) as TextChannel; // eslint-disable-line no-await-in-loop, max-len
    const messages = await channel.messages.fetch({ limit: 100 }); // eslint-disable-line no-await-in-loop
    const linesMinute = messages.reduce((acc, cur) => {
      if (cur.author.bot) return acc;
      if (Date.now() - cur.createdTimestamp > 1000 * 60) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);
    const linesHour = messages.reduce((acc, cur) => {
      if (cur.author.bot) return acc;
      if (Date.now() - cur.createdTimestamp > 1000 * 60 * 60) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);

    if (linesMinute > 0 || linesHour > 0) {
      if (global.lpmDict[channelId]) {
        if (global.lpmDict[channelId].lpm === linesMinute && global.lpmDict[channelId].lph === linesHour) {
          return;
        }
        if (global.lpmDict[channelId].maxLpm < linesMinute) {
          global.lpmDict[channelId].maxLpm = linesMinute;
          // const channelBotlog = await guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel; // eslint-disable-line no-await-in-loop, max-len
          // channelBotlog.send(`${newRecordString}\nNew max LPM in ${channel.name} (${channel.id}) (${channelId}) (${index})`);
        }
        if (global.lpmDict[channelId].maxLph < linesHour) {
          global.lpmDict[channelId].maxLph = linesHour;
          // const channelBotlog = await guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel; // eslint-disable-line no-await-in-loop, max-len
          // channelBotlog.send(`${newRecordString}\nNew max LPH in ${channel.name} (${channel.id}) (${channelId}) (${index})`);
        }
        global.lpmDict[channelId].position = index;
        global.lpmDict[channelId].name = channel.name;
        global.lpmDict[channelId].lpm = linesMinute;
        global.lpmDict[channelId].lph = linesHour;
      } else {
        global.lpmDict[channelId] = {
          position: index,
          name: channel.name,
          lpm: linesMinute,
          lph: linesHour,
          maxLpm: linesMinute,
          maxLph: linesHour,
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
