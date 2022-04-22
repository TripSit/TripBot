const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const { Octokit } = require('@octokit/rest');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;
// const channel_dev_id = process.env.channel_development;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Create issue on github')
        .addStringOption(option => option.setName('bug_report').setDescription('What do you want to tell the owner? Please be as detailed as possible!').setRequired(true)),

    async execute(interaction) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const report = interaction.options.getString('bug_report');

        const owner = 'TripSit';
        const repo = 'tripsit-discord-bot';
        const token = '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';

        const octokit = new Octokit({
            auth: token,
        });

        // Use octokit to create an issue
        octokit.rest.issues.create({
            owner,
            repo,
            title: `Bug report from ${username} in ${channel} on ${guild}`,
            body: `${report}`,
        }).then(() => {
            logger.info(`[${PREFIX}] Successfully created issue on ${owner}/${repo}`);
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Issue created!')
                .setDescription(`Your issue has been created on ${owner}/${repo}`);
            return interaction.reply({ embeds: [embed] });
        }).catch(err => {
            logger.error(`[${PREFIX}] Failed to create issue on ${owner}/${repo}`);
            logger.error(err);
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('Issue creation failed!')
                .setDescription(`Your issue could not be created on ${owner}/${repo}\n\n${err}`);
            return interaction.reply({ embeds: [embed] });
        });
    },
};

