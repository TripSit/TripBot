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
import {UserCommand} from '../../@types/commandDef';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const uKick: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Kick')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMember as GuildMember;

    const modal = new ModalBuilder()
      .setCustomId('kickModal')
      .setTitle('Tripbot Kick');
    const banReason = new TextInputBuilder()
      .setLabel('Why are you kicking this person?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('No reason provided')
      .setRequired(true)
      .setCustomId('kickReason');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(banReason);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);

    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`kickModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (interaction) => {
        const reason = interaction.fields.getTextInputValue('kickReason');
        const result = await moderate(actor, 'kick', target, undefined, 'on', reason, undefined, interaction);

        logger.debug(`[${PREFIX}] Result: ${result}`);
        interaction.reply(result);

        logger.debug(`[${PREFIX}] finished!`);
      });
  },
};
