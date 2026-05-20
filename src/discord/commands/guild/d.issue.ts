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
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { issue } from '../../../global/commands/g.issue';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
// import log from '../../../global/utils/log';

const F = f(__filename);

export const dIssue: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('issue')
    .setNameLocalizations(getCommandLocalizations('issue', 'commandName'))
    .setDescription(t('en-US', 'issue', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('issue', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setDescription(t('en-US', 'issue', 'typeOption'))
      .setDescriptionLocalizations(getCommandLocalizations('issue', 'typeOption'))
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
      .setDescription(t('en-US', 'issue', 'priorityOption'))
      .setDescriptionLocalizations(getCommandLocalizations('issue', 'priorityOption'))
      .addChoices(
        { name: 'Critical', value: 'P0: Critical' },
        { name: 'High', value: 'P1: High' },
        { name: 'Medium', value: 'P2: Medium' },
        { name: 'Low', value: 'P3: Low' },
      )
      .setName('priority'))
    .addStringOption(option => option
      .setDescription(t('en-US', 'issue', 'effortOption'))
      .setDescriptionLocalizations(getCommandLocalizations('issue', 'effortOption'))
      .addChoices(
        { name: 'High', value: 'E0: High' },
        { name: 'Medium', value: 'E1: Medium' },
        { name: 'Low', value: 'E2: Low' },
        { name: 'Trivial', value: 'E3: Trivial' },
      )
      .setName('effort')) as SlashCommandBuilder,
  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'issue');
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId(`issueModal~${interaction.id}`)
        .setTitle(t(locale, 'issue', 'modalTitle'))
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>()
            .addComponents(new TextInputBuilder()
              .setLabel(t(locale, 'issue', 'issueTitleLabel'))
              .setPlaceholder(t(locale, 'issue', 'issueTitlePlaceholder'))
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setCustomId('issueTitle')),
          new ActionRowBuilder<TextInputBuilder>()
            .addComponents(new TextInputBuilder()
              .setLabel(t(locale, 'issue', 'issueBodyLabel'))
              .setPlaceholder(t(locale, 'issue', 'issueBodyPlaceholder'))
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setCustomId('issueBody')),
        ),
    );
    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('issueModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ flags: MessageFlags.Ephemeral });
        const issueBody = `${i.fields.getTextInputValue('issueBody')}\n\n${t(locale, 'issue', 'issueBodySuffix', { name: (i.member as GuildMember).displayName, guild: i.guild?.name ?? '' })}`;

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
              .setTitle(t(locale, 'issue', 'embedTitle'))
              .setDescription(t(locale, 'issue', 'embedDescription', { number: String(results.data.number), url: results.data.html_url })),
          ],
        });
      });

    return false;
  },
};

export default dIssue;
