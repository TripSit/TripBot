import { ApplicationCommandOptionType, type CommandInteractionOption } from 'discord.js';

/**
 * Options whose values are safe to keep for usage stats: fixed lists and drug names, never user mentions,
 * IDs or free text. Every other option is recorded by name only, so stats show how a command is used
 * without keeping what people typed.
 */
export const STAT_VALUE_OPTIONS = new Set(['substance', 'section', 'first_drug', 'second_drug']);

const MAX_VALUE_LENGTH = 100;

export function statParameters(
  options: readonly CommandInteractionOption[],
): { name: string; value: string }[] {
  return options.flatMap(opt => {
    if (opt.type === ApplicationCommandOptionType.Subcommand
      || opt.type === ApplicationCommandOptionType.SubcommandGroup) {
      return statParameters(opt.options ?? []);
    }
    const keepValue = opt.type === ApplicationCommandOptionType.Boolean || STAT_VALUE_OPTIONS.has(opt.name);
    return [{ name: opt.name, value: keepValue ? String(opt.value ?? '').slice(0, MAX_VALUE_LENGTH) : '' }];
  });
}
