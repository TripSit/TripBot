import {
  SlashCommandBuilder,
} from 'discord.js';

import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
// import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

// const firebaseProdUserDbName = 'users';

let currentExperience = [];
try {
  // eslint-disable-next-line
  currentExperience = require('../../../backups/exp.json');
} catch (e) {
  // logger.info(`[${PREFIX}] We are likely in production and cant load this file!`);
}

export const database: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('db')
    .setDescription('Clean the DB!')
    .addSubcommand((subcommand) => subcommand
      .setDescription('Takes a copy of production firebase')
      .setName('backup'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Removes all timed events from the db')
      .setName('remove_events'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Convert firestore exp to RTDB')
      .setName('convert')),
  async execute(interaction) {
    const command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);

    // if (command === 'remove_events') {
    //   await removeEvents(interaction);
    // }
    // if (command === 'backup') {
    //   await backup();
    // }
    // if (command === 'convert') {
    //   await convert();
    // }
    interaction.reply({embeds: [embedTemplate().setTitle('Done!')], ephemeral: false});
    logger.debug(`[${PREFIX}] finished!`);
  },
};

// /**
//  * remove events
//  * @param {interaction} interaction
//  */
// async function removeEvents(interaction:ChatInputCommandInteraction) {
//   // Get the guild
//   const guildTripsit = interaction.client.guilds.cache.get(env.DISCORD_GUILD_ID);
//   // eslint-disable-next-line
//   for (const doc of global.userDb) {
//     const discordData = doc.value.discord;
//     // logger.debug(`[${PREFIX}] member: ${member.username}`);
//     // if (doc.value.reminders) {
//     //   if (Object.keys(doc.value.reminders).length > 0) {
//     //     // eslint-disable-next-line
//     //     for (const reminderDate of Object.keys(doc.value.reminders)) {
//     //       // Extract actor data
//     //       // eslint-disable-next-line
//     //       const [actorData, actorFbid] = await getUserInfo(member);
//     //       // Transform actor data
//     //       delete actorData.reminders[reminderDate];
//     //       // // Load actor data
//     //       setUserInfo(actorFbid, actorData);
//     //     }
//     //   }
//     // }
//     if (discordData) {
//       if (discordData.lastHelpedThreadId) {
//         logger.debug(
//             `[${PREFIX}] Deleting ${discordData.username}'s lastHelpedThreadId ${discordData.lastHelpedThreadId}`);
//         let member = {};
//         try {
//           // eslint-disable-next-line
//           // logger.debug(`[${PREFIX}] Getting member ${discordData.id} from guild ${guildTripsit.name}`);
//           // eslint-disable-next-line
//           member = await guildTripsit.members.fetch(discordData.id);
//         } catch (err) {
//           // eslint-disable-next-line
//           // logger.info(`[${PREFIX}] Error getting member ${discordData.id}
// from guild ${guildTripsit.name}, did they quit?`);
//           // logger.debug(err);
//           try {
//             // logger.debug(`[${PREFIX}] Getting user ${discordData.id} object`);
//             // eslint-disable-next-line
//             member = await interaction.client.users.fetch(discordData.id);
//           } catch (err2) {
//             // logger.debug(`[${PREFIX}] Error getting user ${discordData.id} object`);
//             logger.debug(err2);
//             return;
//           }
//         }
//         logger.debug(`[${PREFIX}] member: ${member.username}`);

//         // Extract actor data
//         // eslint-disable-next-line
//         const [actorData, actorFbid] = await getUserInfo(member);

//         // Transform actor data
//         actorData.discord.lastHelpedMetaThreadId = null;
//         actorData.discord.lastHelpedThreadId = null;

