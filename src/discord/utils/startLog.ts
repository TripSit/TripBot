import {
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  ButtonInteraction,
  SelectMenuInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';

export default startLog;

/**
 * @param {string} prefix
 * @param {ChatInputCommandInteraction} interaction
 * @return {Promise<void>}
* */
export async function startLog(
  prefix: string,
  interaction: ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction
  | ButtonInteraction
  | SelectMenuInteraction
  | ModalSubmitInteraction,
): Promise<void> {
  const guild = interaction.guild ? `in ${interaction.guild.name} (${interaction.guild?.id})` : 'in DM';
  let message = `[${prefix}] via ${interaction.user.tag} (${interaction.user.id}) \
${guild}`;
  if (Object.hasOwn(interaction, 'options')) {
    const interationOptions = (interaction as ChatInputCommandInteraction).options;
    if (interationOptions.data && interationOptions.data.length > 0) {
      // log.debug(`[${PREFIX}] ${JSON.stringify(interationOptions.data[0].options, null, 2)}`);
      if (interationOptions.data[0].options !== undefined) {
        message += ` subCommand: ${interationOptions.getSubcommand()}`;
        if (interationOptions.data[0].options.length > 0) {
          const paramStr = interationOptions.data[0].options?.map(o => `${o.name}: ${o.value}`);
          message += ` with params: ${paramStr.join(', ')}`;
        }
      } else {
        const paramStr = interationOptions.data.map(o => `${o.name}: ${o.value}`);
        message += ` with params: ${paramStr.join(', ')}`;
      }
    }
  }
  if ((interaction as ButtonInteraction).customId) {
    message += ` with customId: ${(interaction as ButtonInteraction).customId}`;
  }
  if ((interaction as SelectMenuInteraction).customId) {
    message += ` with customId: ${(interaction as ButtonInteraction).customId}`;
  }
  log.info(stripIndents`${message}`);
}
