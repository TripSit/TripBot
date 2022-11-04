import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalSubmitInteraction,
  GuildMember,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import env from '../../../global/utils/env.config';
import {SlashCommand} from '../../@types/commandDef';
import {issue} from '../../../global/commands/g.issue';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dIssue: SlashCommand = {
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
      .setCustomId(`issueModal~${interaction.id}`)
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

    // Collect a modal submit interaction
    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.startsWith(`issueModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (i) => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        logger.debug(`[${PREFIX}] submitted!`);

        // @ts-ignore https://discord.js.org/#/docs/discord.js/14.6.0/typedef/ModalData
        let issueBody = i.components[1].components[0].value;

        logger.debug(`[${PREFIX}] i.user: ${i.user.id}`);
        logger.debug(`[${PREFIX}] env.DISCORD_OWNER_ID: ${env.DISCORD_OWNER_ID}`);
        const sentByOwner = i.user.id === env.DISCORD_OWNER_ID;
        if (!sentByOwner) {
          issueBody += `This issue was submitted by ${(i.member as GuildMember).displayName} in ${i.guild}`;
        }

        // logger.debug(`[${PREFIX}] issueBody: ${JSON.stringify(issueBody, null, 2)}`);

        // @ts-ignore https://discord.js.org/#/docs/discord.js/14.6.0/typedef/ModalData
        const labels = i.components[1].components[0].customId.split(',');
        const filteredLabels = labels.filter((label:string) => label !== 'null');

        const results = await issue(
          i.fields.getTextInputValue('issueTitle'),
          issueBody,
          filteredLabels,
        );

        logger.debug(`[${PREFIX}] results: ${JSON.stringify(results, null, 2)}`);

        if (results) {
          const embed = embedTemplate()
            .setColor(0x0099ff)
            .setTitle('Issue created!')
            .setDescription(stripIndents`\
                  Issue #${results.number} created on TripSit/tripsit-discord-bot
                  Click here to view: ${results.html_url}`);
          i.reply({embeds: [embed], ephemeral: true});
        } else {
          const embed = embedTemplate()
            .setColor(0xff0000)
            .setTitle('Issue creation failed!')
            .setDescription(`Your issue could not be created on TripSit/tripsit-discord-bot`);
          i.reply({embeds: [embed], ephemeral: false});
        }

        logger.debug(`[${PREFIX}] finished!`);
      });

    return false;
  },
};
