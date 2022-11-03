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
import {MessageCommand} from '../../@types/commandDef';
import {stripIndents} from 'common-tags';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const mNote: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Note')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMessage.member as GuildMember;
    const message = interaction.targetMessage.cleanContent;
    const messageUrl = interaction.targetMessage.url;

    logger.debug(`${PREFIX} target: ${target}`);

    const modal = new ModalBuilder()
      .setCustomId('noteModal')
      .setTitle('Tripbot Note');
    const privReason = new TextInputBuilder()
      .setLabel('What are you noting about this person?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you are noting this user.')
      .setRequired(true)
      .setCustomId('privReason');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReason);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`noteModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (interaction) => {
        const privReason = stripIndents`
        ${interaction.fields.getTextInputValue('privReason')}
    
        [The offending message:](${messageUrl})
        > ${message}
    
        `;

        const result = await moderate(
          actor,
          'note',
          target,
          privReason,
          null,
          null,
          interaction,
        );
        logger.debug(`[${PREFIX}] Result: ${result}`);
        interaction.reply(result);

        logger.debug(`[${PREFIX}] finished!`);
      });
  },
};
