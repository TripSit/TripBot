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
import { parse } from 'path';
import { parseDuration } from '../../../global/utils/parseDuration';
import { UserCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import { startLog } from '../../utils/startLog';
import { UserActionType } from '../../../global/@types/pgdb';

const PREFIX = parse(__filename).name;

export default uBan;

export const uBan: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Ban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMember as GuildMember;

    const modal = new ModalBuilder()
      .setCustomId(`banModal~${interaction.id}`)
      .setTitle('Tripbot Ban');
    const privReasonInput = new TextInputBuilder()
      .setLabel('Why are you banning this user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you are banning this user.')
      .setRequired(true)
      .setCustomId('privReason');
    const pubReasonInput = new TextInputBuilder()
      .setLabel('What should we tell the user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('This will be sent to the user!')
      .setRequired(true)
      .setCustomId('pubReason');
    const deleteMessages = new TextInputBuilder()
      .setLabel('How many days of msg to remove?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Between 0 and 7 days (Default 0)')
      .setCustomId('duration')
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReasonInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(pubReasonInput);
    const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(deleteMessages);
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    await interaction.showModal(modal);

    const filter = (i:ModalSubmitInteraction) => i.customId.includes('banModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async (i) => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        i.deferReply();
        const privReason = i.fields.getTextInputValue('privReason');
        const pubReason = i.fields.getTextInputValue('pubReason');
        const durationInput = i.fields.getTextInputValue('duration');

        let duration = 0;
        // Check if the given duration is a number between 0 and 7
        const days = parseInt(durationInput, 10);
        if (Number.isNaN(days) || days < 0 || days > 7) {
          i.reply({ content: 'Invalid number of days given', ephemeral: true });
          return;
<<<<<<< HEAD
=======
        } else {
          duration = durationInput ?
            await parseDuration(`${days} days`) :
            0;
          // log.debug(`[${PREFIX}] duration: ${duration}`);
>>>>>>> dee4fc26a25e61922ace31369c0451b2b4f1d4ab
        }
        duration = duration
          ? await parseDuration(`${durationInput} days`)
          : 0;
        // log.debug(`[${PREFIX}] duration: ${duration}`);

        const result = await moderate(
          actor,
          'BAN' as UserActionType,
          target,
          privReason,
          pubReason,
          duration,
        );

        i.editReply(result);
      });
    return true;
  },
};
