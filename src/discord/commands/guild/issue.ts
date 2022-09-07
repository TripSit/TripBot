import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../utils/commandDef';
import logger from '../../../global/utils/logger';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import env from '../../../global/utils/env.config';
import {Octokit} from 'octokit';

const PREFIX = require('path').parse(__filename).name;

export const issue: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('issue')
      .setDescription('Create issue on github')
      .addStringOption((option) => option
          .setDescription('What type of issue is this?')
          .addChoices(
              {name: 'Bug/Problem', value: 'Bug'},
              {name: 'Feature Request', value: 'Feature'},
              {name: 'Enhancement', value: 'Enhancement'},
              {name: 'Idea', value: 'Idea'},
              {name: 'Question', value: 'Question'},
          )
          .setRequired(true)
          .setName('type'))
      .addStringOption((option) => option
          .setDescription('How important is this?')
          .addChoices(
              {name: 'Critical', value: 'P0: Critical'},
              {name: 'High', value: 'P1: High'},
              {name: 'Medium', value: 'P2: Medium'},
              {name: 'Low', value: 'P3: Low'},
          )
          .setName('priority'))
      .addStringOption((option) => option
          .setDescription('How much effort will this take?')
          .addChoices(
              {name: 'High', value: 'E0: High'},
              {name: 'Medium', value: 'E1: Medium'},
              {name: 'Low', value: 'E2: Low'},
              {name: 'Trivial', value: 'E3: Trivial'},
          )
          .setName('effort')),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] starting!`);
    // Create the modal
    const modal = new ModalBuilder()
        .setCustomId('issueModal')
        .setTitle('TripBot Issue Creation');
    // An action row only holds one text input, so you need one action row per text input.
    const title = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Issue Title')
        .setPlaceholder('Sumarize the issue here!')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setCustomId('issueTitle'));
    const body = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Issue Body')
        .setPlaceholder(
            'Please describe the issue in detail! Include steps to reproduce, any specific circumstances, etc.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        // eslint-disable-next-line max-len
        .setCustomId(`${interaction.options.getString('type')},${interaction.options.getString('priority')},${interaction.options.getString('effort')},S0: Review Needed`));
    // Add inputs to the modal
    modal.addComponents([title, body]);
    // Show the modal to the user
    await interaction.showModal(modal);
    logger.debug(`[${PREFIX}] displayed modal!`);
  },
  async submit(interaction) {
    logger.debug(`[${PREFIX}] submitted!`);
    const sentByOwner = interaction.user === interaction.client.application!.owner;
    // @ts-ignore
    let issueBody = interaction.components[1].components[0].value;
    if (sentByOwner) {
      issueBody += `This issue was submitted by ${interaction.member} in ${interaction.guild}`;
    }
    logger.debug(`[${PREFIX}] issueBody: ${JSON.stringify(issueBody, null, 2)}`);

    // @ts-ignore
    const labels = interaction.components[1].components[0].customId.split(',');
    const filteredLabels = labels.filter((label:string) => label !== 'null');

    // Use octokit to create an issue
    const owner = 'TripSit';
    const repo = 'tripsit-discord-bot';
    const octokit = new Octokit({auth: env.GITHUB_TOKEN});
    await octokit.rest.issues.create({
      owner,
      repo,
      title: interaction.fields.getTextInputValue('issueTitle'),
      body: issueBody,
    })
        .then(async (response) => {
          const issueNumber = response.data.number;
          octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: issueNumber,
            labels: filteredLabels,
          });
          const issueUrl = response.data.html_url;
          const embed = embedTemplate()
              .setColor(0x0099ff)
              .setTitle('Issue created!')
              .setDescription(stripIndents`\
          Issue #${issueNumber} created on ${owner}/${repo}
          Click here to view: ${issueUrl}`);
          interaction.reply({embeds: [embed], ephemeral: true});
        })
        .catch((error:Error) => {
          logger.error(`[${PREFIX}] Failed to create issue on ${owner}/${repo}\n\n${error}`);
          const embed = embedTemplate()
              .setColor(0xff0000)
              .setTitle('Issue creation failed!')
              .setDescription(`Your issue could not be created on ${owner}/${repo}\n\n${error}`);
          interaction.reply({embeds: [embed], ephemeral: false});
          return Promise.reject(error);
        });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
