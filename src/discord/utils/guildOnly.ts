import {
  MessageFlags,
  RepliableInteraction,
} from 'discord.js';

export const GUILD_ONLY_TEXT = 'This command can only be used in a guild.';

export interface ReplyGuildOnlyOptions {
  /** Only applies if the interaction hasn't been deferred/replied yet. Default false (public), like a plain reply(). */
  ephemeral?: boolean;
}

/**
 * Tells the user this action only works in a guild.
 * Uses editReply if the interaction was already deferred/replied (visibility follows the defer),
 * otherwise reply(), ephemeral only if `options.ephemeral` is true.
 */
export async function replyGuildOnly(
  interaction: RepliableInteraction,
  options: ReplyGuildOnlyOptions = {},
): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: GUILD_ONLY_TEXT });
  } else if (options.ephemeral) {
    await interaction.reply({ content: GUILD_ONLY_TEXT, flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ content: GUILD_ONLY_TEXT });
  }
}

export default replyGuildOnly;
