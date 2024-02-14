import {
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  AnySelectMenuInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';

export default async function commandContext(
  interaction: ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction
  | ButtonInteraction
  | AnySelectMenuInteraction
  | ModalSubmitInteraction,
) {
  const source = interaction.guild ? `${interaction.guild.name}` : 'DM';
  let message = `via ${interaction.user.username} in ${source}`;
  if (Object.hasOwn(interaction, 'options')) {
    const interactionOptions = (interaction as ChatInputCommandInteraction).options;
    if (interactionOptions.data && interactionOptions.data.length > 0) {
      // log.debug(F, `${JSON.stringify(interactionOptions.data[0].options, null, 2)}`);
      if (interactionOptions.data[0].options !== undefined) {
        message += ` subCommand: ${interactionOptions.getSubcommand()}`;
        if (interactionOptions.data[0].options.length > 0) {
          const paramStr = interactionOptions.data[0].options.map(o => `${o.name}: ${o.value}`);
          message += ` with params: ${paramStr.join(', ')}`;
        }
      } else {
        const paramStr = interactionOptions.data.map(o => `${o.name}: ${o.value}`);
        message += ` with params: ${paramStr.join(', ')}`;
      }
    }
  }
  if ((interaction as ButtonInteraction).customId) {
    message += ` with customId: ${(interaction as ButtonInteraction).customId}`;
  }
  if ((interaction as StringSelectMenuInteraction).customId) {
    message += ` with customId: ${(interaction as ButtonInteraction).customId}`;
  }
  // logger.info(stripIndents`[${prefix}] ${message}`);
  return stripIndents`${message}`;
}
