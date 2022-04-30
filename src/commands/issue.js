const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const { Octokit } = require('@octokit/rest');
const template = require('../utils/embed_template');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Create issue on github')
        .addStringOption(option => option.setName('bug_report').setDescription('What do you want to tell the owner? Please be as detailed as possible!').setRequired(true)),

    async execute(interaction) {
        const report = interaction.options.getString('bug_report');

        const owner = 'TripSit';
        const repo = 'tripsit-discord-bot';
        const token = GITHUB_TOKEN;

        const octokit = new Octokit({
            auth: token,
        });

        // Use octokit to create an issue
        octokit.rest.issues.create({
            owner,
            repo,
            title: report,
        }).then(() => {
            logger.info(`[${PREFIX}] Successfully created issue on ${owner}/${repo}`);
            const embed = template.embed_template()
                .setColor('#0099ff')
                .setTitle('Issue created!')
                .setDescription(`Your issue has been created on ${owner}/${repo}`);
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }).catch(err => {
            logger.error(`[${PREFIX}] Failed to create issue on ${owner}/${repo}`);
            logger.error(err);
            const embed = template.embed_template()
                .setColor('#ff0000')
                .setTitle('Issue creation failed!')
                .setDescription(`Your issue could not be created on ${owner}/${repo}\n\n${err}`);
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`[${PREFIX}] finished!`);
            return;
        });
    },
};