//         // Load actor data
//         setUserInfo(actorFbid, actorData);
//       }
//       if (discordData.lastSetMindsetDate) {
//         logger.debug(`[${PREFIX}] Deleting ${discordData.username}'s lastHelpedThreadId
// ${discordData.lastHelpedThreadId}`);
//         let member = {};
//         try {
//           // eslint-disable-next-line
//           // logger.debug(`[${PREFIX}] Getting member ${discordData.id} from guild ${guildTripsit.name}`);
//           // eslint-disable-next-line
//           member = await guildTripsit.members.fetch(discordData.id);
//         } catch (err) {
//           // eslint-disable-next-line
//           // logger.info(`[${PREFIX}] Error getting member
// ${discordData.id} from guild ${guildTripsit.name}, did they quit?`);
//           // logger.debug(err);
//           try {
//             // logger.debug(`[${PREFIX}] Getting user ${discordData.id} object`);
//             // eslint-disable-next-line
//             member = await interaction.client.users.fetch(discordData.id);
//           } catch (err2) {
//             // logger.debug(`[${PREFIX}] Error getting user ${discordData.id} object`);
//             logger.debug(err2);
//             return;
//           }
//         }
//         logger.debug(`[${PREFIX}] member: ${member.username}`);
//         // Extract actor data
//         // eslint-disable-next-line
//         const [actorData, actorFbid] = await getUserInfo(member);

//         // Transform actor data
//         actorData.discord.lastSetMindset = null;
//         actorData.discord.lastSetMindsetDate = null;

//         // Load actor data
//         setUserInfo(actorFbid, actorData);
//       }
//     }
//   }

//   const userDb = [];
//   if (db !== {}) {
//     // Get user information
//     const snapshotUser = await db.collection(FIREBASE_DB_USERS).get();
//     snapshotUser.forEach((doc) => {
//       userDb.push({
//         key: doc.id,
//         value: doc.data(),
//       });
//     });
//   }
//   Object.assign(global, {userDb});
// }

/**
 * remove events
 */
// async function convert() {
//   logger.debug(`[${PREFIX}] Converting firestore to RTDB`);
//   const users = await global.firestore.collection(firebaseProdUserDbName).get();
//   // users.forEach(async doc => {
//   // eslint-disable-next-line
//   for (let i = 0; i < users.size; i += 1) {
//     const doc = users.docs[i];
//     const oldData = doc.data();
//     // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(oldData, null, 2)}`);

//     let newData = {} as any;
//     let memberKey = '';

//     // if (doc.data().accountName === 'MoonBear') {
//     // Determine the user's Key
//     if (oldData.irc) {
//       memberKey = `${oldData.accountName}`;
//     }
//     if (oldData.discord) {
//       try {
//         memberKey = `${oldData.discord.username.replace(/(\.|\$|#|\[|\]|\/)/g, '_')}
// ${oldData.discord.discriminator}`;
//       } catch (err) {
//         // logger.error(`[${PREFIX}] Error converting ${JSON.stringify(oldData, null, 2)}`);
//         // logger.error(err);
//       }
//     }

//     memberKey = memberKey.replace(/(\.|\$|#|\[|\]|\/)/g, '_');

//     const ref = db.ref(`${env.FIREBASE_DB_USERS}/${memberKey}`);
//     logger.debug(`[${PREFIX}] ref: ${ref}`);
//     // eslint-disable-next-line
//       await ref.once('value', data => {
//       if (data.val() !== null) {
//         newData = data.val();
//       }
//     });

//     if (oldData.irc) {
//       const ircMessages = {} as any;
//       if (oldData.irc.messages) {
//         Object.keys(oldData.irc.messages).forEach((channel) => {
//           const channelName = channel.replace(/(\.|\$|#|\[|\]|\/)/g, '');
//           ircMessages[channelName] = oldData.irc.messages[channel];
//         });
//       }
//       newData.irc = oldData.irc;
//       newData.irc.messages = ircMessages;
//     }
//     if (oldData.discord) {
//       try {
//         newData.discord = oldData.discord;
//       } catch (err) {
//         // logger.error(`[${PREFIX}] Error converting ${JSON.stringify(oldData, null, 2)}`);
//         // logger.error(err);
//       }
//     }

