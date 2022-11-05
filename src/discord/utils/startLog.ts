/* eslint-disable max-len */
import {
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  ButtonInteraction,
  // CommandInteractionOption,
  // SelectMenuInteraction,
  // ModalSubmitInteraction,
} from 'discord.js';
import log from '../../global/utils/log';
import {stripIndents} from 'common-tags';

/**
 * @param {string} prefix
 * @param {ChatInputCommandInteraction} interaction
 * @return {Promise<void>}
**/
export async function startLog(
  prefix: string,
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction | ButtonInteraction,
): Promise<void> {
  let message = `[${prefix}] via ${interaction.user.tag} (${interaction.user.id}) \
${interaction.guild ? `in ${interaction.guild.name} (${interaction.guild?.id})` : `in DM`}`;
  if (Object.hasOwn(interaction, 'options')) {
    if ((interaction as ChatInputCommandInteraction).options.data.length > 0) {
      message += ` with params: ${(interaction as ChatInputCommandInteraction).options.data[0].options?.map((o) => `${o.name}: ${o.value}`).join(', ')}`;
    } else {
      message += ` with params: ${(interaction as ChatInputCommandInteraction).options.data.map((o) => `${o.name}: ${o.value}`).join(', ')}`;
    }
  }
  if ((interaction as ButtonInteraction).customId) {
    message += ` with customId: ${(interaction as ButtonInteraction).customId}`;
  }
  log.info(stripIndents`${message}`);
};
