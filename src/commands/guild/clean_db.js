const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed_template');
const db = global.db;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clean_db')
        .setDescription('Clean the DB!'),
    async execute(interaction) {
        const users = await db.collection('users').get();
        // This command will check for duplicates within the database and merge them
        // This is a very slow command and should be run sparingly
        users.forEach(async (user) => {
            const user_key = user.id;
            const user_value = user.data();
            const user_id = user_value.discord_id;
            if (user_id !== '177537158419054592') {
                return;
            }
            logger.debug(`${PREFIX}: Checking user ${user_id}`);
            const user_kg = user_value.karma_given;
            const user_kr = user_value.karma_received;
            const user_reminders = user_value.reminders;
            let user_timezone = user_value.timezone;
            const dupe_user_db = [];
            users.forEach((sub_user) => {
                const sub_user_key = sub_user.id;
                const sub_user_value = sub_user.data();
                if (sub_user_value.discord_id == user_id) {
                    logger.debug(`${PREFIX}: ${sub_user_value.discord_username} has a dupe!`);
                    dupe_user_db.push({
                        sub_user_key,
                        sub_user_value,
                    });
                }
            });
            logger.debug(`${PREFIX}: ${dupe_user_db.length} dupe(s) found for ${user_value.discord_username}`);
            if (dupe_user_db.length > 1) {
                dupe_user_db.forEach((dupe_user) => {
                    const dupe_user_key = dupe_user.sub_user_key;
                    const dupe_user_value = dupe_user.sub_user_value;
                    const dupe_user_kg = dupe_user_value.karma_given;
                    const dupe_user_kr = dupe_user_value.karma_received;
                    const dupe_user_reminders = dupe_user_value.reminders;
                    const dupe_user_timezone = dupe_user_value.timezone;
                    if (dupe_user_kg != user_kg && dupe_user_kg != undefined) {
                        logger.debug(`[${PREFIX}] Karma Given is different, updating...`);
                        // Loop through the keys in dupe_user_kg and add them to user_kg
                        Object.keys(dupe_user_kg).forEach((key) => {
                            if (user_kg[key] == undefined) {
                                user_kg[key] = dupe_user_kg[key];
                            }
                            else {
                                user_kg[key] += dupe_user_kg[key];
                            }
                        });
                    }
                    if (dupe_user_kr != user_kr && dupe_user_kr != undefined) {
                        logger.debug(`[${PREFIX}] Karma Recieved is different, updating...`);
                        // Loop through the keys in dupe_user_kr and add them to user_kr
                        Object.keys(dupe_user_kr).forEach((key) => {
                            if (user_kr[key] == undefined) {
                                user_kr[key] = dupe_user_kr[key];
                            }
                            else {
                                user_kr[key] += dupe_user_kr[key];
                            }
                        });
                    }
                    if (dupe_user_reminders != user_reminders) {
                        logger.debug(`[${PREFIX}] Reminders are different, updating...`);
                        // Loop through the keys in dupe_user_reminders and add them to user_reminders
                        Object.keys(dupe_user_reminders).forEach((key) => {
                            if (user_reminders[key] == undefined) {
                                user_reminders[key] = dupe_user_reminders[key];
                            }
                            else {
                                user_reminders[key] += dupe_user_reminders[key];
                            }
                        });
                    }
                    if (dupe_user_timezone != user_timezone) {
                        logger.debug(`[${PREFIX}] Timezone is different, updating...`);
                        user_timezone = dupe_user_timezone;
                    }
                    if (dupe_user_key !== user_key) {
                        logger.debug(`[${PREFIX}] Removing ${dupe_user_value.discord_username} from the database...`);
                        // db.collection('users').doc(dupe_user_key).delete();
                    }
                });
                logger.debug(`[${PREFIX}] Updating ${user_value.discord_username} in the database...`);
                db.collection('users').doc(user_key).set({
                    discord_id: user_id,
                    discord_username: user_value.discord_username,
                    discord_discriminator: user_value.discord_discriminator,
                    karma_given: user_kg ? user_kg : {},
                    karma_received: user_kr ? user_kr : {},
                    reminders: user_reminders ? user_reminders : {},
                    timezone: user_timezone ? user_timezone : '',
                });
                return;
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
        //                 karma_received: wrong_doc.data().karma_received ? wrong_doc.data().karma_received : {},
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


        const embed = template.embed_template()
            .setTitle('Done!');
        logger.debug(`[${PREFIX}] finished!`);
        interaction.reply({ embeds: [embed], ephemeral: false });
        return;
    },
};
