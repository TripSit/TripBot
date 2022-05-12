'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Octokit } = require('@octokit/rest');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;
const { GITHUB_TOKEN } = process.env;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('issue')
    .setDescription('Create issue on github')
    .addStringOption(option => option
      .setName('bug_report')
      .setDescription('What do you want to tell the owner? Please be as detailed as possible!')
      .setRequired(true)),

  async execute(interaction) {
    const title = interaction.options.getString('bug_report');
    const owner = 'TripSit';
    const repo = 'tripsit-discord-bot';
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    // Use octokit to create an issue
    await octokit.rest.issues.create({ owner, repo, title }).catch(ex => {
      logger.error(`[${PREFIX}] Failed to create issue on ${owner}/${repo}`, ex);
      const embed = template.embedTemplate()
        .setColor('#ff0000')
        .setTitle('Issue creation failed!')
        .setDescription(`Your issue could not be created on ${owner}/${repo}\n\n${ex}`);
      interaction.reply({ embeds: [embed], ephemeral: false });
      return Promise.reject(ex);
    });

    const embed = template.embedTemplate()
      .setColor('#0099ff')
      .setTitle('Issue created!')
      .setDescription(`Your issue has been created on ${owner}/${repo}`);
    interaction.reply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
