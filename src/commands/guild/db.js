'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../utils/firebase');
// const currentExperience = require('../../assets/exp.json');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  discordGuildId,
  firebaseUserDbName,
} = require('../../../env');

let currentExperience = [];
try {
  // eslint-disable-next-line
  currentExperience = require('../../../backups/exp.json');
} catch (e) {
  logger.info(`[${PREFIX}] We are likely in production and cant load this file!`);
}

// eslint-disable-next-line no-unused-vars
async function updateLocal() {
  const userDb = [];
  if (db !== undefined) {
    // Get user information
    const snapshotUser = await db.collection(firebaseUserDbName).get();
    snapshotUser.forEach(doc => {
      userDb.push({
        key: doc.id,
        value: doc.data(),
      });
    });
  }
  Object.assign(global, { userDb });
  logger.debug(`[${PREFIX}] User database loaded.`);
}

// eslint-disable-next-line no-unused-vars
async function backup() {
  logger.debug(`[${PREFIX}] Backing up from 'users' to 'users_dev'`);

  async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      // When there are no documents left, we are done
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(query, resolve);
    });
  }

  async function deleteCollection(collectionPath) {
    // const collectionRef = db.collection(collectionPath);
    // const query = collectionRef.orderBy('__name__').limit(batchSize);
    const query = db.collection(collectionPath);

    return new Promise((resolve, reject) => {
      deleteQueryBatch(query, resolve).catch(reject);
    });
  }

  await deleteCollection('users_dev', 100).catch(err => logger.error(err));

  const users = await db.collection('users').get();
  users.forEach(async doc => {
    await db.collection('users_dev').doc(doc.id).set(doc.data());
  });
  logger.debug(`[${PREFIX}] Done backing up!`);
}

// eslint-disable-next-line no-unused-vars
async function removeEvents(interaction) {
  // Get the guild
  const guildTripsit = interaction.client.guilds.cache.get(discordGuildId);
  // eslint-disable-next-line
  for (const doc of global.userDb) {
    const discordData = doc.value.discord;
    // logger.debug(`[${PREFIX}] member: ${member.username}`);
    // if (doc.value.reminders) {
    //   if (Object.keys(doc.value.reminders).length > 0) {
    //     // eslint-disable-next-line
    //     for (const reminderDate of Object.keys(doc.value.reminders)) {
    //       // Extract actor data
    //       // eslint-disable-next-line
    //       const [actorData, actorFbid] = await getUserInfo(member);
    //       // Transform actor data
    //       delete actorData.reminders[reminderDate];
    //       // // Load actor data
    //       setUserInfo(actorFbid, actorData);
    //     }
    //   }
    // }
    if (discordData) {
      if (discordData.lastHelpedThreadId) {
        logger.debug(`[${PREFIX}] Deleting ${discordData.username}'s lastHelpedThreadId ${discordData.lastHelpedThreadId}`);
        let member = {};
        try {
          // eslint-disable-next-line
          // logger.debug(`[${PREFIX}] Getting member ${discordData.id} from guild ${guildTripsit.name}`);
          // eslint-disable-next-line
          member = await guildTripsit.members.fetch(discordData.id);
        } catch (err) {
          // eslint-disable-next-line
          // logger.info(`[${PREFIX}] Error getting member ${discordData.id} from guild ${guildTripsit.name}, did they quit?`);
          // logger.debug(err);
          try {
            // logger.debug(`[${PREFIX}] Getting user ${discordData.id} object`);
            // eslint-disable-next-line
            member = await interaction.client.users.fetch(discordData.id);
          } catch (err2) {
            // logger.debug(`[${PREFIX}] Error getting user ${discordData.id} object`);
            logger.debug(err2);
            return;
          }
        }
        logger.debug(`[${PREFIX}] member: ${member.username}`);

        // Extract actor data
        // eslint-disable-next-line
        const [actorData, actorFbid] = await getUserInfo(member);

        // Transform actor data
        actorData.discord.lastHelpedMetaThreadId = null;
        actorData.discord.lastHelpedThreadId = null;

        // Load actor data
        setUserInfo(actorFbid, actorData);
      }
      if (discordData.lastSetMindsetDate) {
        logger.debug(`[${PREFIX}] Deleting ${discordData.username}'s lastHelpedThreadId ${discordData.lastHelpedThreadId}`);
        let member = {};
        try {
          // eslint-disable-next-line
          // logger.debug(`[${PREFIX}] Getting member ${discordData.id} from guild ${guildTripsit.name}`);
          // eslint-disable-next-line
          member = await guildTripsit.members.fetch(discordData.id);
        } catch (err) {
          // eslint-disable-next-line
          // logger.info(`[${PREFIX}] Error getting member ${discordData.id} from guild ${guildTripsit.name}, did they quit?`);
          // logger.debug(err);
          try {
            // logger.debug(`[${PREFIX}] Getting user ${discordData.id} object`);
            // eslint-disable-next-line
            member = await interaction.client.users.fetch(discordData.id);
          } catch (err2) {
            // logger.debug(`[${PREFIX}] Error getting user ${discordData.id} object`);
            logger.debug(err2);
            return;
          }
        }
        logger.debug(`[${PREFIX}] member: ${member.username}`);
        // Extract actor data
        // eslint-disable-next-line
        const [actorData, actorFbid] = await getUserInfo(member);

        // Transform actor data
        actorData.discord.lastSetMindset = null;
        actorData.discord.lastSetMindsetDate = null;

        // Load actor data
        setUserInfo(actorFbid, actorData);
      }
    }
  }

  const userDb = [];
  if (db !== undefined) {
    // Get user information
    const snapshotUser = await db.collection(firebaseUserDbName).get();
    snapshotUser.forEach(doc => {
      userDb.push({
        key: doc.id,
        value: doc.data(),
      });
    });
  }
  Object.assign(global, { userDb });
}

