import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  ModalSubmitInteraction,
  GuildMember,
  LabelBuilder,
} from 'discord.js';
import {
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { issue } from '../../../global/commands/g.issue';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dIssue: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('issue')
    .setDescription('Create issue on github')
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setDescription('What type of issue is this?')
      .addChoices(
        { name: 'Bug/Problem', value: 'Bug' },
        { name: 'Feature Request', value: 'Feature' },
        { name: 'Enhancement', value: 'Enhancement' },
        { name: 'Idea', value: 'Idea' },
        { name: 'Question', value: 'Question' },
      )
      .setRequired(true)
      .setName('type'))
    .addStringOption(option => option
      .setDescription('How important is this?')
      .addChoices(
        { name: 'Critical', value: 'P0: Critical' },
        { name: 'High', value: 'P1: High' },
        { name: 'Medium', value: 'P2: Medium' },
        { name: 'Low', value: 'P3: Low' },
      )
      .setName('priority'))
    .addStringOption(option => option
      .setDescription('How much effort will this take?')
      .addChoices(
        { name: 'High', value: 'E0: High' },
        { name: 'Medium', value: 'E1: Medium' },
        { name: 'Low', value: 'E2: Low' },
        { name: 'Trivial', value: 'E3: Trivial' },
      )
      .setName('effort')) as SlashCommandBuilder,
  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId(`issueModal~${interaction.id}`)
        .setTitle('TripBot Issue Creation')
        .addLabelComponents(
          new LabelBuilder().setLabel('Issue Title').setTextInputComponent(new TextInputBuilder()

            .setPlaceholder('Summarize the issue here!')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setCustomId('issueTitle')),
          new LabelBuilder().setLabel('Issue Body').setTextInputComponent(new TextInputBuilder()

            .setPlaceholder(
              'Please describe the issue in detail! Include steps to reproduce, any specific circumstances, etc.',
            )
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            // eslint-disable-next-line max-len
            .setCustomId('issueBody')),
        ),
    );
    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('issueModal') && i.customId.split('~')[1] === interaction.id;
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        await i.deferReply({ flags: MessageFlags.Ephemeral });
        const issueBody = `${i.fields.getTextInputValue('issueBody')}
        
        This issue was submitted by ${(i.member as GuildMember).displayName} in ${i.guild}`;

        const labels = [
          `${interaction.options.getString('type')}`,
          `${interaction.options.getString('priority')}`,
          `${interaction.options.getString('effort')}`,
          'S0: Review Needed',
        ];

        const results = await issue(
          i.fields.getTextInputValue('issueTitle'),
          issueBody,
          labels,
        );

        await i.editReply({
          embeds: [
            embedTemplate()
              .setColor(0x0099ff)
              .setTitle('Issue created!')
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
