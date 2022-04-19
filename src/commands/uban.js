const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const fs = require('fs');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const TS_ICON = process.env.TS_ICON;

const db_name = 'ts_data.json';
const rawdata = fs.readFileSync(`./src/data/${db_name}`);
const ts_data = JSON.parse(rawdata);
const blacklist_users = ts_data.blacklist.users;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uban')
        .setDescription('Bans a user from the bot')
        .addStringOption(option => option.setName('user').setDescription('The user to ban')),
    async execute(interaction, logger) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const userID = interaction.options.getString('user');
        logger.debug(`[${PREFIX}] userID: ${userID}`);

        // if userID is not in black_list users, add it, and save the new json file
        if (!blacklist_users.includes(userID)) {
            blacklist_users.push(userID);
            logger.debug(`[${PREFIX}] blacklist_users: ${blacklist_users}`);
            ts_data.blacklist.users = blacklist_users;
            fs.writeFileSync(`./src/data/${db_name}`, JSON.stringify(ts_data));
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: TS_ICON, url: 'http://www.tripsit.me' })
                .setColor('RED')
                .setTitle('User Banned')
                .addFields(
                    { name: 'User ID', value: userID },
                );
            return interaction.reply({ embeds: [embed] });
        }

        if (blacklist_users.includes(userID)) {
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: TS_ICON, url: 'http://www.tripsit.me' })
                .setColor('GREEN')
                .setTitle('User Already Banned')
                .addFields(
                    { name: 'User ID', value: userID },
                );
            return interaction.reply({ embeds: [embed] });
        }
    },
};
