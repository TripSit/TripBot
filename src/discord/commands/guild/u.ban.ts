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
import { parseDuration } from '../../../global/utils/parseDuration';
import { UserCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import { startLog } from '../../utils/startLog';
import { UserActionType } from '../../../global/@types/database';

const F = f(__filename);

export const uBan: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Ban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`banModal~${interaction.id}`)
      .setTitle('Tripbot Ban')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('Why are you banning this user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell the team why you are banning this user.')
          .setRequired(true)
          .setCustomId('internalNote')),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('What should we tell the user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('This will be sent to the user!')
          .setRequired(false)
          .setCustomId('description')),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('How many days of msg to remove?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Between 0 and 7 days (Default 0)')
          .setRequired(false)
          .setCustomId('duration')),
      ));
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('banModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const duration = i.fields.getTextInputValue('duration')
          ? await parseDuration(i.fields.getTextInputValue('duration'))
          : 0;

        if (duration > 604800000) {
          await i.editReply('Cannot remove messages older than 7 days.');
          return;
        }

        await i.editReply(await moderate(
          interaction.member as GuildMember,
          'FULL_BAN' as UserActionType,
          interaction.targetMember as GuildMember,
          i.fields.getTextInputValue('internalNote'),
          i.fields.getTextInputValue('description'),
          duration,
        ));
      });
    return true;
  },
};

export default uBan;
