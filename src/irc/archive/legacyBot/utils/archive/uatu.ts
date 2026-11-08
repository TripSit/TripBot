import { WhoisResponse } from 'matrix-org-irc';
import env from '../../../global/utils/env.config';
import logger from '../../global/utils/logger';
import { IRCMessage } from '../../@types/irc';

const F = f(__filename);

// {
//   "prefix": "TSDev!~TSDev@tripsit/bridge/TS1",
//   "nick": "TSDev",
//   "user": "~TSDev",
//   "host": "tripsit/bridge/TS1",
//   "command": "JOIN",
//   "rawCommand": "JOIN",
//   "commandType": "normal",
//   "args": [
//     "#sandbox-dev"
//   ]
// }

const botNicknames = [
  'tripbot',
  'TSDev',
  'TS1',
  'TSTelegram',
  'TSDiscord',
  'TSModRelay',
  'tripbot1',
  'TSDev1',
  'TS11',
  'TSTelegram1',
  'TSDiscord1',
  'TSModRelay1',
  'Github',
  'tripbot_',
  'TSDev_',
  'TS',
  'TS_',
  'TS1_',
  'TSTelegram_',
  'TSDiscord_',
  'TSModRelay_',
  'tripbot1_',
  'TSDev1_',
  'TS11_',
  'TSTelegram1_',
  'TSDiscord1_',
  'TSModRelay1_',
];

// const channels = {
//   sandbox: env.CHANNEL_SANDBOX,
//   sandboxdev: env.CHANNEL_SANDBOX_DEV,
//   sanctuary: env.CHANNEL_SANCTUARY,
//   tripsitters: env.CHANNEL_TRIPSITTERS,
//   tripsit: env.CHANNEL_OPENTRIPSIT,
//   tripsit1: env.CHANNEL_OPENTRIPSIT1,
//   tripsit2: env.CHANNEL_OPENTRIPSIT2,
//   tripsit3: env.CHANNEL_CLOSEDTRIPSIT,
//   tripsitdev: env.CHANNEL_DEVELOPMENT,
//   meetingroom: env.CHANNEL_MEETINGROOM,
//   content: env.CHANNEL_WIKICONTENT,
//   moderators: env.CHANNEL_MODERATORS,
//   teamtripsit: env.CHANNEL_TEAMTRIPSIT,
//   operations: env.CHANNEL_OPERATORS,
//   modhaven: env.CHANNEL_MODHAVEN,
//   tripsitme: env.CHANNEL_TRIPSITME,
//   lounge: env.CHANNEL_LOUNGE,
//   opiates: env.CHANNEL_OPIATES,
//   stims: env.CHANNEL_STIMULANTS,
//   depressants: env.CHANNEL_DEPRESSANTS,
//   dissociatives: env.CHANNEL_DISSOCIATIVES,
//   psychedelics: env.CHANNEL_PSYCHEDELICS,
// };

/**
 * @param {IRCMessage} message
 * @param {any} newNick
 * @return {Promise<void>}
 */
