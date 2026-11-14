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
import { statParameters } from './commandStats';

export default async function commandContext(
  interaction: ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction
  | ButtonInteraction
  | AnySelectMenuInteraction
  | ModalSubmitInteraction,
) {
  const source = interaction.guild ? `${interaction.guild.name}` : 'DM';
  let message = `via ${interaction.user.id} in ${source}`;
  if (Object.hasOwn(interaction, 'options')) {
    const interactionOptions = (interaction as ChatInputCommandInteraction).options;
    if (interactionOptions.data && interactionOptions.data.length > 0) {
      if (interactionOptions.data[0].options !== undefined) {
        message += ` subCommand: ${interactionOptions.getSubcommand()}`;
      }
      // Values are logged only for non-sensitive options; what people typed stays out of the logs.
      const params = statParameters(interactionOptions.data);
      if (params.length > 0) {
        const paramStr = params.map(o => (o.value ? o.name.concat(': ', o.value) : o.name));
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
