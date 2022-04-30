const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const db = global.db;
const users_db_name = process.env.users_db_name;
const timezones = JSON.parse(fs.readFileSync('./src/assets/timezones.json'));
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const ts_flame_url = process.env.ts_flame_url;
// const snapshot = global.user_db;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('Get the time of another user!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your own timezone')
                .addStringOption(option => option
                    .setName('timezone')
                    .setDescription('Timezone value')
                    .setRequired(true)
                    .setAutocomplete(true),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Get someone\'s time!')
                .addUserOption(option => option.setName('user').setDescription('User to lookup!')),
        ),
    async execute(interaction) {
        const timezone = interaction.options.getString('timezone');
        const target = interaction.options.getMember('user');
        const actor = interaction.user;
        const command = interaction.options.getSubcommand();

        if (command == 'set') {
            logger.debug(`${PREFIX} time: ${timezone}`);
            // define offset as the value from the timezones array
            let tzCode = '';
            for (let i = 0; i < timezones.length; i++) {
                if (timezones[i].label === timezone) {
                    tzCode = timezones[i].tzCode;
                    logger.debug(`${PREFIX} tzCode: ${tzCode}`);
                }
            }
            // logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);
            let actorData = {};
            let actorFBID = '';
            const snapshot = global.user_db;
            snapshot.forEach((doc) => {
                if (doc.value.discord_id === actor.id) {
                    // logger.debug(`[${PREFIX}] Found a actor match!`);
                    // console.log(doc.id, '=>', doc.value);
                    actorFBID = doc.key;
                    logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
                    actorData = doc.value;
                }
            });

            if ('timezone' in actorData) {
                if (actorData.timezone == tzCode) {
                    const embed = new MessageEmbed()
                        .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
                        .setColor('RANDOM')
                        .setDescription(`${timezone} already is your timezone, you don't need to update it!`)
                        .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
                    interaction.reply({ embeds: [embed], ephemeral: true });
                    logger.debug(`[${PREFIX}] Done!!`);
                    return;
                }
            }

            // Check if the actor data exists, if not create a blank one
            if (Object.keys(actorData).length === 0) {
                // logger.debug(`[${PREFIX}] No actor data found, creating a blank one`);
                actorData = {
                    discord_username: actor.username,
                    discord_discriminator: actor.discriminator,
                    discord_id: actor.id,
                    isBanned: false,
                    timezone: tzCode,
                };
            }

            actorData['timezone'] = tzCode;

            if (actorFBID !== '') {
                logger.debug(`[${PREFIX}] Updating actor data`);
                try {
                    await db.collection(users_db_name).doc(actorFBID).set(actorData);
                }
                catch (err) {
                    logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
                }
            }
            else {
                logger.debug(`[${PREFIX}] Creating actor data`);
                try {
                    await db.collection(users_db_name).doc().set(actorData);
                }
                catch (err) {
                    logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
                }
            }
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
                .setColor('RANDOM')
                .setDescription(`I set your timezone to ${timezone}`)
                .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
            interaction.reply({ embeds: [embed], ephemeral: true });
            logger.debug(`[${PREFIX}] Done!!`);
            return;
        }
        if (command == 'get') {
            let tzCode = '';
            const snapshot = global.user_db;
            snapshot.forEach((doc) => {
                if (doc.value.discord_id === target.id) {
                    tzCode = doc.value.timezone;
                }
            });

            // Check if the target data exists, if not create a blank one
            if (!tzCode) {
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
                    .setColor('RANDOM')
                    .setDescription(`${target.user.username} is a timeless treasure <3 (and has not set a time zone)`)
                    .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
                interaction.reply({ embeds: [embed], ephemeral: false });
                logger.debug(`[${PREFIX}] Done!!`);
                return;
            }

            // get the user's timezone from the database
            const time_string = new Date().toLocaleTimeString('en-US', { timeZone: tzCode });
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
                .setColor('RANDOM')
                .setDescription(`It is likely ${time_string} wherever ${target.user.username} is located.`)
                .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }
    },
};
