'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const { db } = global;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clean-db')
    .setDescription('Clean the DB!'),

  async execute(interaction) {
    const users = await db.collection('users').get();
    // This command will check for duplicates within the database and merge them
    // This is a very slow command and should be run sparingly
    users.forEach(async user => {
      const userKey = user.id;
      const userValue = user.data();
      const userId = userValue.discord_id;
      if (userId !== '177537158419054592') return;
      logger.debug(`${PREFIX}: Checking user ${userId}`);
      const userKg = userValue.karma_given;
      const userKr = userValue.karma_received;
      const userReminders = userValue.reminders;
      let userTimezone = userValue.timezone;
      const dupeUserDb = [];
      users.forEach(subUser => {
        const subUserKey = subUser.id;
        const subUserValue = subUser.data();
        if (subUserValue.discord_id === userId) {
          logger.debug(`${PREFIX}: ${subUserValue.discord_username} has a dupe!`);
          dupeUserDb.push({
            sub_user_key: subUserKey,
            sub_user_value: subUserValue,
          });
        }
      });
      logger.debug(`${PREFIX}: ${dupeUserDb.length} dupe(s) found for ${userValue.discord_username}`);
      if (dupeUserDb.length > 1) {
        dupeUserDb.forEach(dupeUser => {
          const dupeUserKey = dupeUser.sub_user_key;
          const dupeUserValue = dupeUser.sub_user_value;
          const dupeUserKg = dupeUserValue.karma_given;
          const dupeUserKr = dupeUserValue.karma_received;
          const dupeUserReminders = dupeUserValue.reminders;
          const dupeUserTimezone = dupeUserValue.timezone;
          if (dupeUserKg !== userKg && dupeUserKg !== undefined) {
            logger.debug(`[${PREFIX}] Karma Given is different, updating...`);
            // Loop through the keys in dupe_user_kg and add them to user_kg
            Object.keys(dupeUserKg).forEach(key => {
              if (userKg[key] === undefined) {
                userKg[key] = dupeUserKg[key];
              } else {
                userKg[key] += dupeUserKg[key];
              }
            });
          }
          if (dupeUserKr !== userKr && dupeUserKr !== undefined) {
            logger.debug(`[${PREFIX}] Karma Recieved is different, updating...`);
            // Loop through the keys in dupe_user_kr and add them to user_kr
            Object.keys(dupeUserKr).forEach(key => {
              if (userKr[key] === undefined) {
                userKr[key] = dupeUserKr[key];
              } else {
                userKr[key] += dupeUserKr[key];
              }
            });
          }
          if (dupeUserReminders !== userReminders) {
            logger.debug(`[${PREFIX}] Reminders are different, updating...`);
            // Loop through the keys in dupe_user_reminders and add them to user_reminders
            Object.keys(dupeUserReminders).forEach(key => {
              if (userReminders[key] === undefined) {
                userReminders[key] = dupeUserReminders[key];
              } else {
                userReminders[key] += dupeUserReminders[key];
              }
            });
          }
          if (dupeUserTimezone !== userTimezone) {
            logger.debug(`[${PREFIX}] Timezone is different, updating...`);
            userTimezone = dupeUserTimezone;
          }
          if (dupeUserKey !== userKey) {
            logger.debug(`[${PREFIX}] Removing ${dupeUserValue.discord_username} from the database...`);
            // db.collection('users').doc(dupe_user_key).delete();
          }
        });
        logger.debug(`[${PREFIX}] Updating ${userValue.discord_username} in the database...`);
        db.collection('users').doc(userKey).set({
          discord_id: userId,
          discord_username: userValue.discord_username,
          discord_discriminator: userValue.discord_discriminator,
          karma_given: userKg || {},
          karma_received: userKr || {},
          reminders: userReminders || {},
          timezone: userTimezone || '',
        });
      }
    });

    // // If the discord_username in users is contained in wrong_users, merge the two entries
    // users.forEach((doc) => {
    //     // logger.debug(`[${PREFIX}] Username: ${doc.data().discord_username}`);
    //     users.forEach((wrong_doc) => {
    //         // logger.debug(`[${PREFIX}] Wrong Username: ${wrong_doc.data().discord_username}`);
    //         if (doc.data().discord_username == wrong_doc.data().discord_username) {
    //             logger.debug(`[${PREFIX}] Merging ${doc.data().discord_username}`);
    //             const info = {
    //                 discord_id: wrong_doc.data().discord_id,
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

    const embed = template.embedTemplate().setTitle('Done!');
    interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
