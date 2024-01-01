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
import { user_action_type } from '@prisma/client';
import { MessageCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import commandContext from '../../utils/context';

const F = f(__filename);

export const mWarn: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Warn')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`warnModal~${interaction.id}`)
      .setTitle('Tripbot Warn')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('Why are you warning this person?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell the team why you are warning this user.')
          .setMaxLength(1000)
          .setRequired(true)
          .setCustomId('internalNote')),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('What should we tell the user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('This will be sent to the user!')
          .setMaxLength(1000)
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
          'WARNING' as user_action_type,
          interaction.targetMessage.member?.id ?? interaction.targetMessage.author.id,
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

export default mWarn;
