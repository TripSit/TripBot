const PREFIX = require('path').parse(__filename).name;
// const { getFirestore } = require('firebase-admin/firestore');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const guild_id = process.env.guildId;
const ts_icon_url = process.env.ts_icon_url;
const ts_flame_url = process.env.ts_flame_url;
const welcome_channel_id = process.env.channel_welcome;

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        logger.debug(`[${PREFIX}] guildMemberRemove`);
        // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);
        if (member.guild.id === guild_id) {
            console.log(member.joinedTimestamp);
            console.log(Date.now());
            // display the difference between the two dates
            const diff = Math.abs(Date.now() - member.joinedTimestamp);
            const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
            const months = Math.floor((diff / (1000 * 60 * 60 * 24 * 30)) % 12);
            const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            // logger.debug(`[${PREFIX}] diff: ${diff}`);
            // logger.debug(`[${PREFIX}] years: ${years}`);
            // logger.debug(`[${PREFIX}] months: ${months}`);
            // logger.debug(`[${PREFIX}] weeks: ${weeks}`);
            // logger.debug(`[${PREFIX}] days: ${days}`);
            // logger.debug(`[${PREFIX}] hours: ${hours}`);
            // logger.debug(`[${PREFIX}] minutes: ${minutes}`);
            // logger.debug(`[${PREFIX}] seconds: ${seconds}`);
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                .setColor('BLUE')
                .setDescription(`${member} has left the network after\
                ${years > 0 ? `${years} years` : ''}\
                ${years == 0 && months > 0 ? `${months} months` : ''}\
                ${months == 0 && weeks > 0 ? `${weeks} weeks` : ''}\
                ${weeks == 0 && days > 0 ? `${days} days` : ''}\
                ${days == 0 && hours > 0 ? `${hours} hours` : ''}\
                ${hours == 0 && minutes > 0 ? `${minutes} minutes` : ''}\
                ${minutes == 0 && seconds > 0 ? `${seconds} seconds` : ''}`)
                .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
            const welcome_channel = member.client.channels.cache.get(welcome_channel_id);
            welcome_channel.send({ embeds: [embed] });
        }
    },
};
