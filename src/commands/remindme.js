const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
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

        const reminder_cache = JSON.parse(fs.readFileSync('./src/assets/reminders.json'));

        let actorData = {};
        let actorDBID = 0;
        // For the keys in reminder_cache, check if the actor is in the key
        for (const key in reminder_cache) {
            if (key == actor.id) {
                actorData = reminder_cache[key];
                actorDBID = key;
            }
        }

        // Check if the actor data exists, if not create a blank one
        if (Object.keys(actorData).length === 0) {
            logger.debug(`[${PREFIX}] No actor data found, creating a blank one`);
            actorDBID = actor.id;
            actorData = {
                discord_username: actor.username,
                discord_discriminator: actor.discriminator,
                discord_id: actor.id,
                isBanned: false,
                reminders: { [unix_future_time]: reminder },
            };
            // reminder_cache[actorDBID] = actorData;
        }
        else {
            logger.debug(`[${PREFIX}] Found actor data, updating it`);
            if ('reminders' in actorData) {
                actorData.reminders[unix_future_time] = reminder;
                // reminder_cache[actorDBID] = actorData;
            }
            else {
                actorData.reminders = { [unix_future_time]: reminder };
                // reminder_cache[actorDBID] = actorData;
            }
        }
        logger.debug(`[${PREFIX}] actorDBID: ${actorDBID}`);
        // logger.debug(`[${PREFIX}] actorData: ${JSON.stringify(actorData, null, 2)}`);
        reminder_cache[`${actorDBID}`] = actorData;

        // logger.debug(`[${PREFIX}] Updating actor data`);
        // logger.debug(`[${PREFIX}] actorData: ${JSON.stringify(actorData, null, 2)}`);
        // logger.debug(`[${PREFIX}] reminder_cache: ${JSON.stringify(reminder_cache, null, 2)}`);
        fs.writeFileSync('./src/assets/reminders.json', JSON.stringify(reminder_cache, null, 2));

        const embed = new MessageEmbed()
            .setColor('RANDOM')
            // .setTitle(`${JSON.stringify(actorData, null, 2)}`)
            .setDescription(`In ${duration} ${units} I will remind you: ${reminder}`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`${PREFIX} finished!`);
        return;
    },
};
