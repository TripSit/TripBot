'use strict';

const PREFIX = require('path').parse(__filename).name;

// const fs = require('fs/promises');
const admin = require('firebase-admin');
// const { initializeApp, cert } = require('firebase-admin/app'); // eslint-disable-line
// const { getFirestore } = require('firebase-admin/firestore'); // eslint-disable-line
// const { initializeApp } = require('firebase/app');
// const { getDatabase } = require('firebase/database');
// const { initializeAppCheck, ReCaptchaV3Provider } = require('firebase/app-check');
const firebase = require('firebase');
const firebaseConfig = require('../assets/config/firebase_creds.json');

const logger = require('../utils/logger');

const {
  // NODE_ENV,
  firebaseTicketDbName,
  firebaseGuildDbName,
  firebaseUserDbName,
  firebasePrivateKeyId,
  firebasePrivateKey,
  firebaseClientId,
  firebaseClientEmail,
  firebaseDatabaseURL,
  // firebaseRealtimeKey,
} = require('../../../env');

module.exports = {
  firebaseConnect: async () => {
    // logger.info(`[${PREFIX}] connecting...`);
    // Initialize firebase app
    firebaseConfig.private_key_id = firebasePrivateKeyId;
    firebaseConfig.private_key = firebasePrivateKey ? firebasePrivateKey.replace(/\\n/g, '\n') : undefined;
    firebaseConfig.client_email = firebaseClientEmail;
    firebaseConfig.client_id = firebaseClientId;
    firebaseConfig.databaseURL = firebaseDatabaseURL;

    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: firebaseDatabaseURL,
    });

    global.db = admin.database();

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
    // key is the counterpart to the secret key you set in the Firebase console.
    // initializeAppCheck(app, {
    //   provider: new ReCaptchaV3Provider(firebaseRealtimeKey),

    //   // Optional argument. If true, the SDK automatically refreshes App Check
    //   // tokens as needed.
    //   isTokenAutoRefreshEnabled: true,
    // });

    // Initialize Realtime Database and get a reference to the service
    global.db = admin.database();

    const { db } = global;
    // async function updateGlobalDb(userRef, guildRef) {
    //   await userRef.once('value', data => {
    //     Object.assign(global, { userDb: data.val() });
    //     logger.debug(`[${PREFIX}] Global USER db updated!`);
    //   }, errorObject => {
    //     logger.error(`[${PREFIX}] ${errorObject.name}`);
    //   });

    //   // logger.debug(`[${PREFIX}] userDb: ${JSON.stringify(global.userDb, null, 4)}`);
    //   logger.debug(`[${PREFIX}] Global User DB loaded!`);

    //   const blacklistGuilds = [];
    //   await guildRef.once('value', data => {
    //     Object.assign(global, { guildDb: data.val() });
    //     logger.debug(`[${PREFIX}] Global GUILD db updated!`);
    //     Object.keys(data.val()).forEach(doc => {
    //       if (data.val()[doc].isBanned) {
    //         blacklistGuilds.push(data.val()[doc].guild_id);
    //       }
    //     });
    //   });
    // }

    if (db !== undefined) {
      const userRef = db.ref(`${firebaseUserDbName}`);
      userRef.on('child_changed', snapshot => {
        logger.debug(`[${PREFIX}] changed: ${JSON.stringify(snapshot.key, null, 4)}`);
        global.userDb[snapshot.key] = snapshot.val();
        logger.debug(`[${PREFIX}] Global USER db updated with CHANGES!`);
      });

      userRef.on('child_added', snapshot => {
        // logger.debug(`[${PREFIX}] added: ${JSON.stringify(snapshot.key, null, 4)}`);
        global.userDb[snapshot.key] = snapshot.val();
        // logger.debug(`[${PREFIX}] Global USER db updated with ADDITIONS!`);
        // logger.debug(`[${PREFIX}] global.userDb: ${JSON.stringify(global.userDb, null, 4)}`);
      });

      userRef.on('child_removed', snapshot => {
        logger.debug(`[${PREFIX}] removed: ${JSON.stringify(snapshot.key, null, 4)}`);
        delete global.userDb[snapshot.key];
        logger.debug(`[${PREFIX}] Global USER db updated with DELETIONS!`);
      });

      // GUILD
      const guildRef = db.ref(`${firebaseGuildDbName}`);
      guildRef.on('child_changed', snapshot => {
        logger.debug(`[${PREFIX}] changed: ${JSON.stringify(snapshot.key, null, 4)}`);
        global.guildDb[snapshot.key] = snapshot.val();
        logger.debug(`[${PREFIX}] Global GUILD db updated with CHANGES!`);
      });

      guildRef.on('child_added', snapshot => {
        // logger.debug(`[${PREFIX}] added: ${JSON.stringify(snapshot.key, null, 4)}`);
        try {
          global.guildDb[snapshot.key] = snapshot.val();
        } catch (err) {
          logger.error(`[${PREFIX}] ${err}`);
          logger.debug(`[${PREFIX}] snapshot.key: ${snapshot.key}`);
          logger.debug(`[${PREFIX}] snapshot.val(): ${JSON.stringify(snapshot.val(), null, 4)}`);
        }
        logger.debug(`[${PREFIX}] Global GUILD db updated with ADDITIONS!`);
        // logger.debug(`[${PREFIX}] global.guildDb: ${JSON.stringify(global.guildDb, null, 4)}`);
      });

      guildRef.on('child_removed', snapshot => {
        logger.debug(`[${PREFIX}] removed: ${JSON.stringify(snapshot.key, null, 4)}`);
        delete global.guildDb[snapshot.key];
        logger.debug(`[${PREFIX}] Global GUILD db updated with DELETIONS!`);
      });
      logger.info(`[${PREFIX}] connected!`);
    }
  },
  getUserInfo: async member => {
    logger.info(`[${PREFIX}] getUserInfo start!`);
    // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);
    // {
    //   "nick": "Teknos",
    //   "user": "~teknos",
    //   "host": "tripsit/founder/Teknos",
    //   "realname": "Eric",
    //   "channels": [
    //   ],
    //   "server": "innsbruck.tripsit.me",
    //   "serverinfo": "TripSit IRC Private Jet Receipt Server",
    //   "operator": "Cantillating grace and they can't keep my pace",
    //   "idle": "0",
    //   "account": "Teknos",
    //   "accountinfo": "is logged in as"
    // }

    // {
    //   "nick": "Test",
    //   "user": "~Test",
    //   "host": "98.46.kp.sup",
    //   "realname": "Test @ Webchat",
    //   "channels": [
    //     "#sandbox"
    //   ],
    //   "server": "innsbruck.tripsit.me",
    //   "serverinfo": "TripSit IRC Private Jet Receipt Server",
    //   "idle": "0"
    // }

    // With the way firebase's RTDB works we need a distinct key to use for each user
    // For IRC the key is their account name, or if they're not registered, their hostname
    // Note: We only store the scrambled hostname for security reasons, never store real IP info
    // For Discord we use the user's tag (username#discriminator)
    let memberKey = '';
    let memberData = {};

    // Determine what platform the user is from
    // Depending on source of the user we need to use different keys
    let name = '';
    if (member.host) {
      // If the member object has a host value, then this is a message from IRC
      logger.debug(`[${PREFIX}] Member is from IRC!`);

      // Only registered users' hosts start with tripsit
      if (member.host.startsWith('tripsit')) {
        memberKey = member.host.split('/')[2];
      } else {
        memberKey = member.host;
      }

      // Get the member friendly name of the user we're looking up
      name = member.nick;
    } else if (member.user) {
      // Only Users INSIDE the guild will have a .user property
      logger.debug(`[${PREFIX}] Member is from Discord!`);
      memberKey = `${member.user.username}${member.user.discriminator}`;

      // Get the member friendly name of the user we're looking up
      name = member.user.username;
    } else if (member.username) {
      // Only Users OUTSIDE the guild will have a .username property
      logger.debug(`[${PREFIX}] User is from Discord!`);
      memberKey = `${member.username}${member.discriminator}`;
      name = member.username;
    }

    logger.debug(`[${PREFIX}] Looking up ${name}!`);

    memberKey = memberKey.replace(/\W/g, '_');

    const { db } = global;
    if (db !== undefined) {
      const ref = db.ref(`${firebaseUserDbName}/${memberKey}`);
      // logger.debug(`[${PREFIX}] ref: ${ref}`);
      await ref.once('value', data => {
        if (data.val() !== null) {
          // logger.debug(`[${PREFIX}] data: ${JSON.stringify(data.val(), null, 2)}`);
          logger.debug(`[${PREFIX}] ${name} found in DB!`);
          memberData = data.val();
        }
      });
    }
    // logger.debug(`[${PREFIX}] memberData: ${JSON.stringify(memberData, null, 2)}`);
    logger.debug(`[${PREFIX}] memberKey: ${JSON.stringify(memberKey, null, 2)}`);

    if (member.host) {
      // Only registered users' hosts start with tripsit
      let memberRole = '';
      if (member.host.startsWith('tripsit')) {
        memberRole = member.host.split('/')[1];
      } else {
        memberRole = 'member';
      }
      memberData.irc = {
        accountName: memberKey || member.host,
        vhost: member.host,
        nickname: member.nick,
        role: memberRole,
      };
    } else if (member.user) {
      memberData.discord = {
        id: member.user.id.toString(),
        tag: member.user.tag,
        username: member.user.username,
        discriminator: member.user.discriminator,
        nickname: member.nickname,
      };
    } else if (member.username) {
      memberData.discord = {
        id: member.id.toString(),
        tag: member.tag,
        username: member.username,
        discriminator: member.discriminator,
      };
    }

    logger.info(`[${PREFIX}] getUserInfo finish!`);

    return [memberData, memberKey];
  },
  setUserInfo: async (id, data) => {
    logger.debug(`[${PREFIX}] setUserInfo()`);
    const { db } = global;
    if (db !== undefined) {
      // logger.debug(`[${PREFIX}] Saving ${JSON.stringify(data, null, 2)}!`);
      // Update will update the given key or create a new one if it doesn't exist
      db.ref(firebaseUserDbName).update({
        [id]: data,
      });
    }
  },
  getGuildInfo: async guild => {
    const { db } = global;

    let guildData = {
      guild_name: guild.name,
      guild_id: guild.id || '',
      guild_createdAt: guild.createdAt || '',
      guild_joinedAt: guild.joinedAt || '',
      guild_description: `${guild.description ? guild.description : 'No description'}`,
      guild_member_count: guild.memberCount,
      guild_owner_id: guild.discordOwnerId || 'No Owner',
      guild_banned: false,
    };
    let guildFbid = guild.name;

    if (db !== undefined) {
      // logger.debug(`[${PREFIX}] Looking up guild ${guild}!`);
      const ref = db.ref(`${firebaseGuildDbName}/${guild.name.toString()}`);
      // logger.debug(`[${PREFIX}] ref: ${ref}`);
      await ref.once('value', data => {
        if (data.val() !== null) {
          logger.debug(`[${PREFIX}] data: ${JSON.stringify(data.val(), null, 2)}`);
          logger.debug(`[${PREFIX}] Guild data found!`);
          // logger.debug(`[${PREFIX}] doc.data().guild_id: ${doc.data().guild_id}`);
          // logger.debug(`[${PREFIX}] doc.data(): ${JSON.stringify(doc.data())}`);
          guildData = data.val();
          guildFbid = guild.name;
        }
      });
    }
    // logger.debug(`[${PREFIX}] guildData: ${JSON.stringify(guildData)}`);
    return [guildData, guildFbid];
  },
  setGuildInfo: async (id, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.guild_name}!`);
    const { db } = global;
    // logger.debug(`[${PREFIX}] fbid ${fbid}!`);
    if (db !== undefined) {
      db.ref(firebaseGuildDbName).update({
        [id]: data,
      });
    }
  },
  getTicketInfo: async (id, type) => {
    logger.debug(`[${PREFIX}] Looking up ticket from ${type} ${id}!`);
    let ticketFbid = null;
    let ticketData = {};
    let ticketBlocked = false;

    const { db } = global;

    if (db !== undefined) {
      const snapshotTicket = await db.collection(firebaseTicketDbName).get();
      await snapshotTicket.forEach(doc => {
        if (type === 'user') {
          if (doc.data().issueUser === id) {
            if (doc.data().issueStatus !== 'closed') {
              logger.debug(`[${PREFIX}] Ticket data found!`);
              ticketData = doc.data();
              ticketFbid = doc.id;
            }
            if (doc.data().issueStatus === 'blocked') {
              logger.debug(`[${PREFIX}] User is blocked!`);
              ticketBlocked = true;
            }
          }
        }
        if (type === 'channel') {
          if (doc.data().issueThread === id) {
            if (doc.data().issueStatus !== 'closed') {
              logger.debug(`[${PREFIX}] Ticket data found!`);
              ticketData = doc.data();
              ticketFbid = doc.id;
            }
            if (doc.data().issueStatus === 'blocked') {
              logger.debug(`[${PREFIX}] User is blocked!`);
              ticketBlocked = true;
            }
          }
        }
      });
    }
    if (ticketBlocked) { ticketData = 'blocked'; }
    return [ticketData, ticketFbid];
  },
  setTicketInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.issueUsername}!`);

    const { db } = global;
    // logger.debug(`[${PREFIX}] fbid ${fbid}!`);

    if (fbid !== null && fbid !== undefined) {
      logger.debug(`[${PREFIX}] Updating ticket data`);
      try {
        await db.collection(firebaseTicketDbName).doc(fbid).set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating ticket data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating ticket data`);
      try {
        await db.collection(firebaseTicketDbName).doc().set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating ticket data: ${err}`);
      }
    }
  },
};