//     if (oldData.experience) {
//       // logger.debug(`[${PREFIX}] old experience found!`);
//       if (oldData.experience.general) {
//         // logger.debug(`[${PREFIX}] old general experience found!`);
//         if (newData.experience) {
//           // logger.debug(`[${PREFIX}] new experience found!`);
//           if (newData.experience.general) {
//             // logger.debug(`[${PREFIX}] new general experience found!`);
//             newData.experience.general.levelExpPoints +=
//                 oldData.experience.general.totalExpPoints;
//             newData.experience.general.totalExpPoints +=
//                 oldData.experience.general.totalExpPoints;
//           } else {
//             // logger.debug(`[${PREFIX}] new general experience NOT found!`);
//             newData.experience.general = oldData.experience.general;
//           }
//         } else {
//           // logger.debug(`[${PREFIX}] new experience NOT found!`);
//           newData.experience = {
//             general: oldData.experience.general,
//           };
//         }
//       }
//       if (oldData.experience.tripsitter) {
//         if (newData.experience) {
//           if (newData.experience.tripsitter) {
//             newData.experience.tripsitter.levelExpPoints +=
//               oldData.experience.tripsitter.totalExpPoints;
//             newData.experience.tripsitter.totalExpPoints +=
//               oldData.experience.tripsitter.totalExpPoints;
//           } else {
//             newData.experience.tripsitter = oldData.experience.tripsitter;
//           }
//         } else {
//           newData.experience = {
//             tripsitter: oldData.experience.tripsitter,
//           };
//         }
//       }
//     }

//     // logger.debug(`[${PREFIX}] newData: ${JSON.stringify(newData, null, 2)}`);
//     db.ref('users').update({[memberKey]: newData});
//     // }
//   }
//   logger.debug(`[${PREFIX}] Done backing up!`);
// }

/**
 * remove events
 */
// async function experience() {
//   logger.debug(`[${PREFIX}] Converting experience!`);

//   // Loop through everything in currentExperience and print the name
//   // eslint-disable-next-line
//   const users = await db.collection(env.FIREBASE_DB_USERS).get();
//   logger.debug(`[${PREFIX}] Found ${users.size} users!`);

//   for (let i = 0; i < users.size; i += 1) {
//     const doc = users.docs[i];
//     const userData = doc.data();
//     if (userData.discord) {
//       logger.debug(`[${PREFIX}] Importing ${userData.discord.username}`);
//       for (let j = 0; j < currentExperience.length; j += 1) {
//         const record = currentExperience[j];
//         const recordName = record.Name;
//         const recordMessages = parseInt(record.Messages.replace(/,/g, ''), 10);
//         const recordExp = parseInt(record.Experience.replace(/,/g, ''), 10);
//         const recordLevel = parseInt(record.Level, 10);
//         if (userData.discord.username === recordName) {
//           logger.debug(`[${PREFIX}] ${recordName} - Lv
// ${recordLevel} sent ${recordMessages} messages for ${recordExp} exp`);
//           // eslint-disable-next-line
//           if (userData.discord.username !== 'MoonBear') { continue; }
//           logger.debug(`[${PREFIX}] Updating user ${userData.discord.username}!`);
//           // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(userData, null, 2)}`);
//           if (userData.discord.messages) {
//             userData.discord.messages['0'] = {
//               count: recordMessages,
//               lastMessageDate: 0,
//             };
//           }
//           userData.experience = {
//             general: {
//               level: recordLevel,
//               levelExpPoints: 0,
//               totalExpPoints: recordExp,
//               lastMessageDate: 0,
//             },
//             tripsitter: {
//               level: 0,
//               levelExpPoints: 0,
//               totalExpPoints: 0,
//               lastMessageDate: 0,
//             },
//           };
//           delete userData.discord.experience;
//           db.collection(FIREBASE_DB_USERS).doc(doc.id).set(userData);
//           break;
//         }
//       }
//     } else {
//       logger.debug(`[${PREFIX}] doc: ${JSON.stringify(userData, null, 2)}`);
//     }
//   }
// }
