import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ContextMenuCommandBuilder,
  GuildMember,
  ModalSubmitInteraction,
  TextChannel,
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

export const mReport: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Report')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMessage.member as GuildMember;
    const channel = interaction.channel as TextChannel;
    const message = interaction.targetMessage.cleanContent;
    const messageUrl = interaction.targetMessage.url;

    const modal = new ModalBuilder()
      .setCustomId('reportModal')
      .setTitle('Tripbot Report');
    const reportReason = new TextInputBuilder()
      .setLabel('Why are you reporting this?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Please be descriptive!')
      .setRequired(true)
      .setCustomId('reportReason');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reportReason);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`reportModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (interaction) => {
        const reason = stripIndents`
        > ${interaction.fields.getTextInputValue('reportReason')}
    
        [The offending message:](${messageUrl})
        > ${message}
    
        `;

        const result = await moderate(actor, 'report', target, channel, undefined, reason, undefined, interaction);
        logger.debug(`[${PREFIX}] Result: ${result}`);
        interaction.reply(result);

        logger.debug(`[${PREFIX}] finished!`);
      });
  },
};
