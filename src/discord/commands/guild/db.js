'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../../global/services/firebaseAPI');
// const currentExperience = require('../../../assets/exp.json');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  discordGuildId,
  firebaseUserDbName,
} = require('../../../../env');

const firebaseProdUserDbName = 'users';

let currentExperience = [];
try {
  // eslint-disable-next-line
  currentExperience = require('../../../backups/exp.json');
} catch (e) {
  // logger.info(`[${PREFIX}] We are likely in production and cant load this file!`);
}

// eslint-disable-next-line no-unused-vars
async function backup() {
  logger.debug(`[${PREFIX}] Backing up from firebaseProdUserDbName to firebaseUserDbName`);

  await db.ref('users').once('value', data => {
    if (data.val() !== null) {
      db.ref('users_dev').update(data.val());
    }
  });

  // await db.ref('guilds').once('value', data => {
  //   if (data.val() !== null) {
  //     db.ref('guilds_dev').update(data.val());
  //   }
  // });

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
  if (db !== {}) {
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

async function removeDupliates(/* interaction */) {
  // This command will check for duplicates within the database and merge them
  // This is a very slow command and should be run sparingly

  const snapshotUser = await db.collection(firebaseUserDbName).get();

  // Get a list of users who don't have a .discord property
  const deleteDb = [];
  await snapshotUser.forEach(async user => {
    if (!user.data().discord) {
      deleteDb.push({
        key: user.id,
        value: user.data(),
      });
    }
  });

  // Delete those users
  // eslint-disable-next-line
  for (const user of deleteDb) {
    logger.debug(`[${PREFIX}] ${user.key} has no discord data, deleting`);
    logger.debug(`[${PREFIX}] ${JSON.stringify(user.value, null, 2)}`);
    // eslint-disable-next-line
    await db.collection(firebaseUserDbName).doc(user.key).delete();
    logger.debug(`[${PREFIX}] deleted ${user.key}`);
  }

  logger.debug(`[${PREFIX}] Deleted non-discord accounts`);

  // Get all users that have discord information
  const userDb = [];
  if (db !== {}) {
    // Get user information
    await snapshotUser.forEach(async user => {
      if (user.data().discord) {
        userDb.push({
          key: user.id,
          value: user.data(),
        });
      }
    });
  }
  logger.debug(`[${PREFIX}] Found ${userDb.length} users`);

  // Do a nested loop to see if there are duplicates on the discord id
  const processedIds = [];
  await userDb.forEach(async user => {
    const userKey = user.key;
    const userValue = user.value;

    // Only run on moonbear right now
    // if (userValue.discord.id !== '702682008253628457') return;

    // Check if we have already processed this user
    if (processedIds.includes(userValue.discord.id)) return;

    // logger.debug(`[${PREFIX}] Checking user ${userValue.accountName}`);
    processedIds.push(userValue.discord.id);

    const dupeUserDb = [];
    // eslint-disable-next-line
    for (const subUser of userDb) {
    // await userDb.forEach(subUser => {
      const subUserKey = subUser.key;
      const subUserValue = subUser.value;
      if (subUserValue.discord.id === userValue.discord.id) {
        // logger.debug(`${PREFIX} subUserKey: ${subUserKey}`);
        // logger.debug(`${PREFIX} subUserValue: ${JSON.stringify(subUserValue, null, 2)}`);
        // logger.debug(`[${PREFIX}] ${subUserKey} is a dupe of ${userKey}, adding to dupeDict!`);
        dupeUserDb.push({
          subUserKey,
          subUserValue,
        });
      }
    // });
    }

    if (dupeUserDb.length > 1) {
      logger.debug(
        `[${PREFIX}] ${dupeUserDb.length} dupe(s) found for ${userValue.accountName}`,
      );
      // eslint-disable-next-line
      for (const dupeUser of dupeUserDb) {
        const dupeUserKey = dupeUser.subUserKey;
        const dupeUserValue = dupeUser.subUserValue;

        //   Object.keys(dupeUserValue).forEach(key => {
        //     if (key !== null && key !== undefined && key !== {} && key !== '') {
        //       if (userValue[key] !== dupeUserValue[key]) {
        //         logger.debug(`[${PREFIX}] Diference in key: ${key} `);
        //         logger.debug(`[${PREFIX}] value: ${dupeUserValue[key]} `);
        //       }
        //     }
        //   });
        // }

        //   if (dupeUserValue.karma_given !== userValue.karma_given
        //     && dupeUserValue.karma_given !== undefined) {
        //     logger.debug(`[${PREFIX}] Karma Given is different, updating...`);
        //     Object.keys(dupeUserValue.karma_given).forEach(key => {
        //       if (userValue.karma_given[key] === undefined) {
        //         userValue.karma_given[key] = dupeUserValue.karma_given[key];
        //       } else {
        //         userValue.karma_given[key] += dupeUserValue.karma_given[key];
        //       }
        //     });
        //   }

        //   if (dupeUserValue.karma_received !== userValue.karma_received
        //     && dupeUserValue.karma_received !== undefined) {
        //     logger.debug(`[${PREFIX}] Karma Recieved is different, updating...`);
        //     // Loop through the keys in dupe_user_kr and add them to user_kr
        //     Object.keys(dupeUserValue.karma_received).forEach(key => {
        //       if (userValue.karma_received[key] === undefined) {
        //         userValue.karma_received[key] = dupeUserValue.karma_received[key];
        //       } else {
        //         userValue.karma_received[key] += dupeUserValue.karma_received[key];
        //       }
        //     });
        //   }

        //   if (dupeUserValue.reminders !== userValue.reminders) {
        //     logger.debug(`[${PREFIX}] Reminders are different, updating...`);
        //     // Loop through the keys in dupe_user_reminders and add them to user_reminders
        //     Object.keys(dupeUserValue.reminders).forEach(key => {
        //       if (userValue.reminders[key] === undefined) {
        //         userValue.reminders[key] = dupeUserValue.reminders[key];
        //       } else {
        //         userValue.reminders[key] += dupeUserValue.reminders[key];
        //       }
        //     });
        //   }

        //   if (dupeUserValue.timezone !== userValue.timezone) {
        //     logger.debug(`[${PREFIX}] Timezone is different, updating...`);
        //     userValue.timezone = dupeUserValue.timezone;
        //   }

        if (dupeUserKey !== userKey) {
          logger.debug(
            `[${PREFIX}] Removing ${dupeUserValue.accountName} (${dupeUserKey})from the database...`,
          );
          // eslint-disable-next-line
          await db.collection(firebaseUserDbName).doc(dupeUserKey).delete();
        }
      }

      // logger.debug(`[${PREFIX}] Updating ${userValue.accountName} in the database...`);
      // db.collection(firebaseUserDbName).doc(userKey).set(userValue);
    }
  });
}

// eslint-disable-next-line
async function experience() {
  logger.debug(`[${PREFIX}] Converting experience!`);

  // Loop through everything in currentExperience and print the name
  // eslint-disable-next-line
  const users = await db.collection(firebaseUserDbName).get();
  logger.debug(`[${PREFIX}] Found ${users.size} users!`);

  for (let i = 0; i < users.size; i += 1) {
    const doc = users.docs[i];
    const userData = doc.data();
    if (userData.discord) {
      logger.debug(`[${PREFIX}] Importing ${userData.discord.username}`);
      for (let j = 0; j < currentExperience.length; j += 1) {
        const record = currentExperience[j];
        const recordName = record.Name;
        const recordMessages = parseInt(record.Messages.replace(/,/g, ''), 10);
        const recordExp = parseInt(record.Experience.replace(/,/g, ''), 10);
        const recordLevel = parseInt(record.Level, 10);
        if (userData.discord.username === recordName) {
          logger.debug(`[${PREFIX}] ${recordName} - Lv
${recordLevel} sent ${recordMessages} messages for ${recordExp} exp`);
          // eslint-disable-next-line
          if (userData.discord.username !== 'MoonBear') { continue; }
          logger.debug(`[${PREFIX}] Updating user ${userData.discord.username}!`);
          // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(userData, null, 2)}`);
          if (userData.discord.messages) {
            userData.discord.messages['0'] = {
              count: recordMessages,
              lastMessageDate: 0,
            };
          }
          userData.experience = {
            general: {
              level: recordLevel,
              levelExpPoints: 0,
              totalExpPoints: recordExp,
              lastMessageDate: 0,
            },
            tripsitter: {
              level: 0,
              levelExpPoints: 0,
              totalExpPoints: 0,
              lastMessageDate: 0,
            },
          };
          delete userData.discord.experience;
          db.collection(firebaseUserDbName).doc(doc.id).set(userData);
          break;
        }
      }
    } else {
      logger.debug(`[${PREFIX}] doc: ${JSON.stringify(userData, null, 2)}`);
    }
  }
}

async function convert() {
  logger.debug(`[${PREFIX}] Converting firestore to RTDB`);
  const users = await global.firestore.collection(firebaseProdUserDbName).get();
  // users.forEach(async doc => {
  // eslint-disable-next-line
  for (let i = 0; i < users.size; i += 1) {
    const doc = users.docs[i];
    const oldData = doc.data();
    // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(oldData, null, 2)}`);

    let newData = {};
    let memberKey = '';

    // if (doc.data().accountName === 'MoonBear') {
    // Determine the user's Key
    if (oldData.irc) {
      memberKey = `${oldData.accountName}`;
    }
    if (oldData.discord) {
      try {
        memberKey = `${oldData.discord.username.replace(/\W/g, '_')}${oldData.discord.discriminator}`;
      } catch (err) {
        // logger.error(`[${PREFIX}] Error converting ${JSON.stringify(oldData, null, 2)}`);
        // logger.error(err);
      }
    }

    memberKey = memberKey.replace(/\W/g, '_');

    const ref = db.ref(`${firebaseUserDbName}/${memberKey}`);
    logger.debug(`[${PREFIX}] ref: ${ref}`);
    // eslint-disable-next-line
      await ref.once('value', data => {
      if (data.val() !== null) {
        newData = data.val();
      }
    });

    if (oldData.irc) {
      const ircMessages = {};
      if (oldData.irc.messages) {
        Object.keys(oldData.irc.messages).forEach(channel => {
          const channelName = channel.replace(/\W/g, '');
          ircMessages[channelName] = oldData.irc.messages[channel];
        });
      }
      newData.irc = oldData.irc;
      newData.irc.messages = ircMessages;
    }
    if (oldData.discord) {
      try {
        newData.discord = oldData.discord;
      } catch (err) {
        // logger.error(`[${PREFIX}] Error converting ${JSON.stringify(oldData, null, 2)}`);
        // logger.error(err);
      }
    }

    if (oldData.experience) {
      // logger.debug(`[${PREFIX}] old experience found!`);
      if (oldData.experience.general) {
        // logger.debug(`[${PREFIX}] old general experience found!`);
        if (newData.experience) {
          // logger.debug(`[${PREFIX}] new experience found!`);
          if (newData.experience.general) {
            // logger.debug(`[${PREFIX}] new general experience found!`);
            newData.experience.general.levelExpPoints
                += oldData.experience.general.totalExpPoints;
            newData.experience.general.totalExpPoints
                += oldData.experience.general.totalExpPoints;
          } else {
            // logger.debug(`[${PREFIX}] new general experience NOT found!`);
            newData.experience.general = oldData.experience.general;
          }
        } else {
          // logger.debug(`[${PREFIX}] new experience NOT found!`);
          newData.experience = {
            general: oldData.experience.general,
          };
        }
      }
      if (oldData.experience.tripsitter) {
        if (newData.experience) {
          if (newData.experience.tripsitter) {
            newData.experience.tripsitter.levelExpPoints
              += oldData.experience.tripsitter.totalExpPoints;
            newData.experience.tripsitter.totalExpPoints
              += oldData.experience.tripsitter.totalExpPoints;
          } else {
            newData.experience.tripsitter = oldData.experience.tripsitter;
          }
        } else {
          newData.experience = {
            tripsitter: oldData.experience.tripsitter,
          };
        }
      }
    }

    // logger.debug(`[${PREFIX}] newData: ${JSON.stringify(newData, null, 2)}`);
    db.ref('users').update({ [memberKey]: newData });
    // }
  }
  logger.debug(`[${PREFIX}] Done backing up!`);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db')
    .setDescription('Clean the DB!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Convert firestore to RTDB')
      .setName('convert'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Removes all timed events from the db')
      .setName('remove_events'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Takes a copy of production firebase')
      .setName('backup'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Converts to new exp system')
      .setName('experience'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Converts to new exp system')
      .setName('remove_dupes')),
  async execute(interaction) {
    const command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);

    if (command === 'convert') {
      await convert(interaction);
    } else if (command === 'remove_events') {
      await removeEvents(interaction);
    } else if (command === 'backup') {
      await backup(interaction);
    } else if (command === 'remove_dupes') {
      await removeDupliates(interaction);
    }
    interaction.reply({ embeds: [template.embedTemplate().setTitle('Done!')], ephemeral: false });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
