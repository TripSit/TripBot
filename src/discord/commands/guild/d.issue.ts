import type { ChatInputCommandInteraction, GuildMember, ModalSubmitInteraction } from 'discord.js';

import { stripIndents } from 'common-tags';
import { MessageFlags, TextInputStyle } from 'discord-api-types/v10';
import { ActionRowBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { issue } from '../../../global/commands/g.issue';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';

const F = f(__filename);

export const dIssue: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('issue')
    .setDescription('Create issue on github')
    .setIntegrationTypes([0])
    .addStringOption((option) =>
      option
        .setDescription('What type of issue is this?')
        .addChoices(
          { name: 'Bug/Problem', value: 'Bug' },
          { name: 'Feature Request', value: 'Feature' },
          { name: 'Enhancement', value: 'Enhancement' },
          { name: 'Idea', value: 'Idea' },
          { name: 'Question', value: 'Question' },
        )
        .setRequired(true)
        .setName('type'),
    )
    .addStringOption((option) =>
      option
        .setDescription('How important is this?')
        .addChoices(
          { name: 'Critical', value: 'P0: Critical' },
          { name: 'High', value: 'P1: High' },
          { name: 'Medium', value: 'P2: Medium' },
          { name: 'Low', value: 'P3: Low' },
        )
        .setName('priority'),
    )
    .addStringOption((option) =>
      option
        .setDescription('How much effort will this take?')
        .addChoices(
          { name: 'High', value: 'E0: High' },
          { name: 'Medium', value: 'E1: Medium' },
          { name: 'Low', value: 'E2: Low' },
          { name: 'Trivial', value: 'E3: Trivial' },
        )
        .setName('effort'),
    ) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId(`issueModal~${interaction.id}`)
        .setTitle('TripBot Issue Creation')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setLabel('Issue Title')
              .setPlaceholder('Summarize the issue here!')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setCustomId('issueTitle'),
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setLabel('Issue Body')
              .setPlaceholder(
                'Please describe the issue in detail! Include steps to reproduce, any specific circumstances, etc.',
              )
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)

              .setCustomId('issueBody'),
          ),
        ),
    );
    const filter = (index: ModalSubmitInteraction) => index.customId.startsWith('issueModal');
    interaction.awaitModalSubmit({ filter, time: 0 }).then(async (index) => {
      if (index.customId.split('~')[1] !== interaction.id) {
        return;
      }
      await index.deferReply({ flags: MessageFlags.Ephemeral });
      const issueBody = `${index.fields.getTextInputValue('issueBody')}
        
        This issue was submitted by ${(index.member as GuildMember).displayName} in ${index.guild}`;

      const labels = [
        `${interaction.options.getString('type')}`,
        `${interaction.options.getString('priority')}`,
        `${interaction.options.getString('effort')}`,
        'S0: Review Needed',
      ];

      const results = await issue(index.fields.getTextInputValue('issueTitle'), issueBody, labels);

      // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

      await index.editReply({
        embeds: [
          embedTemplate().setColor(0x00_99_ff).setTitle('Issue created!')
            .setDescription(stripIndents`\
                  Issue #${results.data.number} created on TripSit/TripBot!
                  Click here to view: ${results.data.html_url}`),
        ],
      });
    });

    return false;
  },
};

export default dIssue;
