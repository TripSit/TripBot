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
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import { UserActionType } from '../../../global/@types/database';

const F = f(__filename);

export const mTimeout: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Timeout')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`timeoutModal~${interaction.id}`)
      .setTitle('Tripbot Timeout')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('Why are you timeouting this person?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell the team why you are timeouting this user.')
          .setRequired(true)
          .setCustomId('internalNote')),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('What should we tell the user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('This will be sent to the user!')
          .setRequired(false)
          .setCustomId('description')),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setLabel('Timeout for how long? (Max/default 7 days)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('4 days 3hrs 2 mins 30 seconds')
          .setRequired(false)
          .setCustomId('timeoutDuration')),
      ));
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('timeoutModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const duration = i.fields.getTextInputValue('timeoutDuration')
          ? await parseDuration(i.fields.getTextInputValue('timeoutDuration'))
          : 604800000;

        if (duration > 604800000) {
          await i.editReply('Timeout duration cannot be longer than 7 days.');
          return;
        }

        await i.editReply(await moderate(
          interaction.member as GuildMember,
          'TIMEOUT' as UserActionType,
          interaction.targetMessage.member ?? interaction.targetMessage.author,
          stripIndents`
            > ${i.fields.getTextInputValue('internalNote')}
        
            **The offending message**
            > ${interaction.targetMessage.cleanContent}
            ${interaction.targetMessage.url}
          `,
          i.fields.getTextInputValue('description'),
          duration,
        ));
      });
    return true;
  },
};

export default mTimeout;
