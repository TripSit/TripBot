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
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import { UserActionType } from '../../../global/@types/database';

const F = f(__filename);

export default mNote;

export const mNote: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Note')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`noteModal~${interaction.id}`)
      .setTitle('Tripbot Note')
      .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('What are you noting about this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the team why you are noting this user.')
        .setRequired(true)
        .setCustomId('internalNote'))));
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('noteModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        await i.editReply(await moderate(
          interaction.member as GuildMember,
          'NOTE' as UserActionType,
          interaction.targetMessage.member ?? interaction.targetMessage.author,
          stripIndents`
            ${i.fields.getTextInputValue('internalNote')}
        
            **The offending message**
            > ${interaction.targetMessage.cleanContent}
            ${interaction.targetMessage.url}
          `,
          null,
          null,
        ));
      });
    return true;
  },
};
