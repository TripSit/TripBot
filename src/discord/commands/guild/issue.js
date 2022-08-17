'use strict';

const PREFIX = require('path').parse(__filename).name;
const {
  SlashCommandBuilder,
} = require('discord.js');
const { Octokit } = require('@octokit/rest');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const { githubToken } = require('../../../../env');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('issue')
    .setDescription('Create issue on github')
    .addStringOption(option => option
      .setDescription('What is the title of the issue? Please be as detailed as possible!')
      .setRequired(true)
      .setName('bug_report'))
    .addStringOption(option => option
      .setDescription('How much effort will this take?')
      .addChoices(
        { name: 'High', value: 'High' },
        { name: 'Medium', value: 'Medium' },
        { name: 'Low', value: 'Low' },
        { name: 'Trivial', value: 'Trivial' },
      )
      .setName('effort'))
    .addStringOption(option => option
      .setDescription('How important is this?')
      .addChoices(
        { name: 'High', value: 'High' },
        { name: 'Medium', value: 'Medium' },
        { name: 'Low', value: 'Low' },
      )
      .setName('priority'))
    .addStringOption(option => option
      .setDescription('What type of issue is this?')
      .addChoices(
        { name: 'Bug', value: 'Bug' },
        { name: 'Feature', value: 'Feature' },
        { name: 'Enhancement', value: 'Enhancement' },
        { name: 'Help Needed', value: 'Help Needed' },
        { name: 'Idea', value: 'Idea' },
        { name: 'Question', value: 'Question' },
      )
      .setName('type')),
  async execute(interaction) {
    const sentByOwner = interaction.user === interaction.client.owner;
    const title = interaction.options.getString('bug_report');
    const owner = 'TripSit';
    const repo = 'tripsit-discord-bot';
    const octokit = new Octokit({ auth: githubToken });

    // Use octokit to create an issue
    await octokit.rest.issues.create({ owner, repo, title })
      .then(async response => {
        const issueNumber = response.data.number;
        octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: issueNumber,
          labels: [
            `Effort: ${interaction.options.getString('effort')}`,
            `Priority: ${interaction.options.getString('priority')}`,
            `Type: ${interaction.options.getString('type')}`,
            `Status: ${sentByOwner ? 'Status: Confirmed' : 'Status: Review Needed'}`,
          ],
        });
        const issueUrl = response.data.html_url;
        const embed = template.embedTemplate()
          .setColor(0x0099ff)
          .setTitle('Issue created!')
          .setDescription(stripIndents`\
          Issue #${issueNumber} created on ${owner}/${repo}
          Click here to view: ${issueUrl}`);
        interaction.reply({ embeds: [embed], ephemeral: true });
      })
      .catch(ex => {
        logger.error(`[${PREFIX}] Failed to create issue on ${owner}/${repo}`, ex);
        const embed = template.embedTemplate()
          .setColor(0xff0000)
          .setTitle('Issue creation failed!')
          .setDescription(`Your issue could not be created on ${owner}/${repo}\n\n${ex}`);
        interaction.reply({ embeds: [embed], ephemeral: false });
        return Promise.reject(ex);
      });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
