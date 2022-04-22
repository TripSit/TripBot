const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const { getFirestore } = require('firebase-admin/firestore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chitragupta')
        .setDescription('Keep it positive please!'),

    async execute(interaction, actor, action, emoji, target) {
        logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

        if (actor === target) {
            return;
        }

        const db = getFirestore();

        logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);
        let actorData = {};
        let actorFBID = '';
        let targetData = {};
        let targetFBID = '';
        const snapshot = await db.collection('users').get();
        snapshot.forEach((doc) => {
            if (doc.data().discord_id === actor.id) {
                logger.debug(`[${PREFIX}] Found a actor match!`);
                // console.log(doc.id, '=>', doc.data());
                actorFBID = doc.id;
                logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
                actorData = doc.data();
            }
            if (doc.data().discord_id === target.id) {
                logger.debug(`[${PREFIX}] Found a target match!`);
                // console.log(doc.id, '=>', doc.data());
                targetFBID = doc.id;
                logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);
                targetData = doc.data();
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
                karma_given: { [emoji]: 1 },
            };
        }
        else {
            logger.debug(`[${PREFIX}] Found actor data, updating it`);
            // logger.debug(`[${PREFIX}] actorData: ${JSON.stringify(actorData, null, 2)}`);
            // logger.debug(`[${PREFIX}] Object.keys(actorData.karma_given): ${Object.keys(actorData.karma_given)}`);
            // // if emojis exists in actorData.karma_given, increment it
            // if (emoji in Object.keys(actorData.karma_given)) {
            //     logger.debug(`[${PREFIX}] actorData.karma_given[emoji]: ${actorData.karma_given[emoji]}`);
            //     actorData.karma_given[emoji] += 1;
            // }
            // // else create a new entry
            // else {
            //     logger.debug(`[${PREFIX}] actorData.karma_given[emoji]: ${actorData.karma_given[emoji]}`);
            //     actorData.karma_given[emoji] = 1;
            // }

            actorData.karma_given[emoji] = (actorData.karma_given[emoji] || 0) + action;
        }
        // logger.debug(`[${PREFIX}] actorData: ${JSON.stringify(actorData, null, 2)}`);
        logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);

        if (actorFBID !== '') {
            logger.debug(`[${PREFIX}] Updating actor data`);
            await db.collection('users').doc(actorFBID).set(actorData);
        }
        else {
            logger.debug(`[${PREFIX}] Creating actor data`);
            await db.collection('users').doc().set(actorData);
        }

        // Check if the target data exists, if not create a blank one
        if (Object.keys(targetData).length === 0) {
            logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
            targetData = {
                discord_username: target.username,
                discord_discriminator: target.discriminator,
                discord_id: target.id,
                isBanned: false,
                karma_recieved: { [emoji]: 1 },
            };
        }
        else {
            logger.debug(`[${PREFIX}] Found target data, updating it`);
            // logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 2)}`);
            targetData.karma_recieved[emoji] = (targetData.karma_recieved[emoji] || 0) + action;
        }
        // logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 2)}`);
        logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);

        if (targetFBID !== '') {
            logger.debug(`[${PREFIX}] Updating target data`);
            await db.collection('users').doc(targetFBID).set(targetData);
        }
        else {
            logger.debug(`[${PREFIX}] Creating target data`);
            await db.collection('users').doc().set(targetData);
        }
    },
};
