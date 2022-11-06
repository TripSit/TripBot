/* eslint-disable max-len */
import {
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  ButtonInteraction,
  // CommandInteractionOption,`
  SelectMenuInteraction,
  // ModalSubmitInteraction,
} from 'discord.js';
import log from '../../global/utils/log';
import {stripIndents} from 'common-tags';
import {parse} from 'path'; // eslint-disable-line no-unused-vars
const PREFIX = parse(__filename).name; // eslint-disable-line no-unused-vars

/**
 * @param {string} prefix
 * @param {ChatInputCommandInteraction} interaction
 * @return {Promise<void>}
**/
export async function startLog(
  prefix: string,
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction | ButtonInteraction | SelectMenuInteraction,
): Promise<void> {
  let message = `[${prefix}] via ${interaction.user.tag} (${interaction.user.id}) \
${interaction.guild ? `in ${interaction.guild.name} (${interaction.guild?.id})` : `in DM`}`;
  if (Object.hasOwn(interaction, 'options')) {
    const interationOptions = (interaction as ChatInputCommandInteraction).options;
    if (interationOptions.data) {
      if (interationOptions.data.length > 0) {
        // log.debug(`[${PREFIX}] ${JSON.stringify(interationOptions.data[0].options, null, 2)}`);
        if (interationOptions.data[0].options !== undefined) {
          message += ` subCommand: ${interationOptions.getSubcommand()}`;
          if (interationOptions.data[0].options.length > 0) {
            message += ` with params: ${interationOptions.data[0].options?.map((o) => `${o.name}: ${o.value}`).join(', ')}`;
          }
        } else {
          message += ` with params: ${interationOptions.data.map((o) => `${o.name}: ${o.value}`).join(', ')}`;
        }
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
};
