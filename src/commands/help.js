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
*about:* Shows information about this bot.\n\
*contact:* Show information on how to contact TripSit.\n\
*info (Drug) (Summary|Dosage|Combos):* Displays drug information\n\
*combo (Drug) (Drug):* Shows combo information between two substances\n\
*breathe (1|2):* Breathing exercises in the air\n\
*hydrate:* Reminder to hydrate!\n\
*kipp:* Reminder to keep it positive please!\n\
*topic:* Displays a random topic question\n\
*idose:* (PM ONLY) Allows the user to record when they dosed a substance\n\
\n\
**Tripsit-Only Commands**\n\
*tripsit (Member) (On|Off):* This will remove all roles from a user and add the NeedsHelp role, basically forcing the user into the #tripsit channel.\n\
*tripsitme:* This is a button in the #tripsit room that will start a new thread in #tripsit to discuss your trip\n\
*karma (Member):* This records the reactions (emojis) given and received, and displays the history of each user\n';

        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle('TripBot Help')
            .setDescription(help_text);
        return interaction.reply({ embeds: [embed] });
    },
};