export default async function watcher(
  message:IRCMessage,
  newNick?:string,
): Promise<void> {
  // log.debug(F, `message: ${JSON.stringify(message, null, 2)}`);
  if (botNicknames.includes(message.nick)) {
    // log.debug(F, `${message.nick} is a bot!`);
    return;
  }

  log.debug(F, `(${message.nick}!${message.user}@${message.host}) ${message.command}ed}`);

  let user = {} as WhoisResponse;
  if (message.command === 'KICK') {
    // log.debug(F, `Whoising ${message.args[1]}`);
    await global.ircClient.whois(message.args[1], async resp => {
      // log.debug(F, `Whoised ${JSON.stringify(resp, null, 2)}`);
      if (resp) {
        user = resp;
      }
    });
    while (user === null) {
      await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
    }
  } else {
    user = message;
  }

  const accountName = message.host.split('/')[2] ?? message.host.replace(/(\.|\$|#|\[|\]|\/)/g, '-');

  let lastTalkGeneral = 0;
  const generalRef = `${env.FIREBASE_DB_USERS}/${accountName}/experience/general/lastMessageDate`;
  log.debug(F, `generalRef: ${generalRef}`);
  if (global.db) {
    await db.ref(generalRef).once('value', data => {
      if (data.val() !== null) {
        lastTalkGeneral = data.val();
      }
    });
  }
  log.debug(F, `lastTalkGeneral: ${new Date(lastTalkGeneral)}`);

  let lastTalkTripsit = 0;
  const tripsitRef = `${env.FIREBASE_DB_USERS}/${accountName}/experience/tripsitter/lastMessageDate`;
  log.debug(F, `tripsitRef: ${tripsitRef}`);
  if (global.db) {
    await db.ref(tripsitRef).once('value', data => {
      if (data.val() !== null) {
        lastTalkTripsit = data.val();
      }
    });
  }
  log.debug(F, `lastTalkTripsit: ${lastTalkTripsit}`);

  const lastTalkCategory = lastTalkGeneral > lastTalkTripsit ? 'general' : 'tripsitter';
  const lastMessageDate = lastTalkGeneral > lastTalkTripsit ? lastTalkGeneral : lastTalkTripsit;
  log.debug(F, `lastTalkCategory: ${lastTalkCategory}`);
  log.debug(F, `lastMessageDate: ${lastMessageDate}`);

  if (!lastMessageDate) {
    // eslint-disable-next-line max-len
    log.debug(F, `error - No lastMessageDate found for ${accountName}`);
  }

  log.debug(F, `Last message date: ${lastMessageDate}`);

  const now = new Date();
  log.debug(F, `now: ${now}`);
  const diff = now.valueOf() - new Date(lastMessageDate).valueOf();
  log.debug(F, `diff: ${diff} < ${10 * 60 * 1000}`);
  // If the user has sent a message in the last 10 minutes/nick
  if (diff < 10 * 60 * 1000) {
    log.debug(F, `${message.nick} has sent a message in the last 10 minutes!`);

    let verbage = '';
    // if (message.command === 'JOIN') {
    //   verbage = `${message.nick} has joined ${message.args[0]}!`;
    // } else
    // if (message.command === 'PART') {
    //   verbage = `${message.nick} has left ${message.args[0]}!`;
    // } else
    if (message.command === 'KICK') {
      verbage = `${message.nick} has been kicked from ${message.args[0]}!`;
    } else if (message.command === 'QUIT') {
      verbage = `${message.nick} has quit the server!`;
    } else if (message.command === 'KILL') {
      verbage = `${message.nick} has been removed from the server!`;
    } else if (message.command === 'NICK') {
      verbage = `${message.nick} has changed their nick to ${newNick}!`;
    }

    let lastMessageChan = '';
    if (global.db) {
      const lastMessageChanRef = db.ref(
        `${env.FIREBASE_DB_USERS}/${accountName}/experience/${lastTalkCategory}/lastMessageChannel`,
      );
      await db.ref(lastMessageChanRef).once('value', data => {
        if (data.val() !== null) {
          lastMessageChan = data.val();
        }
      });
    }

    log.debug(F, `lastMessageChan: ${lastMessageChan}`);

    global.ircClient.say(`#${lastMessageChan}`, verbage);

    // Idk why past-me did this so im commenting it out in case the above goes wrong

    // const channelId = channels[actorData.experience.general.lastMessageChannel];
    // log.debug(F, `channelId: ${channelId} (${typeof channelId})`);
    // log.debug(F, `channelId: ${JSON.stringify(channelId, null, 2)}`);

    // if (global.client) {
    //   const lastMessageChannel = await global.discordClient.channels.fetch(channelId);
    //   log.debug(F, `lastMessageChannel: ${lastMessageChannel}`);
    //   lastMessageChannel.send(verbage);
    // } else {
    //   log.debug(F, `No discord client found!`);
    // }
  }
  log.debug(F, 'finished!');
}
