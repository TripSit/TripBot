const { SlashCommandBuilder } = require('@discordjs/builders');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../utils/logger.js');
const template = require('../../utils/embed_template');
const db = global.db;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const users_db_name = process.env.users_db_name;

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
            if (doc.value.discord_id === actor.id) {
                logger.debug(`[${PREFIX}] Found a actor match!`);
                // console.log(doc.id, '=>', doc.value);
                actorFBID = doc.key;
                logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
                actorData = doc.value;
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
        await db.collection(users_db_name).doc(actorFBID).update({
            reminders: actorData.reminders,
        });
        // Update global db
        global.user_db.forEach((doc) => {
            if (doc.key === actorFBID) {
                logger.debug(`[${PREFIX}] Updating global DB!!`);
                logger.debug(`[${PREFIX}] All reminders ${JSON.stringify(doc.value.reminders, null, 2)}`);
                logger.debug(`[${PREFIX}] actorData.reminders ${JSON.stringify(actorData.reminders, null, 2)}`);
                doc.value.reminders = actorData.reminders;
                logger.debug(`[${PREFIX}] New all reminders ${JSON.stringify(doc.value.reminders, null, 2)}`);
            }
        });

        const embed = template.embed_template()
            .setDescription(`In ${duration} ${units} I will remind you: ${reminder}`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
