import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ContextMenuCommandBuilder,
  GuildMember,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  ApplicationCommandType,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { MessageCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import { startLog } from '../../utils/startLog';
import { UserActionType } from '../../../global/@types/pgdb';

const F = f(__filename);

export default mReport;

export const mReport: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Report')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    startLog(F, interaction);
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMessage.member as GuildMember;
    const message = interaction.targetMessage.cleanContent;
    const messageUrl = interaction.targetMessage.url;

    const modal = new ModalBuilder()
      .setCustomId(`reportModal~${interaction.id}`)
      .setTitle('Tripbot Report');
    const privReasonInput = new TextInputBuilder()
      .setLabel('Why are you reporting this?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Please be descriptive!')
      .setRequired(true)
      .setCustomId('privReason');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReasonInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('reportModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const privReason = stripIndents`
        ${i.fields.getTextInputValue('privReason')}
    
        **The offending message**
        > ${message}
        ${messageUrl}
        `;

        const result = await moderate(
          actor,
          'REPORT' as UserActionType,
          target,
          privReason,
          null,
          null,
        );
          // log.debug(F, `Result: ${result}`);
        await i.editReply(result);
      });
    return true;
  },
};
