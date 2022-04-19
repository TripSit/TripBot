const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { TS_ICON, DISCLAIMER } = require('../data/config.json');

const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('contact')
        .setDescription('How to contact TripSit!'),
    async execute(interaction, logger) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);
        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me', iconURL: TS_ICON, url: 'http://www.tripsit.me' })
            .setColor('DARK_BLUE')
            .setTitle('Contact TripSit')
            .setURL('https://tripsit.me/contact-us/')
            .setDescription('This app is created by TripSit, an organisation which helps to provide factual information about \
            drugs and how to reduce the harms involved in using them.')
            .addFields(
                { name: 'IRC', value: '[Webchat](http://chat.tripsit.me)' },
                { name: 'Discord', value: '[Join our discord](http://discord.gg/TripSit)' },
                { name: 'Bot Issues Email', value: 'discord_bot @ tripsit (dot) me' },
                { name: 'Drug Information Issues Email', value: 'content @ tripsit (dot) me' },
            )
            .setFooter({ text: DISCLAIMER, iconURL: TS_ICON });
        return interaction.reply({ embeds: [embed] });
    },
};
