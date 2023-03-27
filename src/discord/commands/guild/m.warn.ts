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
import { UserActionType } from '../../../global/@types/database';

const F = f(__filename);

export default mWarn;

export const mWarn: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Warn')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`warnModal~${interaction.id}`)
      .setTitle('Tripbot Warn')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('Why are you warning this person?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell the team why you are warning this user.')
          .setRequired(true)
          .setCustomId('internalNote')),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('What should we tell the user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('This will be sent to the user!')
          .setRequired(true)
          .setCustomId('description')),
      ));
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('warnModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        await i.editReply(await moderate(
          interaction.member as GuildMember,
          'WARNING' as UserActionType,
          interaction.targetMessage.member ?? interaction.targetMessage.author,
          stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${interaction.targetMessage.cleanContent}
        ${interaction.targetMessage.url}
        `,
          i.fields.getTextInputValue('description'),
          null,
        ));
      });
    return true;
  },
};
