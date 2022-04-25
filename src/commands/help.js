const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Information bout TripBot Commands'),
    async execute(interaction) {
        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle('TripBot Help')
            .addFields(
                { name: 'About', value: 'Information on Team TripSit and who built this bot.' },
                { name: 'Contact', value: 'How to contact Team TripSit and the bot builder.' },
                { name: 'Help', value: 'Information on all commands, you\'re here now!' },
                { name: 'Info', value: 'This command looks up drug information!' },
                { name: 'EMS', value: 'Displays emergency medical service information' },
                { name: 'Combo', value: 'Checks the interactions between two drugs.' },
                { name: 'iDose', value: 'This command can be used to remind yourself when you lasted consumed.' },
                { name: 'DXM Calc', value: 'Use this to calculate dxm dosages' },
                { name: 'Benzo Calc', value: 'Calculate dosages between benzos' },
                { name: 'Breathe', value: 'Remind people to breathe.' },
                { name: 'Hydrate', value: 'Covert others to the hydro homie cause' },
                { name: 'KIPP', value: 'Keep It Positive Please!' },
                { name: 'Triptoys', value: 'Cool toys to play with!' },
                { name: 'Topic', value: 'Displays a random topic' },
                { name: 'Bug', value: 'Sends a message to the development room on the TripSit server. ALL FEEDBACK WELCOME!' },
                { name: 'Remindme', value: 'TripSit Only - Sends a reminder in PM after a specified duration' },
                { name: 'Karma', value: 'TripSit Only - Keeps track of karma (reactions) given and received.' },
                { name: 'Mod', value: 'TripSit Only - Applies mod actions on a user.' },
                { name: 'Report', value: 'TripSit Only - Allows users to report someone to the TripSit Team.' },
            );
        interaction.reply({ embeds: [embed], ephemeral: false });
        logger.debug(`${PREFIX} finished!`);
        return;
    },
};
