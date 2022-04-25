const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const channel_dev_id = process.env.channel_development;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bug')
        .setDescription('Report a bug to the bot owner')
        .addStringOption(option => option.setName('bug_report').setDescription('What do you want to tell the owner? Please be as detailed as possible!').setRequired(true)),

    async execute(interaction) {
        const username = `${interaction.user.username}#${interaction.user.discriminator}`;
        const guild_message = `${interaction.guild.name ? ` in ${interaction.guild.name}` : 'DM'}`;

        const bug_report = interaction.options.getString('bug_report');
        logger.debug(`[${PREFIX}] bug_report: ${bug_report}`);

        const bot_owner = interaction.client.users.cache.get(process.env.ownerId);

        logger.debug(`[${PREFIX}] channel_dev_id: ${channel_dev_id}`);
        const dev_chan = interaction.client.channels.cache.get(channel_dev_id);
        const dev_embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setDescription(`Hey ${bot_owner.toString()},\n${username}${guild_message} reports:\n${bug_report}`)
            .setFooter({ text: 'Good luck!' });
        dev_chan.send({ embeds: [dev_embed] });

        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle('Thank you!')
            .setDescription('I\'ve submitted this feedback to the bot owner. \n\nYou\'re more than welcome to join the TripSit server and speak to Moonbear directly if you want! Check the /contact command for more info.');
        interaction.reply({ embeds: [embed], ephemeral: false });
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
