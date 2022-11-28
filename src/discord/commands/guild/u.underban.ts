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
import { UserCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import { startLog } from '../../utils/startLog';
// import {startLog} from '../../utils/startLog';
import { UserActionType } from '../../../global/@types/pgdb';

const PREFIX = parse(__filename).name;

export default uUnderban;

export const uUnderban: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Underban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    // startLog(PREFIX, interaction);
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMember as GuildMember;

    const modal = new ModalBuilder()
      .setCustomId(`underbanModal~${interaction.id}`)
      .setTitle('Tripbot Ban');
    const privReasonInput = new TextInputBuilder()
      .setLabel('Why are you underbanning this user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you are underbanning this user.')
      .setRequired(true)
      .setCustomId('privReason');
    const pubReasonInput = new TextInputBuilder()
      .setLabel('What should we tell the user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('This will be sent to the user!')
      .setRequired(true)
      .setCustomId('pubReason');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReasonInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(pubReasonInput);
    modal.addComponents(firstActionRow, secondActionRow);
    await interaction.showModal(modal);

    const filter = (i:ModalSubmitInteraction) => i.customId.includes('underbanModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        const privReason = i.fields.getTextInputValue('privReason');
        const pubReason = i.fields.getTextInputValue('pubReason');
        const result = await moderate(
          actor,
          'UNDERBAN' as UserActionType,
          target,
          privReason,
          pubReason,
          null,
        );

        // log.debug(`[${PREFIX}] Result: ${result}`);
        i.reply(result);
      });
    return true;
  },
};
