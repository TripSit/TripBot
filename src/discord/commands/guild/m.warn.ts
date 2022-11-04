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
import log from '../../../global/utils/log';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const mWarn: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Warn')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMessage.member as GuildMember;
    const message = interaction.targetMessage.cleanContent;
    const messageUrl = interaction.targetMessage.url;

    const modal = new ModalBuilder()
      .setCustomId(`warnModal~${interaction.id}`)
      .setTitle('Tripbot Warn');
    const privReason = new TextInputBuilder()
      .setLabel('Why are you warning this person?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you are warning this user.')
      .setRequired(true)
      .setCustomId('privReason');
    const pubReason = new TextInputBuilder()
      .setLabel('What should we tell the user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('This will be sent to the user!')
      .setRequired(true)
      .setCustomId('pubReason');
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReason);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(pubReason);
    modal.addComponents(firstActionRow, secondActionRow);
    await interaction.showModal(modal);
    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`warnModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (i) => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        const privReason = stripIndents`
        ${i.fields.getTextInputValue('privReason')}
    
        [The offending message:](${messageUrl})
        > ${message}
    
        `;

        const result = await moderate(
          actor,
          'warn',
          target,
          privReason,
          i.fields.getTextInputValue('pubReason'),
          null,
          i);
        log.debug(`[${PREFIX}] Result: ${result}`);
        i.reply(result);
      });
    return true;
  },
};
