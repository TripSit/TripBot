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
import { UserCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import commandContext from '../../utils/context';
// import {startLog} from '../../utils/startLog';
import { UserActionType } from '../../../global/@types/database';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const uUnderban: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Underban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`underbanModal~${interaction.id}`)
      .setTitle('Tripbot Ban')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('Why are you underbanning this user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell the team why you are underbanning this user.')
          .setRequired(true)
          .setCustomId('internalNote')),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('What should we tell the user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('This will be sent to the user!')
          .setRequired(false)
          .setCustomId('description')),
      ));
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('underbanModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const target = interaction.targetMember as GuildMember;
        if (target) {
          await i.editReply(await moderate(
            interaction.member as GuildMember,
            'UNDERBAN' as UserActionType,
            interaction.targetMember as GuildMember,
            i.fields.getTextInputValue('internalNote'),
            i.fields.getTextInputValue('description'),
            null,
          ));
        } else {
          await i.editReply({
            embeds: [
              embedTemplate()
                .setTitle('Error')
                .setDescription('This user is not in the server!')],
          });
        }
      });
    return true;
  },
};

export default uUnderban;
