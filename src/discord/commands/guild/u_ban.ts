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

export const uBan: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Ban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMember as GuildMember;

    const modal = new ModalBuilder()
      .setCustomId('banModal')
      .setTitle('Tripbot Ban');
    const banReason = new TextInputBuilder()
      .setLabel('Why are you banning this user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('No reason provided')
      .setRequired(true)
      .setCustomId('banReason');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(banReason);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);

    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`banModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (interaction) => {
        const reason = interaction.fields.getTextInputValue('banReason');
        const result = await moderate(actor, 'ban', target, undefined, 'on', reason, undefined, interaction);

        logger.debug(`[${PREFIX}] Result: ${result}`);
        interaction.reply(result);

        logger.debug(`[${PREFIX}] finished!`);
      });
  },
};
