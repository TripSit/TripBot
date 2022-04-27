const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const { getFirestore } = require('firebase-admin/firestore');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const users_db_name = process.env.users_db_name;
// const ts_icon_url = process.env.ts_icon_url;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('remindme')
        .setDescription('Set a reminder!')
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('How long?')
                .setRequired(true),
        )
        .addStringOption(option =>
            option.setName('units')
                .setDescription('What units?')
                .setRequired(true)
                .addChoice('Minutes', 'minute')
                .addChoice('Hours', 'hour')
                .addChoice('Days', 'day')
                .addChoice('Weeks', 'week')
                .addChoice('Months', 'month')
                .addChoice('Years', 'year'),
        )
        .addStringOption(option =>
            option.setName('reminder')
                .setDescription('What do you want to be reminded?')
                .setRequired(true),
        ),
    async execute(interaction) {
        const duration = interaction.options.getInteger('duration');
        const units = interaction.options.getString('units');
        const reminder = interaction.options.getString('reminder');
        const actor = interaction.user;

        const seconds = duration * (units === 'minute' ? 60 : units === 'hour' ? 3600 : units === 'day' ? 86400 : units === 'week' ? 604800 : units === 'month' ? 2592000 : units === 'year' ? 31536000 : 0);
        const unix_future_time = Math.floor(Date.now() / 1000) + seconds;

        let actorData = {};
        let actorFBID = '';
        global.user_db.forEach((doc) => {
            if (doc.data().discord_id === actor.id) {
                logger.debug(`[${PREFIX}] Found a actor match!`);
                // console.log(doc.id, '=>', doc.data());
                actorFBID = doc.id;
                logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
                actorData = doc.data();
            }
        });

        // Check if the actor data exists, if not create a blank one
        if (Object.keys(actorData).length === 0) {
            logger.debug(`[${PREFIX}] No actor data found, creating a blank one`);
            actorFBID = actor.id;
            actorData = {
                discord_username: actor.username,
                discord_discriminator: actor.discriminator,
                discord_id: actor.id,
                isBanned: false,
                reminders: { [unix_future_time]: reminder },
            };
        }
        else {
            logger.debug(`[${PREFIX}] Found actor data, updating it`);
            if ('reminders' in actorData) {
                actorData.reminders[unix_future_time] = reminder;
            }
            else {
                actorData.reminders = { [unix_future_time]: reminder };
            }
        }
        logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
        // Update firebase
        logger.debug(`[${PREFIX}] Updating firebase`);
        const db = getFirestore();
        await db.collection(users_db_name).doc(actorFBID).update({
            reminders: actorData.reminders,
        });
        // Update global db
        // global.user_db.forEach((doc) => {
        //     if (doc.id === actorFBID) {
        //         logger.debug(`[${PREFIX}] Updating global DB!!`);
        //         logger.debug(`[${PREFIX}] All reminders ${JSON.stringify(doc.data().reminders, null, 2)}`);
        //         logger.debug(`[${PREFIX}] actorData.reminders ${JSON.stringify(actorData.reminders, null, 2)}`);
        //         doc.data().reminders = actorData.reminders;
        //         logger.debug(`[${PREFIX}] New all reminders ${JSON.stringify(doc.data().reminders, null, 2)}`);
        //     }
        // });
        global.user_db = await db.collection(users_db_name).get();

        const embed = new MessageEmbed()
            .setColor('RANDOM')
            // .setTitle(`${JSON.stringify(actorData, null, 2)}`)
            .setDescription(`In ${duration} ${units} I will remind you: ${reminder}`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
