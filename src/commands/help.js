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
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const help_text = '**Global Commands**\n\
*topic:* Displays a random topic question\n\
\n\
**Tripsit-Only Commands**\n\
*tripsit (Member) (On|Off):* This will remove all roles from a user and add the NeedsHelp role, basically forcing the user into the #tripsit channel.\n\
*tripsitme:* This is a button in the #tripsit room that will start a new thread in #tripsit to discuss your trip\n\
*karma (Member):* This records the reactions (emojis) given and received, and displays the history of each user\n';

        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle('TripBot Help')
            .setDescription(help_text)
            .addFields(
                { name: 'About', value: 'Information on Team TripSit and who built this bot.', inline: true },
                { name: 'Contact', value: 'How to contact Team TripSit and the bot builder.', inline: true },
                { name: 'Help', value: 'Information on all commands, you\'re here now!', inline: true },
            )
            .addFields(
                { name: 'Info', value: 'This command looks up drug information!', inline: true },
                { name: 'Combo', value: 'Checks the interactions between two drugs.', inline: true },
                { name: 'iDose', value: 'This command can be used to remind yourself when you lasted consumed.', inline: true },
            )
            .addFields(
                { name: 'Breathe', value: 'Remind people to breathe.', inline: true },
                { name: 'Hydrate', value: 'Covert others to the hydro homie cause', inline: true },
                { name: 'KIPP', value: 'Keep It Positive Please!', inline: true },
            )
            .addFields(
                { name: 'Topic', value: 'Displays a random topic', inline: true },
                { name: 'Bug', value: 'Sends a message to the development room on the TripSit server', inline: true },
            )
            .addFields(
                { name: 'Karma', value: 'TripSit Only - Keeps track of karma (reactions) given and received.', inline: true },
                { name: 'Mod', value: 'TripSit Only - Applies mod actions on a user.', inline: true },
                { name: 'Report', value: 'TripSit Only - Allows users to report someone to the TripSit Team.', inline: true },
            );
        return interaction.reply({ embeds: [embed] });
    },
};