// async function experience() {
//   logger.debug(`[${PREFIX}] Converting experience!`);

//   // Loop through everything in currentExperience and print the name
//   // eslint-disable-next-line
//   const users = await db.collection('users').get();
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
//           db.collection('users').doc(doc.id).set(userData);
//           break;
//         }
//       }
//     } else {
//       logger.debug(`[${PREFIX}] doc: ${JSON.stringify(userData, null, 2)}`);
//     }
//   }
// }
module.exports = {
  data: new SlashCommandBuilder()
    .setName('db')
    .setDescription('Clean the DB!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Refresh the local db from the remote firebase db')
      .setName('refresh'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Removes all timed events from the db')
      .setName('remove_events'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Takes a copy of production firebase')
      .setName('backup'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Converts to new exp system')
      .setName('experience')),
  async execute(interaction) {
    const command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);

    if (command === 'refresh') {
      await updateLocal();
    } else if (command === 'remove_events') {
      await removeEvents(interaction);
    } else if (command === 'backup') {
      await backup();
    }
    // else if (command === 'experience') {
    //   await experience();
    // }

    // async function emojinameFix() {
    //   logger.debug(`[${PREFIX}] emojinameFix`);
    //   const users = await db.collection('users').get();
    //   logger.debug(`[${PREFIX}] Found ${users.size} users!`);
    //   users.forEach(async user => {
    //     const userKey = user.id;
    //     const userValue = user.data();
    //     const userData = userValue;
    //     // logger.debug(`[${PREFIX}] Cleaning user ${userValue.accountName}!`);
    //     // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(doc, null, 2)}`);
    //     if (userValue.discord) {
    //       if (userValue.discord.karma_given) {
    //         if (userValue.discord.karma_given['<:ts_up:958721361587630210>']) {
    //           const oldKarma = userValue.discord.karma_given['<:ts_up:958721361587630210>'];
    //           const newKarma = userValue.discord.karma_given['<:ts_voteup:958721361587630210>'];
    //           const finalKarma = newKarma ? oldKarma + newKarma : oldKarma;
    //           userData.discord.karma_given['<:ts_voteup:958721361587630210>'] = finalKarma;
    //           delete userData.discord.karma_given['<:ts_up:958721361587630210>'];
    //         }
    //         if (userValue.discord.karma_given['<:ts_down:960161563849932892>']) {
    //           const oldKarma = userValue.discord.karma_given['<:ts_down:960161563849932892>'];
    //           const newKarma = userValue.discord.karma_given[
    // '<:ts_votedown:960161563849932892>'];
    //           const finalKarma = newKarma ? oldKarma + newKarma : oldKarma;
    //           userData.discord.karma_given['<:ts_votedown:960161563849932892>'] = finalKarma;
    //           delete userData.discord.karma_given['<:ts_down:960161563849932892>'];
    //         }
    //       }
    //       if (userValue.discord.karma_received) {
    //         if (userValue.discord.karma_received['<:ts_up:958721361587630210>']) {
    //           const oldKarma = userValue.discord.karma_received['<:ts_up:958721361587630210>'];
    //           const newKarma = userValue.discord.karma_received[
    // '<:ts_voteup:958721361587630210>'];
    //           const finalKarma = newKarma ? oldKarma + newKarma : oldKarma;
    //           userData.discord.karma_received['<:ts_voteup:958721361587630210>'] = finalKarma;
    //           delete userData.discord.karma_received['<:ts_up:958721361587630210>'];
    //         }
    //         if (userValue.discord.karma_received['<:ts_down:960161563849932892>']) {
    //           const oldKarma = userValue.discord.karma_received['<:ts_down:960161563849932892>'];
    //           const newKarma = userValue.discord.karma_received[
    // '<:ts_votedown:960161563849932892>'];
    //           const finalKarma = newKarma ? oldKarma + newKarma : oldKarma;
    //           userData.discord.karma_received['<:ts_votedown:960161563849932892>'] = finalKarma;
    //           delete userData.discord.karma_received['<:ts_down:960161563849932892>'];
    //         }
    //       }
    //       db.collection('users').doc(userKey).set(userData);
    //     }
    //     logger.debug(`[${PREFIX}] Done cleaning karma!`);
    //   });
    // }
    // await emojinameFix();
    // async function karmaFix() {
    //   logger.debug(`[${PREFIX}] Cleaning karma`);
    //   const users = await db.collection('users').get();
    //   logger.debug(`[${PREFIX}] Found ${users.size} users!`);
    //   // users.forEach(async doc => {
    //   for (let i = 0; i < users.size; i += 1) {
    //     // logger.debug(`[${PREFIX}] Cleaning user ${i}!`);
    //     const doc = users.docs[i];
    //     // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(doc, null, 2)}`);
    //     if (!doc.data().discord) {
    //       if (doc.data().karma_recieved) {
    //         const userData = doc.data();
    //         logger.debug(`[${PREFIX}] Updating user ${userData.discord_username}!`);
    //         // logger.debug(`[${PREFIX}] userData1 ${JSON.stringify(userData, null, 2)}!`);
    //         if (userData.karma_recieved) {
    //           userData.karma_received = userData.karma_recieved;
    //           delete userData.karma_recieved;
    //           // logger.debug(`[${PREFIX}] userData2 ${JSON.stringify(userData, null, 2)}!`);
    //           db.collection('users').doc(doc.id).set(userData);
    //         }
    //       }
    //     }
    //   }
    //   logger.debug(`[${PREFIX}] Done cleaning karma!`);
    // }
    // await karmaFix();

    // async function discordTransition() {
    //   logger.debug(`[${PREFIX}] Cleaning Discord DB...`);
    //   const users = await db.collection('users').get();
    //   logger.debug(`[${PREFIX}] Found ${users.size} users!`);
    //   // users.forEach(async doc => {
    //   for (let i = 0; i < users.size; i += 1) {
    //     logger.debug(`[${PREFIX}] Cleaning user ${i}!`);
    //     const doc = users.docs[i];
    //     // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(doc, null, 2)}`);
    //     if (!doc.data().discord) {
    //       const userData = doc.data();
    //       // logger.debug(`[${PREFIX}] Updating user ${userData.discord_username}!`);
    //       // logger.debug(`[${PREFIX}] userData1 ${JSON.stringify(userData, null, 2)}!`);
    //       userData.name = userData.discord_username;
    //       if (userData.discord_discriminator) {
    //         userData.discord = {
    //           id: userData.discord_id ? userData.discord_id : '',
    //           username: userData.discord_username ? userData.discord_username : '',
    //           discriminator: userData.discord_discriminator
    //             ? userData.discord_discriminator
    //             : '',
    //           karma_given: userData.karma_given ? userData.karma_given : {},
    //           karma_received: userData.karma_received ? userData.karma_received : {},
    //           lastHelpedDate: userData.lasHelpedDate ? userData.lasHelpedDate : '',
    //           lastHelpedMetaThreadId: userData.lastHelpedMetaThreadId
    //             ? userData.lastHelpedMetaThreadId
    //             : '',
    //           lastHelpedThreadId: userData.lastHelpedThreadId ? userData.lastHelpedThreadId : '',
    //           modActions: userData.mod_actions ? userData.mod_actions : {},
    //           roles: userData.roles ? userData.roles : [],
    //           joinedTimestamp: userData.joinedTimestamp ? userData.joinedTimestamp : '',
    //         };
    //         delete userData.discord_id;
    //         delete userData.discord_username;
    //         delete userData.discord_discriminator;
    //         delete userData.karma_given;
    //         delete userData.karma_received;
    //         delete userData.lastHelpedDate;
    //         delete userData.lastHelpedMetaThreadId;
    //         delete userData.lastHelpedThreadId;
    //         delete userData.modActions;
    //         delete userData.mod_actions;
    //         delete userData.roles;
    //         delete userData.reactionRoles;
    //         delete userData.joinedTimestamp;
    //         // logger.debug(`[${PREFIX}] userData2 ${JSON.stringify(userData, null, 2)}!`);
    //         db.collection('users').doc(doc.id).set(userData);
    //       }
    //     }
    //   }
    //   logger.debug(`[${PREFIX}] Done moving discord info!`);
    // }
    // await discordTransition();

    // async function nameFix() {
    //   logger.debug(`[${PREFIX}] Cleaning karma`);
    //   const users = await db.collection('users').get();
    //   logger.debug(`[${PREFIX}] Found ${users.size} users!`);
    //   // users.forEach(async doc => {
    //   for (let i = 0; i < users.size; i += 1) {
    //     // logger.debug(`[${PREFIX}] Cleaning user ${i}!`);
    //     const doc = users.docs[i];
    //     // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(doc, null, 2)}`);
    //     if (doc.data().name) {
    //       const userData = doc.data();
    //       userData.accountName = userData.name;
    //       delete userData.name;
    //       db.collection('users').doc(doc.id).set(userData);
    //     }
    //   }
    //   logger.debug(`[${PREFIX}] Done cleaning karma!`);
    // }
    // await nameFix();

    // This command will check for duplicates within the database and merge them
    // This is a very slow command and should be run sparingly
    // users.forEach(async user => {
    //   const userKey = user.id;
    //   const userValue = user.data();
    //   const userId = userValue.discord.id;
    //   if (userId !== '177537158419054592') return;
    //   logger.debug(`${PREFIX}: Checking user ${userId}`);
    //   const userKg = userValue.karma_given;
    //   const userKr = userValue.karma_received;
    //   const userReminders = userValue.reminders;
    //   let userTimezone = userValue.timezone;
    //   const dupeUserDb = [];
    //   users.forEach(subUser => {
    //     const subUserKey = subUser.id;
    //     const subUserValue = subUser.data();
    //     if (subUserValue.discord.id === userId) {
    //       logger.debug(`${PREFIX}: ${subUserValue.discord_username} has a dupe!`);
    //       dupeUserDb.push({
    //         sub_user_key: subUserKey,
    //         sub_user_value: subUserValue,
    //       });
    //     }
    //   });
    //   logger.debug(
    // `${PREFIX}: ${dupeUserDb.length} dupe(s) found for ${userValue.discord_username}`);
    //   if (dupeUserDb.length > 1) {
    //     dupeUserDb.forEach(dupeUser => {
    //       const dupeUserKey = dupeUser.sub_user_key;
    //       const dupeUserValue = dupeUser.sub_user_value;
    //       const dupeUserKg = dupeUserValue.karma_given;
    //       const dupeUserKr = dupeUserValue.karma_received;
    //       const dupeUserReminders = dupeUserValue.reminders;
    //       const dupeUserTimezone = dupeUserValue.timezone;
    //       if (dupeUserKg !== userKg && dupeUserKg !== undefined) {
    //         logger.debug(`[${PREFIX}] Karma Given is different, updating...`);
    //         // Loop through the keys in dupe_user_kg and add them to user_kg
    //         Object.keys(dupeUserKg).forEach(key => {
    //           if (userKg[key] === undefined) {
    //             userKg[key] = dupeUserKg[key];
    //           } else {
    //             userKg[key] += dupeUserKg[key];
    //           }
    //         });
    //       }
    //       if (dupeUserKr !== userKr && dupeUserKr !== undefined) {
    //         logger.debug(`[${PREFIX}] Karma Recieved is different, updating...`);
    //         // Loop through the keys in dupe_user_kr and add them to user_kr
    //         Object.keys(dupeUserKr).forEach(key => {
    //           if (userKr[key] === undefined) {
    //             userKr[key] = dupeUserKr[key];
    //           } else {
    //             userKr[key] += dupeUserKr[key];
    //           }
    //         });
    //       }
    //       if (dupeUserReminders !== userReminders) {
    //         logger.debug(`[${PREFIX}] Reminders are different, updating...`);
    //         // Loop through the keys in dupe_user_reminders and add them to user_reminders
    //         Object.keys(dupeUserReminders).forEach(key => {
    //           if (userReminders[key] === undefined) {
    //             userReminders[key] = dupeUserReminders[key];
    //           } else {
    //             userReminders[key] += dupeUserReminders[key];
    //           }
    //         });
    //       }
    //       if (dupeUserTimezone !== userTimezone) {
    //         logger.debug(`[${PREFIX}] Timezone is different, updating...`);
    //         userTimezone = dupeUserTimezone;
    //       }
    //       if (dupeUserKey !== userKey) {
    //         logger.debug(
    // `[${PREFIX}] Removing ${dupeUserValue.discord_username} from the database...`);
    //         // db.collection('users').doc(dupe_user_key).delete();
    //       }
    //     });
    //     logger.debug(`[${PREFIX}] Updating ${userValue.discord_username} in the database...`);
    //     db.collection('users').doc(userKey).set({
    //       // discord.id: userId,
    //       discord_username: userValue.discord_username,
    //       discord_discriminator: userValue.discord_discriminator,
    //       karma_given: userKg || {},
    //       karma_received: userKr || {},
    //       reminders: userReminders || {},
    //       timezone: userTimezone || '',
    //     });
    //   }
    // });

    // // If the discord_username in users is contained in wrong_users, merge the two entries
    // users.forEach((doc) => {
    //     // logger.debug(`[${PREFIX}] Username: ${doc.data().discord_username}`);
    //     users.forEach((wrong_doc) => {
    //         // logger.debug(`[${PREFIX}] Wrong Username: ${wrong_doc.data().discord_username}`);
    //         if (doc.data().discord_username == wrong_doc.data().discord_username) {
    //             logger.debug(`[${PREFIX}] Merging ${doc.data().discord_username}`);
    //             const info = {
    //                 discord.id: wrong_doc.data().discord.id,
    //                 discord_username: wrong_doc.data().discord_username,
    //                 discord_discriminator: wrong_doc.data().discord_discriminator,
    //                 isBanned: wrong_doc.data().isBanned,
    // eslint-disable-next-line
    //                 karma_received: wrong_doc.data().karma_received ? wrong_doc.data().karma_received : {},
    // eslint-disable-next-line
    //                 karma_given: wrong_doc.data().karma_given ? wrong_doc.data().karma_given : {},
    //                 roles: wrong_doc.data().roles ? wrong_doc.data().roles : [],
    //                 timezone: wrong_doc.data().timezone ? wrong_doc.data().timezone : '',
    //                 reminders: wrong_doc.data().reminders ? wrong_doc.data().reminders : {},
    //             };
    //             db.collection('users').doc(doc.id).update(info);
    //             logger.debug(`[${PREFIX}] Updated ${doc.data().discord_username}`);
    //             return;
    //         }
    //         db.collection('"users"').doc(wrong_doc.id).delete();
    //         logger.debug(`[${PREFIX}] Deleted ${doc.data().discord_username}`);
    //     });
    // });
    // const guilds = await db.collection('guilds').get();
    // // This command will check for duplicates within the database and merge them
    // // This is a very slow command and should be run sparingly
    // guilds.forEach((doc) => {
    //     const key = doc.id;
    //     const value = doc.data();
    //     const guild_id = value.guild_id;
    //     const guild_db = [];
    // eslint-disable-next-line
    //     const snapshot_guild = await db.collection('guilds').where('guild_id', '==', guild_id).get();
    //     snapshot_guild.forEach((doc) => {
    //         const key = doc.id;
    //         const value = doc.data();
    //         guild_db.push({
    //             key,
    //             value,
    //         });
    //     });
    //     if (guild_db.length > 1) {
    // eslint-disable-next-line
    //         logger.debug(`[${PREFIX}] ${guild_db.length} duplicates found for guild_id: ${guild_id}`);
    //         guild_db.forEach((doc) => {
    //             const key = doc.id;
    //             const value = doc.data();
    //             if (key !== value.key) {
    //                 logger.debug(`[${PREFIX}] ${key} !== ${value.key}`);
    //                 db.collection('guilds').doc(key).delete();
    //             }
    //         });
    //     }
    // });

    interaction.reply({ embeds: [template.embedTemplate().setTitle('Done!')], ephemeral: false });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
