import {
  Message,
  Role,
  TextChannel,
  User,
} from 'discord.js';
import env from './env.config';
import logger from './logger';
// import {stripIndents} from 'common-tags';
import {stripIndents} from 'common-tags';
import {ircMessage} from '../../irc/@types/irc';

const PREFIX = require('path').parse(__filename).name;

const ignoredRoles = [
  env.ROLE_NEEDSHELP,
  env.ROLE_NEWBIE,
  env.ROLE_MUTED,
  env.ROLE_TEMPVOICE,
];

const tripsitterChannels = [
  env.CHANNEL_TRIPSIT,
  env.CHANNEL_SANCTUARY,
  env.CHANNEL_TRIPSITTERS,
  env.CHANNEL_HOWTOTRIPSIT,
  env.CHANNEL_DRUGQUESTIONS,
  env.CHANNEL_OPENTRIPSIT,
  env.CHANNEL_OPENTRIPSIT1,
  env.CHANNEL_OPENTRIPSIT2,
  env.CHANNEL_CLOSEDTRIPSIT,
];

const tripsitterIrcChannels = [
  '#sanctuary',
  '#tripsitters',
  '#howtotripsit',
  '#drugquestions',
  '#opentripsit',
  '#tripsit',
  '#tripsit1',
  '#tripsit2',
  '#tripsit3',
];

// Define the time in between messages where exp will count
let bufferSeconds = 60;
if (env.NODE_ENV === 'development') {
  bufferSeconds = 1;
}

const botNicknames = [
  'TS',
  'tripbot',
  'TSDev',
  'TS1',
  'TSTelegram',
  'TSDiscord',
  'tripbot1',
  'TSDev1',
  'TS11',
  'TSTelegram1',
  'TSDiscord1',
  'Github',
];

/**
 * This takes a messsage and gives the user experience
 * @param {Message} message The message object to check
 */
