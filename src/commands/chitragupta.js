const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const users_db_name = process.env.users_db_name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chitragupta')
        .setDescription('Keep it positive please!'),

    async execute(interaction, actor, action, emoji, target) {
        logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

        if (actor === target) {return;}

        // logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);
        let actorData = {};
        let actorFBID = '';

        const snapshot = global.user_db;
        snapshot.forEach((doc) => {
            // logger.debug(`[${PREFIX}] doc: ${JSON.stringify(doc, null, 2)}`);
            if (doc.value.discord_id === actor.id) {
                logger.debug(`[${PREFIX}] Found a actor match!`);
                actorFBID = doc.key;
                logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
                actorData = doc.value;
            }
        });

        // Check if the actor data exists, if not create a blank one
        if (Object.keys(actorData).length === 0) {
            logger.debug(`[${PREFIX}] No actor data found, creating a blank one`);
            actorData = {
                discord_username: actor.username,
                discord_discriminator: actor.discriminator,
                discord_id: actor.id,
                isBanned: false,
                karma_given: { [emoji]: action },
            };
        }

        if ('karma_given' in actorData) {
            logger.debug(`[${PREFIX}] Updating karma_given info!`);
            actorData.karma_given[emoji] = (actorData.karma_given[emoji] || 0) + action;
        }
        else {
            logger.debug(`[${PREFIX}] Creating karma_given info!`);
            actorData.karma_given = { [emoji]: action };
        }

        if (actorFBID !== '') {
            logger.debug(`[${PREFIX}] Updating actor data in firebase`);
            await db.collection(users_db_name).doc(actorFBID).set(actorData);
        }
        else {
            logger.debug(`[${PREFIX}] Creating actor data in firebase`);
            await db.collection(users_db_name).doc().set(actorData);
        }

        let targetData = {};
        let targetFBID = '';
        snapshot.forEach((doc) => {
            if (doc.value.discord_id === target.id) {
                logger.debug(`[${PREFIX}] Found a target match!`);
                targetFBID = doc.key;
                logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);
                targetData = doc.value;
            }
        });

        // Check if the target data exists, if not create a blank one
        if (Object.keys(targetData).length === 0) {
            logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
            targetData = {
                discord_username: target.username,
                discord_discriminator: target.discriminator,
                discord_id: target.id,
                isBanned: false,
                karma_recieved: { [emoji]: action },
            };
        }

        if ('karma_recieved' in targetData) {
            logger.debug(`[${PREFIX}] Updating karma_recieved info!`);
            targetData.karma_recieved[emoji] = (targetData.karma_recieved[emoji] || 0) + action;
        }
        else {
            logger.debug(`[${PREFIX}] Creating karma_given info!`);
            targetData.karma_recieved = { [emoji]: action };
        }

        if (targetFBID !== '') {
            logger.debug(`[${PREFIX}] Updating target data in firebase`);
            await db.collection(users_db_name).doc(targetFBID).set(targetData);
        }
        else {
            logger.debug(`[${PREFIX}] Creating target data in firebase`);
            await db.collection(users_db_name).doc().set(targetData);
        }
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
