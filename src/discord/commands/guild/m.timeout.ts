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
import { parseDuration } from '../../../global/utils/parseDuration';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import { UserActionType } from '../../../global/@types/database';

const F = f(__filename);

export default mTimeout;

export const mTimeout: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Timeout')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    startLog(F, interaction);
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMessage.member as GuildMember;
    const message = interaction.targetMessage.cleanContent;
    const messageUrl = interaction.targetMessage.url;

    const modal = new ModalBuilder()
      .setCustomId(`timeoutModal~${interaction.id}`)
      .setTitle('Tripbot Timeout');
    const privReasonInput = new TextInputBuilder()
      .setLabel('Why are you timeouting this person?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you are timeouting this user.')
      .setRequired(true)
      .setCustomId('privReason');
    const pubReasonInput = new TextInputBuilder()
      .setLabel('What should we tell the user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('This will be sent to the user!')
      .setRequired(true)
      .setCustomId('pubReason');
    const timeoutDuration = new TextInputBuilder()
      .setLabel('Timeout for how long? (Max/default 7 days)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('4 days 3hrs 2 mins 30 seconds')
      .setCustomId('timeoutDuration');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReasonInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(pubReasonInput);
    const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeoutDuration);
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    await interaction.showModal(modal);
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('timeoutModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const privReason = stripIndents`
        > ${i.fields.getTextInputValue('privReason')}
    
        **The offending message**
        > ${message}
        ${messageUrl}
        `;

        const duration = i.fields.getTextInputValue('timeoutDuration');

        // Get duration
        let minutes = 604800000;
        if (duration) {
          minutes = duration
            ? await parseDuration(duration)
            : 604800000;
          // log.debug(F, `minutes: ${minutes}`);
        }

        const result = await moderate(
          actor,
          'TIMEOUT' as UserActionType,
          target,
          privReason,
          i.fields.getTextInputValue('pubReason'),
          minutes,
        );
          // log.debug(F, `Result: ${result}`);
        await i.editReply(result);
      });
    return true;
  },
};