export async function experience(
    message:Message | ircMessage,
) {
  // if (message.guildId) {
  //   // If not in tripsit, ignore it
  //   if (message.guildId !== DISCORD_GUILD_ID) { return; }
  // }

  // let actorDataUpdated = false;
  let actor = {} as User | any;
  let messageChannelId = '';
  let expType = 'general';

  // logger.debug(`[${PREFIX}] message.member: ${JSON.stringify(message.member, null, 2)}`);

  // Determine the channel that was spoken in and type of experience to give
  if (message instanceof Message) {
    if (!message.member || !message.channel) {
      return;
    }
    // Check if the user has an ignored role
    if (ignoredRoles.some((role) => message.member!.roles.cache.has(role))) {
      logger.debug(`[${PREFIX}] Message sent by a user with an ignored role`);
      return;
    }

    logger.debug(`[${PREFIX}] Message sent by ${message.author.username} \
        in ${(message.channel as TextChannel).name} on ${message.guild}`);
    actor = message.author;

    // Determine what kind of experience to give
    // Check if the message.channe.id is in the list of tripsitter channels
    if (tripsitterChannels.includes(message.channel.id)) {
      // logger.debug(`[${PREFIX}] Message sent in a tripsitter channel on discord`);
      expType = 'tripsitter';
    }
    if ((message.channel as TextChannel).parentId !== null) {
      if (tripsitterChannels.includes((message.channel as TextChannel).parentId!)) {
        // logger.debug(`[${PREFIX}] Message sent in a tripsitter thread on discord`);
        expType = 'tripsitter';
      }
    } else {
      // logger.debug(`[${PREFIX}] Message sent in a non-tripsitter channel`);
      expType = 'general';
    }
    messageChannelId = message.channel.id.toString().replace(/(\.|\$|#|\[|\]|\/)/g, '_');
  }

  if (!(message instanceof Message)) {
    // If the user is not a member of the guild, then this probably came from IRC
    // If the user isnt registered then don't give them experience
    // if (!message.host.startsWith('tripsit')) { return; }

    if (botNicknames.includes(message.nick)) {
      // logger.debug(`[${PREFIX}] ${message.nick} is a bot!`);
      return;
    }

    const memberHost = message.host.split('/')[1];
    logger.debug(`[${PREFIX}] ${message.nick}${memberHost ?
      ` (${memberHost}) ` :
      ' '}said ${message.args[1]} in ${message.args[0]}`);
    actor = message;

    // Determine what kind of experience to give
    if (tripsitterIrcChannels.includes(message.args[0])) {
      logger.debug(`[${PREFIX}] Message sent in a tripsitter channel from IRC`);
      expType = 'tripsitter';
    } else {
      logger.debug(`[${PREFIX}] Message sent in a non-tripsitter channel from IRC`);
      expType = 'general';
    }
    messageChannelId = message.args[0].replace(/(\.|\$|#|\[|\]|\/)/g, '');
  }

  logger.debug(`[${PREFIX}] expType: ${expType}`);
  logger.debug(`[${PREFIX}] messageChannelId: ${messageChannelId}`);

  // Get random value between 15 and 25
  const expPoints = Math.floor(Math.random() * (25 - 15 + 1)) + 15;

  const currMessageDate = new Date();
  // logger.debug(`[${PREFIX}] currMessageDate: ${currMessageDate}`);

  let lastMessageDate = new Date();

  type Exp = {
    /** The user's current level*/
    level: number;
    /** Number of exp points to next level*/
    levelExpPoints: number;
    /** Total number of exp points*/
    totalExpPoints: number;
    /** The date of the last message sent in this channel*/
    lastMessageDate: number;
    /** The ID of the channel that the last message was sent in*/
    lastMessageChannel: string;
    /** Toggle that the "welcome to VIP" has been sent*/
    introSent: boolean;
  };

  const experienceData = {
    level: 0,
    levelExpPoints: expPoints,
    totalExpPoints: expPoints,
    lastMessageDate: lastMessageDate.valueOf(),
    lastMessageChannel: '',
  } as Exp;

  let userRef = '';
  if (message instanceof Message) {
    userRef = `${env.FIREBASE_DB_USERS}/${actor.id}/experience/${expType}`;
  } else {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    const accountName = message.host.split('/')[2] ?? message.host.replace(/(\.|\$|#|\[|\]|\/)/g, '-');

    userRef = `${env.FIREBASE_DB_USERS}/${accountName}/experience/${expType}`;
  }

  logger.debug(`[${PREFIX}] userRef: ${userRef}`);
  if (global.db) {
    const ref = db.ref(userRef);
    await ref.once('value', (data:any) => {
      if (data.val() !== null) {
        lastMessageDate = new Date(data.val().lastMessageDate);

        const timeDiff = currMessageDate.valueOf() - lastMessageDate.valueOf();
        // logger.debug(`[${PREFIX}] Time difference: ${timeDiff}`);

        const bufferTime = bufferSeconds * 1000;
        if (timeDiff > bufferTime) {
          // If the time diff is over one bufferTime, increase the experience points
          let experienceData = data.val();
          // logger.debug(`[${PREFIX}] experienceDataB: ${JSON.stringify(experienceData, null, 2)}`);

          let levelExpPoints = experienceData.levelExpPoints + expPoints;
          const totalExpPoints = experienceData.totalExpPoints + expPoints;

          let level = experienceData.level;
          const expToLevel = 5 * (level ** 2) + (50 * level) + 100;

          // eslint-disable-next-line max-len
          logger.debug(stripIndents`[${PREFIX}] ${actor.username ? actor.username : actor.nick } (lv${level}) +${expPoints} ${expType} exp | TotalExp: ${totalExpPoints}, LevelExp: ${levelExpPoints}, ExpToLevel ${level + 1}: ${expToLevel}`);
          if (expToLevel < levelExpPoints) {
            logger.debug(`[${PREFIX}] ${actor.username ? actor.username : actor.nick } has leveled up to \
              ${expType} level ${level + 1}!`);

            // const embed = embedTemplate();
            // embed.setDescription(`${actor.username ? actor.username : actor.nick } has leveled up to ${expType} \
            //   level ${level + 1}!`);
            const channelTripbotlogs = global.client.channels.cache.get(env.CHANNEL_TRIPBOTLOGS) as TextChannel;
            // channelTripbotlogs.send({embeds: [embed]});
            channelTripbotlogs.send(`${actor.username ? actor.username : actor.nick } has leveled up to ${expType} \
            level ${level + 1}!`);
            level += 1;
            levelExpPoints -= expToLevel;
          }
          experienceData = {
            level,
            levelExpPoints,
            totalExpPoints,
            lastMessageDate: currMessageDate.valueOf(),
            lastMessageChannel: messageChannelId,
          };
          // logger.debug(`[${PREFIX}] experienceDataC: ${JSON.stringify(experienceData, null, 2)}`);
          ref.update(experienceData);
          // actorDataUpdated = true;
        }
        if (expType === 'general') {
          const experienceData = data.val();
          // logger.debug(`[${PREFIX}] User has general experience`);
          if (experienceData.level >= 5) {
            // logger.debug(`[${PREFIX}] User is over level 5`);
            if (message instanceof Message) {
              // logger.debug(`[${PREFIX}] User is in the guild`);
              // Give the user the VIP role if they are level 5 or above
              const vipRole = message.guild!.roles.cache.find((role:Role) => role.id === env.ROLE_VIP) as Role;
              if (vipRole) {
                message.member!.roles.add(vipRole);
                // logger.debug(`[${PREFIX}] VIP role added`);
              }
              // if (experienceData.introSent === 'impossible') {
              //   logger.debug(`[${PREFIX}] User has not been sent an intro yet`);

              //   const intro = stripIndents`
              //     Hey there, thanks for chatting on the TripSit discord!

              //     We reward people active on our discord with the "VIP" role 😎

              //     This gives you some access to channels and features that are not open to everybody:
              //     > If you're interested in voice chat you can open a new room by joining the 🔥│𝘾𝙖𝙢𝙥𝙛𝙞𝙧𝙚 𝙑𝘾!
              //     > Want to help out in 🟢│tripsit? Read the ❗│how-to-tripsit room and become a Helper!
              //     > We always welcome feedback on our development projects: review 🔋│dev-onboarding and become a \
              //     Consultant!

              //     Access to the notorious 🧐│gold-lounge can be yours by subscribing to our patreon! \
              //     (https://www.patreon.com/tripsit)

              //     Thanks again for being active, we couldn't exist without awesome members like you!
              //   `;
              //   message.member.send(intro);

              //   const channelViplounge = message.client.channels.cache.get(env.CHANNEL_VIPLOUNGE) as TextChannel;
              //   channelViplounge.send(`Please welcome ${message.member.displayName} to the VIP lounge!`);
              //   experienceData.introSent = true;
              //   logger.debug(`[${PREFIX}] Intro sent`);
              // }
            }
          }
        }
      } else {
        // logger.debug(`[${PREFIX}] experienceDataD: ${JSON.stringify(experienceData, null, 2)}`);

        ref.update(experienceData);
      }
    });
  }
};
