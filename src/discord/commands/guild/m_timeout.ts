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

export const mTimeout: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Timeout')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMessage.member as GuildMember;
    const channel = interaction.channel as TextChannel;
    const message = interaction.targetMessage.cleanContent;
    const messageUrl = interaction.targetMessage.url;

    const modal = new ModalBuilder()
      .setCustomId('timeoutModal')
      .setTitle('Tripbot Timeout');
    const timeoutReason = new TextInputBuilder()
      .setLabel('Why are you timouting this person?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Why are you timeouting this person?')
      .setRequired(true)
      .setCustomId('timeoutReason');
    const timeoutDuration = new TextInputBuilder()
      .setLabel('Timeout for how long? (Max/default 7 days)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('4 days 3hrs 2 mins 30 seconds')
      .setCustomId('timeoutDuration');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeoutReason);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeoutDuration);
    modal.addComponents(firstActionRow, secondActionRow);
    await interaction.showModal(modal);
    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`timeoutModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (interaction) => {
        const reason = stripIndents`
        > ${interaction.fields.getTextInputValue('timeoutReason')}
    
        [The offending message:](${messageUrl})
        > ${message}
    
        `;

        const duration = interaction.fields.getTextInputValue('timeoutDuration');
        const result = await moderate(actor, 'timeout', target, channel, undefined, reason, duration, interaction);
        logger.debug(`[${PREFIX}] Result: ${result}`);
        interaction.reply(result);
      });
  },
};
